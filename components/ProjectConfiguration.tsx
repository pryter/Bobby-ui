"use client"

import { useState, useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline"
import {
  MonitoredRepo,
  Worker,
  getRepo,
  getWorkers,
  updateRepoWorker,
  getRepoPipeline,
  saveRepoPipeline,
} from "@/lib/api"
import { Pipeline } from "@/lib/pipeline"
import { useAuth } from "@/components/AuthProvider"

// React Flow uses DOM APIs — import dynamically to avoid SSR issues
const PipelineCanvas = dynamic(() => import("./pipeline/PipelineCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[640px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-400">Loading pipeline editor…</p>
    </div>
  ),
})

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ConfigSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl animate-pulse flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="mb-1 h-7 w-40 rounded-lg bg-gray-200" />
      <div className="h-4 w-72 rounded bg-gray-100" />
      <div className="mt-6 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
        <div className="h-4 w-48 rounded bg-gray-100" />
      </div>
      <div className="mt-4 h-[640px] rounded-2xl bg-white shadow-md" />
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectConfiguration({ id }: { id: string }) {
  const { token } = useAuth()

  const [project, setProject] = useState<MonitoredRepo | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      getRepo(id, token).catch(() => null),
      getWorkers(token).catch(() => [] as Worker[]),
      getRepoPipeline(id, token).catch(() => null),
    ]).then(([proj, ws, pl]) => {
      if (!proj) { setNotFound(true); setLoading(false); return }
      setProject(proj)
      setWorkers(ws)
      setPipeline(pl)
      setLoading(false)
    })
  }, [id, token])

  // ── Linked Worker ─────────────────────────────────────────────────────────

  const [currentSetupId, setCurrentSetupId] = useState("")
  const [editingWorker, setEditingWorker] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState("")
  const [savingWorker, setSavingWorker] = useState(false)
  const [workerError, setWorkerError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return
    setCurrentSetupId(project.setup_id)
    setSelectedWorker(project.setup_id)
  }, [project])

  const workerName = (wid: string) => {
    const w = workers.find((w) => w.setupId === wid)
    return w?.name || wid.slice(0, 8) + "…"
  }

  async function saveWorker() {
    if (!project) return
    if (selectedWorker === currentSetupId) { setEditingWorker(false); return }
    setSavingWorker(true)
    setWorkerError(null)
    try {
      await updateRepoWorker(project.id, selectedWorker, token)
      setCurrentSetupId(selectedWorker)
      setEditingWorker(false)
    } catch (e) {
      setWorkerError((e as Error).message)
    } finally {
      setSavingWorker(false)
    }
  }

  // ── Pipeline save ─────────────────────────────────────────────────────────

  async function handleSavePipeline(newPipeline: Pipeline) {
    if (!project) return
    await saveRepoPipeline(project.id, newPipeline, token)
    setPipeline(newPipeline)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <ConfigSkeleton />

  if (notFound || !project) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
        <p className="text-gray-500">Project not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-semibold">Configuration</h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Build pipeline and worker assignment for{" "}
        <span className="font-medium text-gray-700">{project.repo_full_name}</span>.
      </p>

      {/* ── Linked Worker ──────────────────────────────────────────────────── */}
      <div className="mt-6 rounded-2xl bg-white px-4 py-5 shadow-md sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Linked Worker</h2>
          {!editingWorker && (
            <button
              onClick={() => { setSelectedWorker(currentSetupId); setEditingWorker(true) }}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Change
            </button>
          )}
        </div>

        {!editingWorker ? (
          <p className="text-sm">
            <span className="mr-2 text-gray-500">Worker</span>
            <span className="font-medium">{workerName(currentSetupId)}</span>
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900"
            >
              {workers.map((w) => (
                <option key={w.setupId} value={w.setupId}>
                  {w.name || w.setupId}
                </option>
              ))}
            </select>
            {workerError && <p className="text-sm text-red-600">{workerError}</p>}
            <div className="flex gap-2">
              <button
                onClick={saveWorker}
                disabled={savingWorker}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {savingWorker ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditingWorker(false); setWorkerError(null) }}
                className="rounded-lg px-4 py-1.5 text-sm text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Build Pipeline ─────────────────────────────────────────────────── */}
      <div className="mt-6">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold">Build Pipeline</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Drag blocks from the left panel · connect nodes to define flow ·
              click a block to configure · press{" "}
              <kbd className="rounded bg-gray-100 px-1 font-mono text-[10px]">Delete</kbd> to remove
            </p>
          </div>
          {pipeline && (
            <button
              onClick={async () => {
                await saveRepoPipeline(project.id, null, token)
                setPipeline(null)
              }}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600"
            >
              Reset to default
            </button>
          )}
        </div>

        <PipelineCanvas
          initialPipeline={pipeline}
          preset={project.preset}
          customInit={project.custom_init}
          customBuild={project.custom_build}
          artifactPath={project.artifact_path}
          onSave={handleSavePipeline}
        />
      </div>
    </div>
  )
}
