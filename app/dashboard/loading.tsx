/**
 * Dashboard-level loading skeleton.
 * Shown while the layout's async work resolves on the very first visit.
 * Mirrors DashboardShell + DashboardSidebar so the screen is never blank.
 */
export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-screen flex-row items-start
                    bg-white dark:bg-bobby-bg
                    text-gray-900 dark:text-white">
      {/* Sidebar skeleton */}
      <div
        className="flex min-h-screen flex-col border-r
                   border-gray-200/80 bg-white
                   dark:border-white/[0.08] dark:bg-white/[0.02] dark:backdrop-blur-xl"
        style={{ padding: "1.5rem 2rem", width: "17rem" }}
      >
        {/* Logo */}
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-white/[0.08]" />

        {/* Nav items */}
        <div className="mt-6 flex w-60 flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 rounded-full px-4 py-2"
            >
              <div className="h-6 w-6 shrink-0 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/[0.08]" />
            </div>
          ))}
        </div>

        {/* User card at bottom */}
        <div className="mt-auto animate-pulse rounded-2xl border px-4 py-3
                        border-gray-200 bg-gray-50
                        dark:border-white/[0.07] dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-white/[0.08]" />
              <div className="h-2.5 w-32 rounded bg-gray-200 dark:bg-white/[0.08]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-5xl animate-pulse px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="h-7 w-36 rounded bg-gray-200 dark:bg-white/[0.08]" />
            <div className="h-9 w-52 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
          </div>
          <div className="mt-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl border
                           border-gray-200/80 bg-white/60
                           dark:border-white/[0.07] dark:bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
