/**
 * Dashboard-level loading skeleton.
 * Shown while the layout's async work resolves on the very first visit.
 * Mirrors DashboardShell + DashboardSidebar so the screen is never blank.
 */
export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-screen flex-row items-start text-gray-800">
      {/* Sidebar skeleton */}
      <div
        className="flex min-h-screen flex-col bg-white"
        style={{ padding: "1.5rem 2rem", width: "17rem" }}
      >
        {/* Logo */}
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />

        {/* Nav items */}
        <div className="mt-6 flex w-60 flex-col gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-4 rounded-full px-4 py-2"
            >
              <div className="h-6 w-6 shrink-0 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>

        {/* User card at bottom */}
        <div className="mt-auto animate-pulse rounded-xl bg-gray-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-700" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded bg-gray-700" />
              <div className="h-2.5 w-32 rounded bg-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-5xl animate-pulse px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="h-7 w-36 rounded bg-gray-200" />
            <div className="h-9 w-52 rounded-lg bg-gray-100" />
          </div>
          <div className="mt-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
