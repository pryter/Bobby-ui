"use client"

import { useEffect, useRef, useState } from "react"
import { getWorkerStreamURL, Build } from "./api"

interface WorkerStreamEvent {
  type: "worker_online" | "worker_offline" | "build_update" | "build_log"
  payload: Record<string, any>
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
        case "build_update": {
          const p = evt.payload
          setActiveBuild((prev) => {
            // Ignore updates for a different in-flight build
            if (prev && prev.id !== p.buildId) return prev
            if (prev) {
              return {
                ...prev,
                status: p.status ?? prev.status,
                conclusion: p.conclusion || prev.conclusion,
                artifact_url: p.artifactUrl ?? prev.artifact_url,
                finished_at: p.finishedAt ?? prev.finished_at,
              }
            }
            // New build starting — clear previous logs
            setLogs([])
            return {
              id: p.buildId,
              setup_id: setupId,
              repo_id: p.repoId ?? 0,
              repo_name: p.repoName ?? "",
              head_sha: p.headSha ?? "",
              status: p.status ?? "in_progress",
              conclusion: p.conclusion || null,
              artifact_url: p.artifactUrl || null,
              check_run_url: null,
              started_at: p.startedAt ?? new Date().toISOString(),
              finished_at: p.finishedAt ?? null,
            }
          })
          break
        }
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
