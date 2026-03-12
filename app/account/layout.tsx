import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardSidebar from "@/components/DashboardSidebar"
import { getServerAuth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getServerAuth()

  if (auth) {
    redirect("/dashboard")
  }

  return (
    <>
      {children}
    </>
  )
}
