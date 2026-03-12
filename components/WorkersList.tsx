"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Worker, getWorkers } from "@/lib/api"
import { useWorkerStreamContext } from "@/components/WorkerStreamProvider"
import { useAuth } from "@/components/AuthProvider"

function OnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
      />
      {online ? "Online" : "Offline"}
    </span>
  )
}

function WorkersListSkeleton() {
  return (
    <div className="flex flex-col mt-6 space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md">
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
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
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        Could not load workers: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col mt-6 space-y-4">
      {workers.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 px-8 py-12 text-center text-gray-500">
          <p className="font-medium">No workers registered yet.</p>
          <p className="mt-1 text-sm">Run Bobby on your on-premise machine and visit the pairing URL it prints.</p>
        </div>
      )}
      {workers.map((w) => (
        <Link key={w.setupId} href={`/dashboard/workers/${w.setupId}`}>
          <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md transition hover:shadow-lg">
            <div>
              <h2 className="font-semibold">{w.name || w.setupId}</h2>
              <p className="mt-0.5 font-mono text-xs text-gray-400">{w.setupId}</p>
            </div>
            <OnlineBadge online={onlineMap[w.setupId] ?? w.online} />
          </div>
        </Link>
      ))}
    </div>
  )
}
