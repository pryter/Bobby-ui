import { createClient } from "@/lib/supabase/server"
import { SignJWT } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * SSO authorization endpoint (portal / identity-provider side).
 *
 * GET /api/sso/authorize?client_id=zoo&redirect_uri=<uri>&state=<rand>
 *
 *  - Authenticates the current user via Supabase (server-verified, like proxy.ts).
 *  - If not logged in, bounces through the portal's normal OAuth login (/account)
 *    with a `next` that resumes THIS authorize request after login.
 *  - Validates client_id and redirect_uri against an allowlist (no open redirect).
 *  - Mints a one-time HS256 JWT `code` (90s TTL) and 302-redirects the browser to
 *    `${redirect_uri}?code=...&state=...` with state passed back unchanged.
 *
 * The code is exchanged back-channel for the user identity at POST /api/sso/token.
 */

const CODE_TTL_SECONDS = 90

function allowedRedirectUris(): string[] {
  return (process.env.ZOO_SSO_REDIRECT_URIS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get("client_id")
  const redirectUri = searchParams.get("redirect_uri")
  const state = searchParams.get("state")

  const signingSecret = process.env.SSO_SIGNING_SECRET
  if (!signingSecret) {
    // Misconfiguration — never proceed without a signing key.
    return NextResponse.json({ error: "sso_not_configured" }, { status: 500 })
  }

  // Validate the relying party. Reject before doing anything user-facing.
  if (clientId !== "zoo") {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 })
  }
  if (!redirectUri || !allowedRedirectUris().includes(redirectUri)) {
    // Open-redirect guard: only exact-match allowlisted URIs are permitted.
    return NextResponse.json({ error: "invalid_redirect_uri" }, { status: 400 })
  }

  // Resolve the logged-in user. This route is not under the middleware matcher
  // (/dashboard/*), so x-auth-* headers are not forwarded here — verify directly
  // with Supabase using the same server-verified pattern as proxy.ts.
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    // Not logged in → send the user into the portal's normal OAuth login flow,
    // preserving a return to THIS authorize URL so it resumes after login.
    // /account reads `next` and forwards it through /auth/callback?next=...
    const authorizePath = `/api/sso/authorize${new URL(request.url).search}`
    const loginUrl = new URL("/account", request.url)
    loginUrl.searchParams.set("next", authorizePath)
    return NextResponse.redirect(loginUrl)
  }

  // Mint the one-time code. Audience is bound to the redirect_uri so a code
  // issued for one client callback can't be redeemed against another.
  const code = await new SignJWT({ email: user.email ?? "" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setAudience(redirectUri)
    .setIssuedAt()
    .setExpirationTime(`${CODE_TTL_SECONDS}s`)
    .setJti(crypto.randomUUID())
    .sign(new TextEncoder().encode(signingSecret))

  const target = new URL(redirectUri)
  target.searchParams.set("code", code)
  if (state !== null) {
    // Pass state back UNCHANGED (CSRF binding owned by the relying party).
    target.searchParams.set("state", state)
  }

  return NextResponse.redirect(target)
}
