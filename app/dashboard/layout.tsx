import { redirect } from "next/navigation"
import { getServerSession, getServerUserIdentities } from "@/lib/auth"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardShell from "@/components/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, identities] = await Promise.all([
    getServerSession(),
    getServerUserIdentities(),
  ])

  if (!session) {
    redirect("/account")
  }

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
