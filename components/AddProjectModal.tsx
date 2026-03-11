"use client"

import { useEffect, useState } from "react"
import { Worker, addWorkerRepo } from "@/lib/api"
import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"
import { createClient } from "@/lib/supabase/client"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
}

type Preset = "node" | "go" | "custom"

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onAdded: () => void
  workers: Worker[]
  token: string                   // Bobby service JWT
  initialGithubToken: string | null
}

export default function AddProjectModal({
  open,
  onClose,
  onAdded,
  workers,
  token,
  initialGithubToken,
}: AddProjectModalProps) {
  const [githubToken, setGithubToken] = useState<string | null>(initialGithubToken)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [repoError, setRepoError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.setupId ?? "")
  const [preset, setPreset] = useState<Preset>("node")
  const [customInit, setCustomInit] = useState("")
  const [customBuild, setCustomBuild] = useState("")
  const [artifactPath, setArtifactPath] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Keep the selected worker defaulted when workers load
  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      setSelectedWorkerId(workers[0].setupId)
    }
  }, [workers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch GitHub repos whenever we have a token and the modal opens
  useEffect(() => {
    if (!open || !githubToken) return
    setLoadingRepos(true)
    setRepoError(null)
    fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator", {
      headers: { Authorization: `Bearer ${githubToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GitHub API error ${r.status}`)
        return r.json() as Promise<GitHubRepo[]>
      })
      .then((data) => setRepos(data))
      .catch((e) => setRepoError(e.message))
      .finally(() => setLoadingRepos(false))
  }, [open, githubToken])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch("")
      setSelectedRepo(null)
      setAddError(null)
      setRepoError(null)
      setPreset("node")
      setCustomInit("")
      setCustomBuild("")
      setArtifactPath("")
    }
  }, [open])

  function connectGitHub() {
    const supabase = createClient()
    const redirectTo =
      `${window.location.origin}/auth/callback` +
      `?next=${encodeURIComponent("/dashboard/project?modal=1")}`

    supabase.auth.linkIdentity({
      provider: "github",
      options: {
        scopes: "repo read:user",
        redirectTo,
      },
    })
  }

  async function handleAdd() {
    if (!selectedRepo || !selectedWorkerId) return
    setAdding(true)
    setAddError(null)
    try {
      await addWorkerRepo(
        selectedWorkerId,
        {
          repoId: selectedRepo.id,
          repoName: selectedRepo.name,
          repoFullName: selectedRepo.full_name,
          preset,
          customInit: preset === "custom" ? customInit : undefined,
          customBuild: preset === "custom" ? customBuild : undefined,
          artifactPath: artifactPath || undefined,
        },
        token
      )
      onAdded()
      onClose()
    } catch (e) {
      setAddError((e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  if (!open) return null

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const githubLinked = githubToken !== null

  const workerLabel = (w: Worker) => w.name || `${w.setupId.slice(0, 8)}…`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add project</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Connect GitHub */}
        {!githubLinked && (
          <div className="flex flex-col items-center py-8 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              {/* GitHub icon */}
              <svg className="h-7 w-7 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Connect your GitHub account</p>
              <p className="mt-1 text-sm text-gray-500">
                Allow Bobby to read your repositories so you can select one to monitor.
              </p>
            </div>
            <button
              onClick={connectGitHub}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              Connect GitHub
            </button>
          </div>
        )}

        {/* Step 2: Select repo + worker + preset */}
        {githubLinked && (
          <>
            {/* Worker selector (only shown when multiple workers) */}
            {workers.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Build worker
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {workers.map((w) => (
                    <option key={w.setupId} value={w.setupId}>
                      {workerLabel(w)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Single worker label */}
            {workers.length === 1 && (
              <p className="mb-4 text-sm text-gray-500">
                Worker: <span className="font-medium text-gray-800">{workerLabel(workers[0])}</span>
              </p>
            )}

            {/* No workers */}
            {workers.length === 0 && (
              <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                No workers registered yet. Register a worker first, then come back to add a project.
              </p>
            )}

            {/* Repo search */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository
            </label>
            <input
              type="text"
              placeholder="Search repositories…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedRepo(null) }}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            />

            {/* Repo list */}
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-gray-100">
              {loadingRepos && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  Loading repositories…
                </div>
              )}
              {repoError && (
                <div className="px-4 py-3 text-sm text-red-600">{repoError}</div>
              )}
              {!loadingRepos && !repoError && filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No repositories found.
                </div>
              )}
              {filtered.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id
                return (
                  <button
                    key={repo.id}
                    onClick={() => setSelectedRepo(isSelected ? null : repo)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{repo.full_name}</p>
                      {repo.description && (
                        <p className={`text-xs mt-0.5 ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                          {repo.description}
                        </p>
                      )}
                    </div>
                    {repo.private && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-gray-200" : "bg-gray-100 text-gray-500"}`}>
                        Private
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Build preset */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Build preset
              </label>
              <div className="flex gap-2">
                {(["node", "go", "custom"] as Preset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      preset === p
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {p === "node" ? "Node" : p === "go" ? "Go" : "Custom"}
                  </button>
                ))}
              </div>

              {preset === "node" && (
                <p className="mt-2 text-xs text-gray-400">
                  Runs <code className="font-mono bg-gray-100 px-1 rounded">yarn</code> then{" "}
                  <code className="font-mono bg-gray-100 px-1 rounded">yarn build</code>. Artifact: <code className="font-mono bg-gray-100 px-1 rounded">.next/</code>
                </p>
              )}
              {preset === "go" && (
                <p className="mt-2 text-xs text-gray-400">
                  Runs <code className="font-mono bg-gray-100 px-1 rounded">go mod download</code> then{" "}
                  <code className="font-mono bg-gray-100 px-1 rounded">go build ./...</code>
                </p>
              )}

              {preset === "custom" && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Init command</label>
                    <input
                      type="text"
                      placeholder="e.g. npm install"
                      value={customInit}
                      onChange={(e) => setCustomInit(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Build command</label>
                    <input
                      type="text"
                      placeholder="e.g. npm run build"
                      value={customBuild}
                      onChange={(e) => setCustomBuild(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              )}

              {/* Artifact path override (optional for all presets) */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Artifact folder override <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. dist or out"
                  value={artifactPath}
                  onChange={(e) => setArtifactPath(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            {addError && (
              <p className="mt-3 text-sm text-red-600">{addError}</p>
            )}

            {/* Footer */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedRepo || !selectedWorkerId || adding || workers.length === 0}
                className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                {adding ? "Adding…" : "Add project"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
