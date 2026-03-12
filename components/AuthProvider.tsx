"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AuthUser } from "@/lib/auth"
import type { User } from "@supabase/supabase-js"

interface AuthContextValue {
  token: string
  user: AuthUser
}

const AuthContext = createContext<AuthContextValue | null>(null)

function buildAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
    avatarUrl: user.user_metadata?.avatar_url ?? "",
    provider: user.app_metadata?.provider ?? "",
  }
}

function LoadingSkeleton() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="hidden w-72 shrink-0 bg-white shadow-sm md:block">
        <div className="p-8 animate-pulse">
          <div className="h-6 w-16 bg-gray-200 rounded mb-8" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-full mt-2" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 animate-pulse">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-40 bg-gray-200 rounded-lg mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded mb-8" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl shadow-sm mt-3" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthContextValue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace("/account")
        return
      }
      setAuth({ token: session.access_token, user: buildAuthUser(session.user) })
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "TOKEN_REFRESHED") {
        setAuth((prev) => (prev ? { ...prev, token: session.access_token } : null))
      }
      if (event === "SIGNED_OUT") {
        window.location.href = "/account"
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingSkeleton />
  if (!auth) return null

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Returns the current auth token and user from React context.
 * Must be used inside a component wrapped by AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
