"use client"

import { useEffect, useMemo, useState } from "react"
import { Build } from "./api"
import { BuildPhase, parseLogPhases } from "./buildPhases"
import { useWorkerStreamContext } from "@/components/WorkerStreamProvider"

interface UseWorkerStreamResult {
  online: boolean
  activeBuild: Build | null
  logs: string[]
  phases: BuildPhase[]
}

export function useWorkerStream(
  setupId: string,
  initialOnline: boolean
): UseWorkerStreamResult {
  const { subscribe } = useWorkerStreamContext()
  const [online, setOnline] = useState(initialOnline)
  const [activeBuild, setActiveBuild] = useState<Build | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    return subscribe((evt) => {
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
            if (prev && prev.id !== p.buildId) return prev
            if (prev) {
              return {
                ...prev,
                status: (p.status ?? prev.status) as string,
                conclusion: (p.conclusion as string) || prev.conclusion,
                artifact_url: (p.artifactUrl ?? prev.artifact_url) as string | null,
                finished_at: (p.finishedAt ?? prev.finished_at) as string | null,
              }
            }
            setLogs([])
            return {
              id: p.buildId as string,
              setup_id: setupId,
              repo_id: (p.repoId as number) ?? 0,
              repo_name: (p.repoName as string) ?? "",
              head_sha: (p.headSha as string) ?? "",
              status: (p.status as string) ?? "in_progress",
              conclusion: (p.conclusion as string) || null,
              artifact_url: (p.artifactUrl as string) || null,
              check_run_url: null,
              started_at: (p.startedAt as string) ?? new Date().toISOString(),
              finished_at: (p.finishedAt as string) ?? null,
            }
          })
          break
        }
        case "build_log":
          if (evt.payload.line) {
            setLogs((prev) => [...prev.slice(-999), evt.payload.line as string])
          }
          break
      }
    })
  }, [subscribe, setupId])

  const phases = useMemo(() => parseLogPhases(logs), [logs])

  return { online, activeBuild, logs, phases }
}
