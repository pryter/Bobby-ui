"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Worker, getWorkerStreamURL } from "@/lib/api"

interface WorkersListProps {
  workers: Worker[]
  token: string
}

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

export default function WorkersList({ workers, token }: WorkersListProps) {
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(workers.map((w) => [w.setupId, w.online]))
  )

  useEffect(() => {
    if (!token) return
    const url = getWorkerStreamURL(token)
    const ws = new WebSocket(url)

    ws.onmessage = (e) => {
      let evt: { type: string; payload: { setupId: string } }
      try {
        evt = JSON.parse(e.data)
      } catch {
        return
      }
      if (evt.type === "worker_online") {
        setOnlineMap((prev) => ({ ...prev, [evt.payload.setupId]: true }))
      } else if (evt.type === "worker_offline") {
        setOnlineMap((prev) => ({ ...prev, [evt.payload.setupId]: false }))
      }
    }

    return () => ws.close()
  }, [token])

  return (
    <div className="mt-6 space-y-4">
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
