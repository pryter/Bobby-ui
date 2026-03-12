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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.replace("/dashboard")
    })
  }, [])

  return <>{children}</>
}
