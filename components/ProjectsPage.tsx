"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MonitoredRepo,
  Worker,
  Build,
  getAllRepos,
  getWorkers,
  getRepoBuilds,
  removeWorkerRepo,
} from "@/lib/api"
import AddProjectModal from "@/components/AddProjectModal"
import {
  PlusIcon,
  TrashIcon,
  BoltIcon,
  ArrowTopRightOnSquareIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/solid"
import { useAuth } from "@/components/AuthProvider"

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── framework icons ─────────────────────────────────────────────────────────
// Simple Icons CDN — white variant on dark bg-gray-900 container

type PresetKey = "node" | "go" | "python" | "custom"

interface PresetCfg {
  label: string
  icon: React.ReactNode
  chip: string
}

function SimpleIcon({ slug, alt }: { slug: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${slug}/ffffff`}
      alt={alt}
      className="h-5 w-5"
    />
  )
}

const PRESET_CFG: Record<string, PresetCfg> = {
  node: {
    label: "Node.js",
    icon: <SimpleIcon slug="nodedotjs" alt="Node.js" />,
    chip: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200 dark:bg-green-500/[0.08] dark:text-green-300 dark:ring-green-500/20",
  },
  go: {
    label: "Go",
    icon: <SimpleIcon slug="go" alt="Go" />,
    chip: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200 dark:bg-cyan-500/[0.08] dark:text-cyan-300 dark:ring-cyan-500/20",
  },
  python: {
    label: "Python",
    icon: <SimpleIcon slug="python" alt="Python" />,
    chip: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/[0.08] dark:text-blue-300 dark:ring-blue-500/20",
  },
  custom: {
    label: "Custom",
    icon: <WrenchScrewdriverIcon className="h-5 w-5 text-white" />,
    chip: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200 dark:bg-white/[0.06] dark:text-gray-300 dark:ring-white/[0.10]",
  },
}

function BuildStatusIcon({ status }: { status: string }) {
  if (status === "success")
    return <CheckCircleIcon className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
  if (status === "failure")
    return <XCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
  if (status === "in_progress")
    return <span className="inline-block h-3 w-3 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
  return <MinusCircleIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
}

// ── skeleton ───────────────────────────────────────────────────────────────

function ProjectsSkeleton() {
  const skel = "bg-gray-200 dark:bg-white/[0.06]"
  const skelSoft = "bg-gray-100 dark:bg-white/[0.04]"
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className={`h-8 w-32 rounded-lg ${skel}`} />
          <div className={`mt-2 h-4 w-80 rounded ${skel}`} />
        </div>
        <div className={`h-9 w-32 rounded-full ${skel}`} />
      </div>
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border px-6 py-5
                       border-gray-200/80 bg-white/60
                       dark:border-white/[0.07] dark:bg-white/[0.02]"
          >
            <div className="flex items-center gap-5">
              <div className={`h-11 w-11 rounded-xl flex-shrink-0 ${skel}`} />
              <div className="flex-1">
                <div className={`h-4 w-44 rounded mb-2 ${skel}`} />
                <div className="flex gap-2">
                  <div className={`h-5 w-16 rounded-full ${skelSoft}`} />
                  <div className={`h-5 w-24 rounded-full ${skelSoft}`} />
                </div>
              </div>
              <div className="hidden md:block w-32 flex-shrink-0">
                <div className={`h-3 w-16 rounded mb-1.5 ${skelSoft}`} />
                <div className={`h-4 w-20 rounded ${skel}`} />
              </div>
              <div className="hidden sm:block w-36 flex-shrink-0">
                <div className={`h-3 w-16 rounded mb-1.5 ${skelSoft}`} />
                <div className={`h-5 w-14 rounded-full mb-1 ${skelSoft}`} />
                <div className={`h-3 w-20 rounded ${skelSoft}`} />
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <div className={`h-8 w-8 rounded-lg ${skelSoft}`} />
                <div className={`h-8 w-8 rounded-lg ${skelSoft}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── main ───────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [projects, setProjects] = useState<MonitoredRepo[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [githubToken, setGithubToken] = useState<string | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  const [latestBuilds, setLatestBuilds] = useState<Record<string, Build | null>>({})

  function fetchBuilds(repos: MonitoredRepo[]) {
    if (repos.length === 0) return
    Promise.all(repos.map((r) => getRepoBuilds(r.id, token).catch(() => [] as Build[]))).then(
      (all) => {
        const map: Record<string, Build | null> = {}
        repos.forEach((r, i) => { map[r.id] = all[i][0] ?? null })
        setLatestBuilds(map)
      },
    )
  }

  useEffect(() => {
    Promise.all([
      getAllRepos(token).catch(() => [] as MonitoredRepo[]),
      getWorkers(token).catch(() => [] as Worker[]),
    ]).then(([repos, ws]) => {
      setProjects(repos)
      setWorkers(ws)
      setLoading(false)
      fetchBuilds(repos)
    })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("modal") !== "1") return
    const { createClient } = require("@/lib/supabase/client")
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.provider_token) setGithubToken(session.provider_token)
      setModalOpen(true)
      router.replace("/dashboard/project")
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    const updated = await getAllRepos(token).catch(() => projects)
    setProjects(updated)
    fetchBuilds(updated)
  }

  async function removeProject(project: MonitoredRepo) {
    setRemoving(project.repo_id)
    try {
      await removeWorkerRepo(project.setup_id, project.repo_id, token)
      await refresh()
    } finally {
      setRemoving(null)
    }
  }

  const workerName = (setupId: string) => {
    const w = workers.find((w) => w.setupId === setupId)
    return w?.name || setupId.slice(0, 8) + "…"
  }

  if (loading) return <ProjectsSkeleton />

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400 mb-2">
            Dashboard
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            GitHub repos monitored by Bobby. A push triggers an automatic build on the linked worker.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold
                     bg-bobby-lime text-black shadow-lg shadow-bobby-lime/20
                     transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
          Add project
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {projects.length === 0 && (
          <div className="rounded-2xl border border-dashed px-8 py-16 text-center
                          border-gray-300 text-gray-500
                          dark:border-white/[0.10] dark:text-gray-400">
            <p className="font-semibold">No projects yet.</p>
            <p className="mt-1 text-sm">Click &ldquo;Add project&rdquo; to link a GitHub repo to a worker.</p>
          </div>
        )}

        {projects.map((p) => {
          const cfg = PRESET_CFG[p.preset] ?? PRESET_CFG.custom
          const build = latestBuilds[p.id]
          const buildLabel = build ? (build.conclusion || build.status) : null
          const slashIdx = p.repo_full_name.indexOf("/")
          const owner = slashIdx !== -1 ? p.repo_full_name.slice(0, slashIdx) : null
          const repoName = slashIdx !== -1 ? p.repo_full_name.slice(slashIdx + 1) : p.repo_full_name

          return (
            <div
              key={p.id}
              className="group rounded-2xl border px-6 py-5 transition-all
                         border-gray-200/80 bg-white/60
                         hover:border-indigo-200 hover:bg-indigo-50/20
                         dark:border-white/[0.07] dark:bg-white/[0.02]
                         dark:hover:border-indigo-500/25 dark:hover:bg-indigo-500/[0.04]"
            >
              <div className="flex items-center gap-5">
                {/* Col 1 — Framework icon */}
                <Link href={`/dashboard/project/${p.id}`} className="flex-shrink-0" tabIndex={-1}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center
                                  bg-gray-900 dark:bg-white/[0.08] dark:ring-1 dark:ring-white/[0.08]">
                    {cfg.icon}
                  </div>
                </Link>

                {/* Col 2 — Repo name + chips */}
                <Link href={`/dashboard/project/${p.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate leading-tight">
                    {repoName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.chip}`}>
                      {cfg.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
                                     bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200
                                     dark:bg-violet-500/[0.10] dark:text-violet-300 dark:ring-violet-500/20">
                      <BoltIcon className="h-3 w-3" />
                      {workerName(p.setup_id)}
                    </span>
                    {p.artifact_path && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium
                                       bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200
                                       dark:bg-amber-500/[0.10] dark:text-amber-300 dark:ring-amber-500/20">
                        <ArchiveBoxIcon className="h-3 w-3" />
                        {p.artifact_path}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Col 3 — Owned by */}
                <div className="hidden md:block w-32 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    Owned by
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {owner ?? "—"}
                  </p>
                </div>

                {/* Col 4 — Latest build */}
                <div className="hidden sm:block w-40 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    Latest build
                  </p>
                  {buildLabel ? (
                    <div className="flex flex-row items-center space-x-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <BuildStatusIcon status={buildLabel} />
                        <span className="font-mono text-[11px] rounded px-1.5 py-0.5
                                         bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200
                                         dark:bg-white/[0.05] dark:text-gray-400 dark:ring-white/[0.08]">
                          {build!.head_sha.slice(0, 7)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 pl-0.5">
                        {build!.finished_at
                          ? timeAgo(build!.finished_at)
                          : build!.status === "in_progress"
                            ? "running…"
                            : "—"}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No builds yet</p>
                  )}
                </div>

                {/* Col 5 — Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={`https://github.com/${p.repo_full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg p-2 transition-colors
                               text-gray-400 hover:bg-gray-100 hover:text-gray-700
                               dark:text-gray-500 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    title="Open on GitHub"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                  <button
                    disabled={removing === p.repo_id}
                    onClick={() => removeProject(p)}
                    className="rounded-lg p-2 transition-colors disabled:opacity-40
                               text-gray-400 hover:bg-red-50 hover:text-red-600
                               dark:text-gray-500 dark:hover:bg-red-500/[0.10] dark:hover:text-red-400"
                    title="Remove project"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AddProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={refresh}
        workers={workers}
        token={token}
        initialGithubToken={githubToken}
      />
    </div>
  )
}
