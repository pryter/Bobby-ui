"use client"

import { use } from "react"
import { PuzzlePieceIcon } from "@heroicons/react/24/outline"
import { TrackerIntegrationCard } from "@/components/TrackerIntegrationCard"

export default function IntegrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center gap-3">
        <PuzzlePieceIcon className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-semibold">Integrations</h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">Connect this project to Bobby&apos;s other apps and third-party services.</p>

      <div className="mt-8 flex flex-col gap-4">
        <TrackerIntegrationCard projectId={id} />
      </div>
    </div>
  )
}
