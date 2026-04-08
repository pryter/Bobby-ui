"use client"

import { useEffect, useState } from "react"
import { Worker, addWorkerRepo } from "@/lib/api"
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  BoltIcon,
  PencilSquareIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from "@heroicons/react/24/outline"
import { createClient } from "@/lib/supabase/client"

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
}

type Preset = "node" | "go" | "python" | "custom"

interface AddProjectModalProps {
  open: boolean
  onClose: () => void
  onAdded: () => void
  workers: Worker[]
  token: string
  initialGithubToken: string | null
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "node", label: "Node.js" },
  { id: "go", label: "Go" },
  { id: "python", label: "Python" },
  { id: "custom", label: "Custom" },
]

const SUGGESTED_TAGS = ["Frontend", "Backend", "API", "Monorepo", "Library"]

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
  const [tags, setTags] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedWorkerId && workers.length > 0) {
      setSelectedWorkerId(workers[0].setupId)
    }
  }, [workers]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !githubToken) return
    setLoadingRepos(true)
    setRepoError(null)
    fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator",
      { headers: { Authorization: `Bearer ${githubToken}` } }
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`GitHub API error ${r.status}`)
        return r.json() as Promise<GitHubRepo[]>
      })
      .then((data) => setRepos(data))
      .catch((e) => setRepoError(e.message))
      .finally(() => setLoadingRepos(false))
  }, [open, githubToken])

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
      setTags([])
    }
  }, [open])

  function connectGitHub() {
    const supabase = createClient()
    const getUrl = () => {
      const base = window.location.hostname === "localhost" ? "http://localhost:3000" : "https://bobby.pryter.me"
      return new URL("/auth/callback", base).href
    }
    const redirectTo =
      `${getUrl()}` +
      `?next=${encodeURIComponent("/dashboard/project?modal=1")}`
    supabase.auth.signInWithOAuth({
      provider: "github",
      options: { scopes: "repo read:user", redirectTo },
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
          preset: preset === "python" ? "custom" : preset,
          customInit:
            preset === "custom" || preset === "python" ? customInit : undefined,
          customBuild:
            preset === "custom" || preset === "python" ? customBuild : undefined,
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
  const remainingTags = 12 - tags.length

  const presetHint: Record<Preset, string> = {
    node: "yarn → yarn build  ·  artifact: .next/",
    go: "go mod download → go build ./...",
    python: "pip install -r requirements.txt → python build.py",
    custom: "Configure your own init & build commands below",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative mx-auto flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border shadow-2xl
                      border-gray-200/80 bg-white
                      dark:border-white/[0.08] dark:bg-bobby-surface dark:backdrop-blur-xl">

        {/* ── Top header ────────────────────────────────────────────────── */}
        <div className="relative shrink-0 border-b px-6 pt-6 pb-4
                        border-gray-100 dark:border-white/[0.06]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl p-1.5 transition-colors
                       text-gray-400 hover:bg-gray-100 hover:text-gray-700
                       dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          <div className="flex items-start justify-between pr-8">
            <div>
              <div className="flex items-center gap-2">
                <CodeBracketIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
                <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                  Add a New{" "}
                  <span className="font-semibold text-gray-400 dark:text-gray-500">Project</span>
                </h2>
              </div>
              <p className="mt-1 pl-7 text-xs text-gray-400 dark:text-gray-500">
                Please provide the necessary details below
              </p>
            </div>

            {/* Decorative floating icon cards */}
            <div className="relative mr-2 mt-0.5 h-14 w-20 shrink-0">
              <div className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-2xl border shadow-md
                              border-gray-200 bg-white
                              dark:border-white/[0.08] dark:bg-white/[0.04]">
                <SparklesIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute right-7 top-3 flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm
                              border-gray-200 bg-gray-50
                              dark:border-white/[0.07] dark:bg-white/[0.03]">
                <BoltIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="absolute right-12 top-1 flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm
                              border-gray-100 bg-white
                              dark:border-white/[0.06] dark:bg-white/[0.04]">
                <PencilSquareIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── No GitHub: connect CTA ──────────────────────────────────── */}
          {!githubLinked && (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border
                              border-gray-200 bg-gray-100
                              dark:border-white/[0.08] dark:bg-white/[0.04]">
                <svg className="h-8 w-8 text-gray-700 dark:text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Connect your GitHub account</p>
                <p className="mt-1.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                  Allow Bobby to read your repositories so you can select one to build and monitor.
                </p>
              </div>
              <button
                onClick={connectGitHub}
                className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors
                           bg-bobby-lime text-black hover:bg-bobby-lime/90"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Connect GitHub
              </button>
            </div>
          )}

          {/* ── GitHub linked: main form ────────────────────────────────── */}
          {githubLinked && (
            <>
              {/* Build preset tab row */}
              <div>
                <div className="flex items-center gap-1 rounded-xl border p-1
                                border-gray-100 bg-gray-50
                                dark:border-white/[0.06] dark:bg-white/[0.03]">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPreset(p.id)}
                      className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                        preset === p.id
                          ? "bg-white text-gray-900 shadow-sm dark:bg-white/[0.10] dark:text-white"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button className="rounded-lg px-2.5 py-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1.5 pl-1 text-[11px] text-gray-400 dark:text-gray-500">{presetHint[preset]}</p>
              </div>

              {/* Repo selection zone */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Repository <span className="text-red-400">*</span>
                </label>
                {!selectedRepo ? (
                  <div className="rounded-2xl border-2 border-dashed p-5
                                  border-gray-200 bg-gray-50/60
                                  dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="relative mb-3">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search your repositories…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition-colors focus:border-transparent focus:ring-2
                                   border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:ring-bobby-lime
                                   dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-gray-500 dark:focus:ring-bobby-lime/60"
                      />
                    </div>

                    <div className="max-h-44 divide-y overflow-y-auto rounded-xl border
                                    divide-gray-50 border-gray-100 bg-white
                                    dark:divide-white/[0.04] dark:border-white/[0.06] dark:bg-white/[0.03]">
                      {loadingRepos && (
                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400 dark:text-gray-500">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-white/[0.10]" />
                          Loading repositories…
                        </div>
                      )}
                      {repoError && (
                        <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{repoError}</div>
                      )}
                      {!loadingRepos && !repoError && filtered.length === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                          No repositories found.
                        </div>
                      )}
                      {filtered.map((repo) => (
                        <button
                          key={repo.id}
                          onClick={() => setSelectedRepo(repo)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors
                                     hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{repo.full_name}</p>
                            {repo.description && (
                              <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">{repo.description}</p>
                            )}
                          </div>
                          {repo.private && (
                            <span className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium
                                              bg-gray-100 text-gray-500
                                              dark:bg-white/[0.06] dark:text-gray-400">
                              Private
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Selected repo display */
                  <div className="flex items-center justify-between rounded-2xl border px-4 py-3
                                  border-gray-200 bg-gray-50
                                  dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                                      bg-gray-900 dark:bg-white">
                        <svg className="h-4 w-4 text-white dark:text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{selectedRepo.full_name}</p>
                        {selectedRepo.description && (
                          <p className="truncate text-xs text-gray-400 dark:text-gray-500">{selectedRepo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-green-500 dark:text-green-400" />
                      <button
                        onClick={() => { setSelectedRepo(null); setSearch("") }}
                        className="rounded-lg p-1 transition-colors
                                   text-gray-400 hover:bg-gray-200 hover:text-gray-700
                                   dark:text-gray-500 dark:hover:bg-white/[0.08] dark:hover:text-white"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-column: Project Name + Worker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Select a repository"
                    value={selectedRepo?.name ?? ""}
                    className="w-full cursor-default rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2
                               border-gray-200 bg-gray-50 text-gray-700 placeholder:text-gray-300 focus:ring-bobby-lime
                               dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:ring-bobby-lime/60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Build Worker
                  </label>
                  {workers.length > 1 ? (
                    <select
                      value={selectedWorkerId}
                      onChange={(e) => setSelectedWorkerId(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2
                                 border-gray-200 bg-white text-gray-900 focus:ring-bobby-lime
                                 dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:ring-bobby-lime/60"
                    >
                      {workers.map((w) => (
                        <option key={w.setupId} value={w.setupId}>
                          {workerLabel(w)}
                        </option>
                      ))}
                    </select>
                  ) : workers.length === 1 ? (
                    <div className="flex h-[38px] items-center rounded-xl border px-3 text-sm font-medium
                                    border-gray-200 bg-gray-50 text-gray-700
                                    dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200">
                      {workerLabel(workers[0])}
                    </div>
                  ) : (
                    <div className="flex h-[38px] items-center rounded-xl border px-3 text-xs
                                    border-amber-200 bg-amber-50 text-amber-700
                                    dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-300">
                      No workers yet
                    </div>
                  )}
                </div>
              </div>

              {/* Custom preset commands */}
              {(preset === "custom" || preset === "python") && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Build Commands <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Init
                      </span>
                      <input
                        type="text"
                        placeholder={preset === "python" ? "pip install -r requirements.txt" : "npm install"}
                        value={customInit}
                        onChange={(e) => setCustomInit(e.target.value)}
                        className="w-full rounded-xl border py-2.5 pl-10 pr-3 font-mono text-sm outline-none transition-colors focus:ring-2
                                   border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-bobby-lime
                                   dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:bg-white/[0.06] dark:focus:ring-bobby-lime/60"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Build
                      </span>
                      <input
                        type="text"
                        placeholder={preset === "python" ? "python build.py" : "npm run build"}
                        value={customBuild}
                        onChange={(e) => setCustomBuild(e.target.value)}
                        className="w-full rounded-xl border py-2.5 pl-12 pr-3 font-mono text-sm outline-none transition-colors focus:ring-2
                                   border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-bobby-lime
                                   dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:focus:bg-white/[0.06] dark:focus:ring-bobby-lime/60"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Artifact path */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Artifact Folder{" "}
                  <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. dist or out"
                  value={artifactPath}
                  onChange={(e) => setArtifactPath(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 font-mono text-sm outline-none focus:ring-2
                             border-gray-200 bg-white text-gray-900 focus:ring-bobby-lime
                             dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:ring-bobby-lime/60"
                />
              </div>

              {/* Tags section */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tags</label>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{remainingTags} tags remaining</span>
                </div>

                {/* Active tags + input */}
                <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-xl border px-3 py-2 focus-within:ring-2
                                border-gray-200 bg-white focus-within:ring-bobby-lime
                                dark:border-white/[0.10] dark:bg-white/[0.04] dark:focus-within:ring-bobby-lime/60">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium
                                 bg-gray-100 text-gray-700
                                 dark:bg-white/[0.08] dark:text-gray-200"
                    >
                      {tag}
                      <button
                        onClick={() => setTags((t) => t.filter((x) => x !== tag))}
                        className="ml-0.5 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "Add tags (e.g. frontend, api, prod…)" : ""}
                    className="min-w-[120px] flex-1 bg-transparent text-xs outline-none
                               text-gray-700 placeholder:text-gray-300
                               dark:text-white dark:placeholder:text-gray-600"
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === ",") && e.currentTarget.value.trim()) {
                        e.preventDefault()
                        const val = e.currentTarget.value.trim().replace(/,$/, "")
                        if (val && !tags.includes(val) && tags.length < 12) {
                          setTags((t) => [...t, val])
                        }
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                </div>

                {/* Suggested tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        if (tags.length < 12) setTags((prev) => [...prev, t])
                      }}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors
                                 border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-800
                                 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-400 dark:hover:border-white/[0.18] dark:hover:text-white"
                    >
                      <span className="text-gray-400 dark:text-gray-500">+</span> {t}
                    </button>
                  ))}
                </div>
              </div>

              {addError && (
                <p className="rounded-xl border px-4 py-3 text-sm
                              border-red-200 bg-red-50 text-red-700
                              dark:border-red-500/20 dark:bg-red-500/[0.08] dark:text-red-300">
                  {addError}
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {githubLinked && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t px-6 py-4
                          border-gray-100 bg-white
                          dark:border-white/[0.06] dark:bg-white/[0.02]">
            {/* Status indicator */}
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              <span className="truncate text-xs text-gray-500 dark:text-gray-400">Connected to GitHub</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors
                           text-gray-600 hover:bg-gray-100
                           dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!selectedRepo || !selectedWorkerId || adding || workers.length === 0}
                className="rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-40
                           bg-bobby-lime text-black hover:bg-bobby-lime/90"
              >
                {adding ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Adding…
                  </span>
                ) : (
                  "Add Project"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
