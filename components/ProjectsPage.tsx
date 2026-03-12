"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MonitoredRepo, Worker, getAllRepos, getWorkers, removeWorkerRepo } from "@/lib/api"
import AddProjectModal from "@/components/AddProjectModal"
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { useAuth } from "@/components/AuthProvider"

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
          <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md">
            <div className="flex-1">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-8 bg-gray-100 rounded-lg ml-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

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

  useEffect(() => {
    Promise.all([
      getAllRepos(token).catch(() => [] as MonitoredRepo[]),
      getWorkers(token).catch(() => [] as Worker[]),
    ]).then(([repos, ws]) => {
      setProjects(repos)
      setWorkers(ws)
      setLoading(false)
    })
  }, [token])

  // After GitHub OAuth redirect (?modal=1), open modal automatically.
  useEffect(() => {
    if (searchParams.get("modal") !== "1") return

    const { createClient } = require("@/lib/supabase/client")
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.provider_token) {
        setGithubToken(session.provider_token)
      }
      setModalOpen(true)
      router.replace("/dashboard/project")
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function refresh() {
    const updated = await getAllRepos(token).catch(() => projects)
    setProjects(updated)
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
        {projects.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md"
          >
            <Link href={`/dashboard/project/${p.id}`} className="flex-1 min-w-0">
              <p className="font-semibold hover:underline">{p.repo_full_name}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Worker: <span className="font-mono">{workerName(p.setup_id)}</span>
                {p.preset && p.preset !== "node" && (
                  <span className="ml-2 capitalize">{p.preset}</span>
                )}
              </p>
            </Link>
            <button
              disabled={removing === p.repo_id}
              onClick={() => removeProject(p)}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 ml-4"
              title="Remove project"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
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
