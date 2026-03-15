import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin

  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.exchangeCodeForSession(code)

  const next = searchParams.get("next") || "/dashboard"

  if (!session) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Cache the user's profile in a long-lived HttpOnly cookie so middleware
  // never needs to call getUserIdentities() on subsequent requests.
  const identity = session.user.identities?.[0]?.identity_data
  const profile = {
    id: session.user.id,
    email: identity?.email ?? session.user.email ?? "",
    fullName: identity?.full_name ?? (identity?.name as string | undefined) ?? "",
    avatarUrl: (identity?.avatar_url as string | undefined) ?? "",
    provider: (session.user.app_metadata?.provider as string | undefined) ?? "unknown",
  }

  const response = NextResponse.redirect(`${origin}${next}`)
  response.cookies.set("bobby-profile", Buffer.from(JSON.stringify(profile)).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year — cleared on sign-out
  })
  return response
}
