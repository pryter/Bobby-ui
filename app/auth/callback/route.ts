import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/`)
  }

  const supabase = await createClient()
  await supabase.auth.exchangeCodeForSession(code)

  const next = searchParams.get("next") || "/dashboard"
  return NextResponse.redirect(`${origin}${next}`)
}
