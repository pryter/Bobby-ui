import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardShell from "@/components/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/account")
  }

  const { data: identities } = await supabase.auth.getUserIdentities()
  const identityData = identities?.identities?.[0]?.identity_data

  const userData = {
    email: identityData?.email || session.user.email || "",
    fullName: identityData?.full_name || "",
    avatarUrl: identityData?.avatar_url || "",
  }

  return (
    <DashboardShell sidebar={<DashboardSidebar userData={userData} />}>
      {children}
    </DashboardShell>
  )
}
