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
    <div className="relative flex min-h-screen flex-row items-start text-gray-800">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
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
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-gray-500 hover:bg-gray-100 md:hidden"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {sidebar}
      </div>

      {/* Main area */}
      <div className="flex h-screen flex-1 flex-col overflow-y-auto bg-[#FCFCFC]">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1 text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold text-gray-800">Bobby</span>
        </div>
        {children}
      </div>
    </div>
  )
}
