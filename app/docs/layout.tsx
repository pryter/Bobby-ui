import DocsSidebar from "@/components/docs/DocsSidebar"
import DocsNavbar from "./DocsNavbar"
import { getDocTree } from "@/lib/docs"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const tree = getDocTree()

  return (
    <div className="relative min-h-screen bg-white dark:bg-bobby-bg text-black dark:text-white">
      {/* Ambient orbs — same vibe as landing, dark mode only */}
      <div className="hidden dark:block pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18] blur-3xl animate-orb-1"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.14] blur-3xl animate-orb-2"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }}
        />
      </div>

      <DocsNavbar />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8 pt-28">
        <div className="flex gap-10">
          <DocsSidebar tree={tree} />
          <main className="flex-1 min-w-0 pb-32">{children}</main>
        </div>
      </div>
    </div>
  )
}
