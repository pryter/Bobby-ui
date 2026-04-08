"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Worker, Build, getWorker, getBuilds, updateWorkerName, getArtifactDownloadURL, getBuildSnapshot } from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import { timelineFromSnapshotEvents, timelinePhases } from "@/lib/buildPhases"
import type { BuildPhase } from "@/lib/buildPhases"
import BuildConsole from "@/components/BuildConsole"
import { useAuth } from "@/components/AuthProvider"

function StatusBadge({ status, conclusion }: { status: string; conclusion: string | null }) {
  const label = conclusion || status
  const styles: Record<string, string> = {
    success: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/[0.08] dark:text-green-300 dark:ring-green-500/20",
    failure: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/[0.08] dark:text-red-300 dark:ring-red-500/20",
    in_progress: "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/[0.08] dark:text-yellow-300 dark:ring-yellow-500/20",
    cancelled: "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/[0.10]",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${styles[label] || "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/[0.10]"}`}>
      {label}
    </span>
  )
}

function WorkerDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/[0.08]" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-8 w-40 rounded-lg bg-gray-200 dark:bg-white/[0.08]" />
        <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-white/[0.05]" />
      </div>
      <div className="mt-1 h-3 w-64 rounded bg-gray-100 dark:bg-white/[0.05]" />
      <div className="mt-10">
        <div className="mb-4 h-6 w-32 rounded bg-gray-200 dark:bg-white/[0.08]" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl border
                         border-gray-200/80 bg-white/60
                         dark:border-white/[0.07] dark:bg-white/[0.02]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function WorkerDetail({ id }: { id: string }) {
  const { token } = useAuth()

  const [worker, setWorker] = useState<Worker | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      getWorker(id, token).catch(() => null),
      getBuilds(id, token).catch(() => [] as Build[]),
    ]).then(([w, blds]) => {
      if (!w) { setNotFound(true); setLoading(false); return }
      setWorker(w)
      setBuilds(blds)
      setLoading(false)
    })
  }, [id, token])

  const { online, activeBuild, phases } = useWorkerStream(id, worker?.online ?? false)

  // Load persisted log for the most recent completed build when no live stream is active.
  const [persistedPhases, setPersistedPhases] = useState<BuildPhase[]>([])
  // Use builds[0] (DB data) — we only need persisted logs for completed builds.
  const latestDbBuild = builds[0] ?? null

  useEffect(() => {
    if (activeBuild) { setPersistedPhases([]); return }
    if (!latestDbBuild?.conclusion || !token) return
    getBuildSnapshot(latestDbBuild.id, token).then((snap) => {
      if (snap) setPersistedPhases(timelinePhases(timelineFromSnapshotEvents(snap.events)))
    })
  }, [latestDbBuild?.id, latestDbBuild?.conclusion, activeBuild?.id, token])

  const displayPhases = phases.length > 0 ? phases : persistedPhases

  const [name, setName] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)

  useEffect(() => {
    if (worker) setName(worker.name ?? "")
  }, [worker])

  async function saveName() {
    if (!name.trim()) return
    setSavingName(true)
    try {
      await updateWorkerName(id, name.trim(), token)
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  const buildList: (Build & { isLive?: boolean })[] = activeBuild
    ? [{ ...activeBuild, isLive: true }, ...builds.filter((b) => b.id !== activeBuild.id)]
    : builds

  if (loading) return <WorkerDetailSkeleton />

  if (notFound || !worker) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
        <Link
          href="/dashboard/workers"
          className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back to workers
        </Link>
        <p className="mt-8 text-gray-500 dark:text-gray-400">Worker not found.</p>
      </div>
    )
  }

  const displayName = name || worker.setupId

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <Link
        href="/dashboard/workers"
        className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        ← Back to workers
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {editingName ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="rounded-lg border px-3 py-1 text-xl font-semibold outline-none transition-colors sm:text-2xl
                         border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-bobby-lime
                         dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:ring-bobby-lime/60"
            />
            <button
              disabled={savingName}
              onClick={saveName}
              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50
                         bg-bobby-lime text-black hover:bg-bobby-lime/90"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setName(worker.name ?? ""); setEditingName(false) }}
              className="rounded-full px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="group flex items-center gap-2" title="Click to rename">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 group-hover:underline sm:text-2xl dark:text-white">
              {displayName}
            </h1>
            <span className="text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500">
              edit
            </span>
          </button>
        )}
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
            online
              ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/[0.08] dark:text-green-300 dark:ring-green-500/20"
              : "bg-gray-100 text-gray-600 ring-gray-500/20 dark:bg-white/[0.06] dark:text-gray-400 dark:ring-white/[0.10]"
          }`}
        >
          {online ? "● Online" : "○ Offline"}
        </span>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-gray-400 sm:text-sm dark:text-gray-500">{worker.setupId}</p>

      {/* Build history */}
      <h2 className="mt-8 text-lg font-semibold text-gray-900 dark:text-white sm:mt-10">Recent Builds</h2>
      <div className="mt-4 space-y-3">
        {buildList.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No builds yet.</p>
        )}
        {buildList.map((b, index) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-2xl border
                       border-gray-200/80 bg-white/60
                       dark:border-white/[0.07] dark:bg-white/[0.02]"
          >
            <div className="flex flex-wrap items-start justify-between gap-y-2 px-4 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-gray-900 dark:text-white">
                  {b.repo_name || `repo #${b.repo_id}`}
                </h3>
                <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                  {b.head_sha?.slice(0, 7)} · {new Date(b.started_at).toLocaleString()}
                </p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-3">
                <StatusBadge status={b.status} conclusion={b.conclusion} />
                {b.artifact_url && (
                  <a
                    href={getArtifactDownloadURL(b.artifact_url)!}
                    className="rounded-full px-3 py-1 text-xs font-semibold transition-colors
                               bg-bobby-lime text-black hover:bg-bobby-lime/90"
                    download
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
            {index === 0 && (displayPhases.length > 0 || activeBuild) && (
              <div className="border-t px-4 pb-4 sm:px-6
                              border-gray-100 dark:border-white/[0.06]">
                <BuildConsole phases={displayPhases} active={activeBuild !== null && !b.conclusion} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
