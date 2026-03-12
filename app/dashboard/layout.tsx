import { redirect } from "next/navigation"
import { getServerAuth } from "@/lib/auth"
import { AuthProvider } from "@/components/AuthProvider"
import { WorkerStreamProvider } from "@/components/WorkerStreamProvider"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardShell from "@/components/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getServerAuth() // reads middleware headers — no network call

  if (!auth) {
    redirect("/account")
  }

  return (
    <AuthProvider initialToken={auth.token} initialUser={auth.user}>
      <WorkerStreamProvider>
        <DashboardShell sidebar={<DashboardSidebar userData={auth.user} />}>
          {children}
        </DashboardShell>
      </WorkerStreamProvider>
    </AuthProvider>
  )
}
