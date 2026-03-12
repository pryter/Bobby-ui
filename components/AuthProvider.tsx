"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AuthUser } from "@/lib/auth"

interface AuthContextValue {
  token: string
  user: AuthUser
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  initialToken,
  initialUser,
  children,
}: {
  initialToken: string
  initialUser: AuthUser
  children: ReactNode
}) {
  const [token, setToken] = useState(initialToken)
  const [user] = useState(initialUser)

  useEffect(() => {
    const supabase = createClient()

    // Keep the in-memory token up to date when Supabase auto-refreshes it
    // (happens ~1 hour after login, driven by browser visibility/focus events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "TOKEN_REFRESHED") {
        setToken(session.access_token)
      }
      if (event === "SIGNED_OUT") {
        window.location.href = "/account"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ token, user }}>{children}</AuthContext.Provider>
}

/**
 * Returns the current auth token and user from React context.
 * Client components can call this instead of receiving token as a prop —
 * the token is already in memory, no server round-trip needed.
 *
 * Must be used inside a component wrapped by AuthProvider (i.e., anywhere
 * inside the dashboard layout).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
