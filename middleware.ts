import { createServerClient } from "@supabase/ssr"
import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)

export async function middleware(request: NextRequest) {
  // Security: strip any incoming x-auth-* headers to prevent injection attacks
  const requestHeaders = new Headers(request.headers)
  requestHeaders.delete("x-auth-token")
  requestHeaders.delete("x-auth-user")

  // Build a mutable response so Supabase can write refreshed cookies back
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Fast path: verify JWT locally — zero network calls
  const tokenCookie = request.cookies
    .getAll()
    .find((c) => c.name.includes("-auth-token") && !c.name.match(/\.\d+$/))?.value

  if (tokenCookie) {
    try {
      const raw = tokenCookie.startsWith("base64-")
        ? atob(tokenCookie.slice(7))
        : tokenCookie
      const parsed = JSON.parse(raw)
      const accessToken: string | undefined = parsed?.access_token
      if (accessToken) {
        const { payload } = await jwtVerify(accessToken, JWT_SECRET)
        const exp = payload.exp as number
        // 30-second buffer before expiry to avoid serving a token that expires mid-request
        if (exp > Math.floor(Date.now() / 1000) + 30) {
          const user = buildUser(request, payload)
          requestHeaders.set("x-auth-token", accessToken)
          requestHeaders.set("x-auth-user", encodeUser(user))
          return NextResponse.next({ request: { headers: requestHeaders } })
        }
      }
    } catch {
      // Invalid/malformed token — fall through to Supabase refresh
    }
  }

  // Slow path: token expired or not present — call Supabase (handles refresh + cookie rewrite)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL("/account", request.url))
  }

  const user = buildUser(request, {
    sub: session.user.id,
    email: session.user.email,
  })
  requestHeaders.set("x-auth-token", session.access_token)
  requestHeaders.set("x-auth-user", encodeUser(user))

  // Return with both updated request headers AND the refreshed cookies
  return NextResponse.next({ request: { headers: requestHeaders } })
}

function buildUser(
  request: NextRequest,
  jwtPayload: Record<string, unknown>
): Record<string, string> {
  const profileCookie = request.cookies.get("bobby-profile")?.value
  if (profileCookie) {
    try {
      return JSON.parse(Buffer.from(profileCookie, "base64").toString())
    } catch {
      // Fall through to JWT-based user
    }
  }
  return {
    id: (jwtPayload.sub as string) ?? "",
    email: (jwtPayload.email as string) ?? "",
    fullName: "",
    avatarUrl: "",
    provider: "",
  }
}

function encodeUser(user: Record<string, string>): string {
  return Buffer.from(JSON.stringify(user)).toString("base64")
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
