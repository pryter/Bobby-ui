import { AuthProvider } from "@/components/AuthProvider"
import { WorkerStreamProvider } from "@/components/WorkerStreamProvider"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardShell from "@/components/DashboardShell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <WorkerStreamProvider>
        <DashboardShell sidebar={<DashboardSidebar />}>
          {children}
        </DashboardShell>
      </WorkerStreamProvider>
    </AuthProvider>
  )
}
