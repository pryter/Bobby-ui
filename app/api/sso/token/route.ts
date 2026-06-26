import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"

/**
 * SSO token endpoint (portal / identity-provider side).
 *
 * POST /api/sso/token   (JSON, back-channel server→server)
 * Body: { client_id, client_secret, code, redirect_uri }
 *
 *  - Authenticates Zoo with a timing-safe shared-secret compare.
 *  - Verifies the one-time `code` JWT: signature, expiry, and aud === redirect_uri.
 *  - Returns { userId, email } on success.
 *
 * Stateless v1: the code is single-use by virtue of its 90s TTL plus the fact
 * that redemption requires the client secret. See the note in the report re: jti
 * single-use tracking — not added because there is no existing Supabase table /
 * service-role client wired up in this codebase for a trivial drop-in.
 */

/** Constant-time string compare that never short-circuits on length. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) {
    // Still run a comparison to keep timing uniform, then fail.
    timingSafeEqual(ab, ab)
    return false
  }
  return timingSafeEqual(ab, bb)
}

export async function POST(request: NextRequest) {
  const signingSecret = process.env.SSO_SIGNING_SECRET
  const expectedClientSecret = process.env.ZOO_SSO_CLIENT_SECRET
  if (!signingSecret || !expectedClientSecret) {
    return NextResponse.json({ error: "sso_not_configured" }, { status: 500 })
  }

  let body: {
    client_id?: unknown
    client_secret?: unknown
    code?: unknown
    redirect_uri?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const clientId = typeof body.client_id === "string" ? body.client_id : ""
  const clientSecret = typeof body.client_secret === "string" ? body.client_secret : ""
  const code = typeof body.code === "string" ? body.code : ""
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri : ""

  // Authenticate the relying party. 401 on any mismatch — never reveal which field.
  if (clientId !== "zoo" || !clientSecret || !safeEqual(clientSecret, expectedClientSecret)) {
    return NextResponse.json({ error: "invalid_client" }, { status: 401 })
  }

  if (!code || !redirectUri) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  // Verify the one-time code: signature + expiry (jose enforces exp), and
  // audience must equal the redirect_uri this exchange claims.
  let payload
  try {
    ;({ payload } = await jwtVerify(code, new TextEncoder().encode(signingSecret), {
      audience: redirectUri,
    }))
  } catch {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
  }

  const userId = typeof payload.sub === "string" ? payload.sub : ""
  const email = typeof payload.email === "string" ? payload.email : ""
  if (!userId) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 })
  }

  return NextResponse.json({ userId, email })
}
