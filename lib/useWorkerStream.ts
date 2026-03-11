"use client"

import { useEffect, useRef, useState } from "react"
import { getWorkerStreamURL, Build } from "./api"

interface WorkerStreamEvent {
  type: "worker_online" | "worker_offline" | "build_update" | "build_log"
  payload: Record<string, string>
}

interface UseWorkerStreamResult {
  online: boolean
  activeBuild: Build | null
  logs: string[]
}

export function useWorkerStream(
  token: string,
  setupId: string,
  initialOnline: boolean
): UseWorkerStreamResult {
  const [online, setOnline] = useState(initialOnline)
  const [activeBuild, setActiveBuild] = useState<Build | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return

    const url = getWorkerStreamURL(token)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onmessage = (e) => {
      let evt: WorkerStreamEvent
      try {
        evt = JSON.parse(e.data)
      } catch {
        return
      }

      // Only handle events for this worker
      if (evt.payload?.setupId !== setupId) return

      switch (evt.type) {
        case "worker_online":
          setOnline(true)
          break
        case "worker_offline":
          setOnline(false)
          break
        case "build_update":
          setActiveBuild((prev) => {
            if (prev && prev.id !== evt.payload.buildId) return prev
            return prev
              ? {
                  ...prev,
                  status: evt.payload.status ?? prev.status,
                  conclusion: evt.payload.conclusion ?? prev.conclusion,
                }
              : null
          })
          break
        case "build_log":
          if (evt.payload.line) {
            setLogs((prev) => [...prev.slice(-499), evt.payload.line])
          }
          break
      }
    }

    ws.onerror = () => {
      // Silently ignore — best effort real-time
    }

    return () => {
      ws.close()
    }
  }, [token, setupId])

  return { online, activeBuild, logs }
}
