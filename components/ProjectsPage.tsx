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
} from "@heroicons/react/24/outline"
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

const PRESET_CFG: Record<string, { label: string; abbr: string; iconBg: string; iconText: string; chip: string }> = {
  node: {
    label: "Node.js",
    abbr: "N",
    iconBg: "bg-green-100",
    iconText: "text-green-700",
    chip: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  go: {
    label: "Go",
    abbr: "Go",
    iconBg: "bg-cyan-100",
    iconText: "text-cyan-700",
    chip: "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200",
  },
  python: {
    label: "Python",
    abbr: "Py",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    chip: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  },
  custom: {
    label: "Custom",
    abbr: "⚙",
    iconBg: "bg-gray-100",
    iconText: "text-gray-500",
    chip: "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
}

const BUILD_STYLE: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  failure: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700 animate-pulse",
  cancelled: "bg-gray-100 text-gray-500",
}

// ── skeleton ───────────────────────────────────────────────────────────────

function ProjectsSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
          <div className="mt-2 h-4 w-80 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-xl" />
      </div>
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white px-6 py-5 shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-24 bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-16 bg-gray-100 rounded-full hidden sm:block" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
                <div className="h-8 w-8 bg-gray-100 rounded-lg" />
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
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            GitHub repos monitored by Bobby. A push triggers an automatic build on the linked worker.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add project
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 px-8 py-16 text-center text-gray-500">
            <p className="font-medium">No projects yet.</p>
            <p className="mt-1 text-sm">Click &ldquo;Add project&rdquo; to link a GitHub repo to a worker.</p>
          </div>
        )}

        {projects.map((p) => {
          const cfg = PRESET_CFG[p.preset] ?? PRESET_CFG.custom
          const build = latestBuilds[p.id]
          const buildLabel = build ? (build.conclusion || build.status) : null
          const buildStyle = buildLabel ? (BUILD_STYLE[buildLabel] ?? BUILD_STYLE.cancelled) : null
          const [org, repoName] = p.repo_full_name.includes("/")
            ? p.repo_full_name.split("/")
            : ["", p.repo_full_name]

          return (
            <div
              key={p.id}
              className="group rounded-2xl bg-white px-6 py-5 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Framework icon */}
                <Link href={`/dashboard/project/${p.id}`} className="flex-shrink-0" tabIndex={-1}>
                  <div
                    className={`w-11 h-11 rounded-xl ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center text-sm font-bold select-none`}
                  >
                    {cfg.abbr}
                  </div>
                </Link>

                {/* Repo name + chips */}
                <Link href={`/dashboard/project/${p.id}`} className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:[&]:underline">
                    {org && <span className="font-normal text-gray-400">{org}/</span>}
                    {repoName}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {/* Preset chip */}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.chip}`}>
                      {cfg.label}
                    </span>
                    {/* Worker chip */}
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200">
                      <BoltIcon className="h-3 w-3" />
                      {workerName(p.setup_id)}
                    </span>
                    {/* Artifact chip */}
                    {p.artifact_path && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
                        <ArchiveBoxIcon className="h-3 w-3" />
                        {p.artifact_path}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Latest build + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {buildLabel && buildStyle && (
                    <div className="text-right hidden sm:block mr-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${buildStyle}`}>
                        {buildLabel}
                      </span>
                      {build?.finished_at && (
                        <p className="mt-0.5 text-xs text-gray-400">{timeAgo(build.finished_at)}</p>
                      )}
                      {build?.status === "in_progress" && !build.finished_at && (
                        <p className="mt-0.5 text-xs text-gray-400">running…</p>
                      )}
                    </div>
                  )}

                  {/* GitHub link */}
                  <a
                    href={`https://github.com/${p.repo_full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Open on GitHub"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>

                  {/* Delete */}
                  <button
                    disabled={removing === p.repo_id}
                    onClick={() => removeProject(p)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
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
