import { cache } from "react"
import { headers } from "next/headers"

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl: string
  provider: string
}

export interface ServerAuth {
  token: string
  user: AuthUser
}

/**
 * Reads the pre-validated session forwarded by middleware via request headers.
 * Zero Supabase network calls — just a header read (nanoseconds, not milliseconds).
 * Still wrapped in React cache() to deduplicate across layout + pages in one request.
 */
export const getServerAuth = cache(async (): Promise<ServerAuth | null> => {
  const h = await headers()
  const token = h.get("x-auth-token")
  const userB64 = h.get("x-auth-user")
  if (!token || !userB64) return null
  try {
    const user: AuthUser = JSON.parse(Buffer.from(userB64, "base64").toString())
    return { token, user }
  } catch {
    return null
  }
})

/**
 * Backward-compatible shim — existing pages that call getServerSession() keep working.
 * provider_token is not in the JWT and is intentionally null here; ProjectsPage
 * already handles null (only available right after OAuth login in the browser session).
 */
export const getServerSession = cache(async () => {
  const auth = await getServerAuth()
  if (!auth) return null
  return {
    access_token: auth.token,
    provider_token: null as string | null,
    user: { id: auth.user.id, email: auth.user.email },
  }
})
