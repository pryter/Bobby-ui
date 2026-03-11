"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Worker, Build, MonitoredRepo, updateWorkerName, getWorkerRepos } from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import BuildConsole from "@/components/BuildConsole"
import RepoLinker from "@/components/RepoLinker"

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

interface WorkerDetailProps {
  worker: Worker
  builds: Build[]
  linkedRepos: MonitoredRepo[]
  token: string
  githubToken: string | null
}

export default function WorkerDetail({
  worker,
  builds: initialBuilds,
  linkedRepos: initialRepos,
  token,
  githubToken,
}: WorkerDetailProps) {
  const { online, activeBuild, logs } = useWorkerStream(token, worker.setupId, worker.online)

  // Worker name editing
  const [name, setName] = useState(worker.name ?? "")
  const [editingName, setEditingName] = useState(false)
  const [savingName, setSavingName] = useState(false)

  async function saveName() {
    if (!name.trim()) return
    setSavingName(true)
    try {
      await updateWorkerName(worker.setupId, name.trim(), token)
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  // Linked repos (refreshable)
  const [linkedRepos, setLinkedRepos] = useState(initialRepos)

  const refreshRepos = useCallback(async () => {
    try {
      const repos = await getWorkerRepos(worker.setupId, token)
      setLinkedRepos(repos)
    } catch {}
  }, [worker.setupId, token])

  const displayName = name || worker.setupId

  // Show the active build console if a build is running
  const showConsole = activeBuild !== null || logs.length > 0

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
      <Link href="/dashboard/workers" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to workers
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-center gap-4">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="rounded-lg border border-gray-300 px-3 py-1 text-2xl font-semibold outline-none focus:ring-2 focus:ring-gray-900"
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
          <button
            onClick={() => setEditingName(true)}
            className="group flex items-center gap-2"
            title="Click to rename"
          >
            <h1 className="text-2xl font-semibold group-hover:underline">{displayName}</h1>
            <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
              edit
            </span>
          </button>
        )}

        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            online ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
          }`}
        >
          {online ? "● Online" : "○ Offline"}
        </span>
      </div>
      <p className="mt-1 font-mono text-sm text-gray-400">{worker.setupId}</p>

      {/* Live console for active build */}
      {showConsole && (
        <BuildConsole logs={logs} active={activeBuild !== null} />
      )}

      {/* Repo linker */}
      <RepoLinker
        setupId={worker.setupId}
        token={token}
        githubToken={githubToken}
        linkedRepos={linkedRepos}
        onChanged={refreshRepos}
      />

      {/* Build history */}
      <h2 className="mt-10 text-lg font-semibold">Recent Builds</h2>
      <div className="mt-4 space-y-3">
        {initialBuilds.length === 0 && (
          <p className="text-sm text-gray-500">No builds yet.</p>
        )}
        {initialBuilds.map((b) => (
          <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md">
            <div>
              <h3 className="font-medium">{b.repo_name || `repo #${b.repo_id}`}</h3>
              <p className="mt-0.5 font-mono text-xs text-gray-400">
                {b.head_sha?.slice(0, 7)} · {new Date(b.started_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={b.status} conclusion={b.conclusion} />
              {b.artifact_url && (
                <a
                  href={b.artifact_url}
                  className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                  download
                >
                  Download artifact
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
