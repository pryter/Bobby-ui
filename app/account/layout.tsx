"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    ;(async () => {
      // Check if we have a locally-cached session first (cheap, reads cookie).
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) return

      // A session cookie exists — but it may be stale (e.g. the user signed out
      // from another device/tab). Verify with the Auth server before redirecting
      // to /dashboard, because the dashboard middleware (proxy.ts) calls
      // getUser() and will bounce us right back here, causing a refresh loop.
      const { data: { user }, error } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user || error) {
        // Stale / invalidated session — clear cookies so we render the login
        // card cleanly instead of bouncing between /account and /dashboard.
        await supabase.auth.signOut()
        return
      }

      window.location.replace("/dashboard")
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return <>{children}</>
}
