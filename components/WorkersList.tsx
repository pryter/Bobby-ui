"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Worker, getWorkers } from "@/lib/api"
import { useWorkerStreamContext } from "@/components/WorkerStreamProvider"
import { useAuth } from "@/components/AuthProvider"

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
        online
          ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/[0.08] dark:text-green-300 dark:ring-green-500/20"
          : "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/[0.10]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400 dark:bg-gray-500"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  )
}

function WorkersListSkeleton() {
  return (
    <div className="flex flex-col mt-6 space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border px-6 py-4
                     border-gray-200/80 bg-white/60
                     dark:border-white/[0.07] dark:bg-white/[0.02]"
        >
          <div>
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-white/[0.08] mb-2" />
            <div className="h-3 w-48 rounded bg-gray-100 dark:bg-white/[0.05]" />
          </div>
          <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
        </div>
      ))}
    </div>
  )
}

export default function WorkersList() {
  const { token } = useAuth()
  const { subscribe } = useWorkerStreamContext()

  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getWorkers(token)
      .then((ws) => {
        setWorkers(ws)
        setOnlineMap(Object.fromEntries(ws.map((w) => [w.setupId, w.online])))
        setLoading(false)
      })
      .catch((e) => {
        setError((e as Error).message)
        setLoading(false)
      })
  }, [token])

  useEffect(() => {
    return subscribe((evt) => {
      if (evt.type === "worker_online") {
        setOnlineMap((prev) => ({ ...prev, [evt.payload.setupId as string]: true }))
      } else if (evt.type === "worker_offline") {
        setOnlineMap((prev) => ({ ...prev, [evt.payload.setupId as string]: false }))
      }
    })
  }, [subscribe])

  if (loading) return <WorkersListSkeleton />

  if (error) {
    return (
      <div className="mt-6 rounded-lg border px-4 py-3 text-sm
                      border-red-200 bg-red-50 text-red-700
                      dark:border-red-500/20 dark:bg-red-500/[0.08] dark:text-red-300">
        Could not load workers: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col mt-6 space-y-4">
      {workers.length === 0 && (
        <div className="rounded-2xl border border-dashed px-8 py-12 text-center
                        border-gray-300 text-gray-500
                        dark:border-white/[0.10] dark:text-gray-400">
          <p className="font-medium">No workers registered yet.</p>
          <p className="mt-1 text-sm">Run Bobby on your on-premise machine and visit the pairing URL it prints.</p>
        </div>
      )}
      {workers.map((w) => (
        <Link key={w.setupId} href={`/dashboard/workers/${w.setupId}`}>
          <div className="flex items-center justify-between rounded-2xl border px-6 py-4 transition
                          border-gray-200/80 bg-white/60 hover:border-indigo-200 hover:bg-indigo-50/20
                          dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-indigo-500/25 dark:hover:bg-indigo-500/[0.04]">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{w.name || w.setupId}</h2>
              <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">{w.setupId}</p>
            </div>
            <OnlineBadge online={onlineMap[w.setupId] ?? w.online} />
          </div>
        </Link>
      ))}
    </div>
  )
}
