"use client"

import { useEffect, useState } from "react"
import { addWorkerRepo, removeWorkerRepo, MonitoredRepo } from "@/lib/api"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
}

interface RepoLinkerProps {
  setupId: string
  token: string               // Bobby service JWT
  githubToken: string | null  // GitHub OAuth token from Supabase session
  linkedRepos: MonitoredRepo[]
  onChanged: () => void
}

export default function RepoLinker({
  setupId,
  token,
  githubToken,
  linkedRepos,
  onChanged,
}: RepoLinkerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  const linkedIds = new Set(linkedRepos.map((r) => r.repo_id))

  useEffect(() => {
    if (!githubToken) return
    setLoading(true)
    fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: { Authorization: `Bearer ${githubToken}` },
    })
      .then((r) => r.json())
      .then((data: GitHubRepo[]) => setRepos(data))
      .catch(() => setError("Failed to load GitHub repos"))
      .finally(() => setLoading(false))
  }, [githubToken])

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase())
  )

  async function toggle(repo: GitHubRepo) {
    setBusy(repo.id)
    try {
      if (linkedIds.has(repo.id)) {
        await removeWorkerRepo(setupId, repo.id, token)
      } else {
        await addWorkerRepo(
          setupId,
          { repoId: repo.id, repoName: repo.name, repoFullName: repo.full_name },
          token
        )
      }
      onChanged()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (!githubToken) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Sign in with GitHub to link repositories.
      </p>
    )
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Linked Repositories</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Pushes to linked repos will automatically trigger a build on this worker.
      </p>

      <input
        type="text"
        placeholder="Search repos…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2
                   border-gray-200 bg-white text-gray-900 focus:ring-bobby-lime
                   dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:ring-bobby-lime/60"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-3 space-y-2">
        {loading && (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading repositories…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500">No repositories found.</p>
        )}
        {filtered.map((repo) => {
          const linked = linkedIds.has(repo.id)
          return (
            <div
              key={repo.id}
              className="flex items-center justify-between rounded-xl border px-4 py-3
                         border-gray-200/80 bg-white/60
                         dark:border-white/[0.07] dark:bg-white/[0.02]"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.full_name}</p>
                {repo.private && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Private</span>
                )}
              </div>
              <button
                disabled={busy === repo.id}
                onClick={() => toggle(repo)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                  linked
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-500/[0.08] dark:text-red-300 dark:ring-red-500/20 dark:hover:bg-red-500/[0.12]"
                    : "bg-bobby-lime text-black hover:bg-bobby-lime/90"
                }`}
              >
                {busy === repo.id ? "…" : linked ? "Unlink" : "Link"}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
