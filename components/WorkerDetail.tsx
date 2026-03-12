"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Worker, Build, getWorker, getBuilds, updateWorkerName, getArtifactDownloadURL } from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import BuildConsole from "@/components/BuildConsole"
import { useAuth } from "@/components/AuthProvider"

function StatusBadge({ status, conclusion }: { status: string; conclusion: string | null }) {
  const label = conclusion || status
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    failure: "bg-red-100 text-red-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-gray-100 text-gray-600",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[label] || "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  )
}

function WorkerDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="mt-4 flex items-center gap-3">
        <div className="h-8 w-40 bg-gray-200 rounded-lg" />
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="mt-1 h-3 w-64 bg-gray-100 rounded" />
      <div className="mt-10">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white shadow-md h-16" />
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
        <Link href="/dashboard/workers" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to workers
        </Link>
        <p className="mt-8 text-gray-500">Worker not found.</p>
      </div>
    )
  }

  const displayName = name || worker.setupId

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <Link href="/dashboard/workers" className="text-sm text-gray-500 hover:text-gray-900">
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
              className="rounded-lg border border-gray-300 px-3 py-1 text-xl font-semibold outline-none focus:ring-2 focus:ring-gray-900 sm:text-2xl"
            />
            <button
              disabled={savingName}
              onClick={saveName}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setName(worker.name ?? ""); setEditingName(false) }}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="group flex items-center gap-2" title="Click to rename">
            <h1 className="text-xl font-semibold group-hover:underline sm:text-2xl">{displayName}</h1>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
          </button>
        )}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
          {online ? "● Online" : "○ Offline"}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs text-gray-400 break-all sm:text-sm">{worker.setupId}</p>

      {/* Build history */}
      <h2 className="mt-8 text-lg font-semibold sm:mt-10">Recent Builds</h2>
      <div className="mt-4 space-y-3">
        {buildList.length === 0 && <p className="text-sm text-gray-500">No builds yet.</p>}
        {buildList.map((b, index) => (
          <div key={b.id} className="rounded-2xl bg-white shadow-md overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-y-2 px-4 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{b.repo_name || `repo #${b.repo_id}`}</h3>
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {b.head_sha?.slice(0, 7)} · {new Date(b.started_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <StatusBadge status={b.status} conclusion={b.conclusion} />
                {b.artifact_url && (
                  <a
                    href={getArtifactDownloadURL(b.artifact_url)!}
                    className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                    download
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
            {index === 0 && (phases.length > 0 || activeBuild) && (
              <div className="border-t border-gray-100 px-4 pb-4 sm:px-6">
                <BuildConsole phases={phases} active={activeBuild !== null && !b.conclusion} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
