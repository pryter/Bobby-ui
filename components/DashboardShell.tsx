"use client"

import { useState } from "react"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"

interface DashboardShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export default function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-row items-start
                    bg-white dark:bg-bobby-bg
                    text-gray-900 dark:text-white transition-colors">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Close button visible only on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full p-1
                     text-gray-500 hover:bg-gray-100
                     dark:text-gray-400 dark:hover:bg-white/[0.08]
                     md:hidden"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {sidebar}
      </div>

      {/* Main area */}
      <div className="relative flex h-screen flex-1 flex-col overflow-y-auto
                      bg-[#FCFCFC] dark:bg-bobby-bg">
        {/* Subtle background texture in dark mode — matches landing hero */}
        <div
          className="pointer-events-none fixed inset-0 hidden dark:block"
          style={{
            backgroundImage:
              "radial-gradient(circle,rgba(255,255,255,0.035) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Mobile top bar */}
        <div className="relative flex items-center gap-3 border-b px-4 py-3 md:hidden
                        border-gray-200 bg-white
                        dark:border-white/[0.08] dark:bg-bobby-bg/80 dark:backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 text-gray-600 hover:bg-gray-100
                       dark:text-gray-300 dark:hover:bg-white/[0.08]"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Bobby</span>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
