"use client"

import { use } from "react"
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline"

export default function ConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center gap-3">
        <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-semibold">Configuration</h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">Build preset, commands, and worker assignment for this project.</p>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 px-8 py-16 text-center text-gray-400">
        <p className="font-medium">Coming soon</p>
        <p className="mt-1 text-sm">Project ID: <span className="font-mono">{id}</span></p>
      </div>
    </div>
  )
}
