"use client"

import { useState, useEffect } from "react"
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline"
import {
  MonitoredRepo,
  Worker,
  getRepo,
  getWorkers,
  updateRepoPreset,
  updateRepoWorker,
} from "@/lib/api"
import { useAuth } from "@/components/AuthProvider"

type Preset = "node" | "go" | "custom"

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
      <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="mb-4 h-5 w-28 rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-gray-100" />
          <div className="h-4 w-56 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectConfiguration({ id }: { id: string }) {
  const { token } = useAuth()

  const [project, setProject] = useState<MonitoredRepo | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      getRepo(id, token).catch(() => null),
      getWorkers(token).catch(() => [] as Worker[]),
    ]).then(([proj, ws]) => {
      if (!proj) { setNotFound(true); setLoading(false); return }
      setProject(proj)
      setWorkers(ws)
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

  // ── Build Preset ──────────────────────────────────────────────────────────

  const [preset, setPreset] = useState<Preset>("node")
  const [customInit, setCustomInit] = useState("")
  const [customBuild, setCustomBuild] = useState("")
  const [artifactPath, setArtifactPath] = useState("")
  const [editingPreset, setEditingPreset] = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetError, setPresetError] = useState<string | null>(null)

  useEffect(() => {
    if (!project) return
    setPreset((project.preset as Preset) || "node")
    setCustomInit(project.custom_init ?? "")
    setCustomBuild(project.custom_build ?? "")
    setArtifactPath(project.artifact_path ?? "")
  }, [project])

  async function savePreset() {
    if (!project) return
    setSavingPreset(true)
    setPresetError(null)
    try {
      await updateRepoPreset(
        project.id,
        {
          preset,
          customInit: preset === "custom" ? customInit : undefined,
          customBuild: preset === "custom" ? customBuild : undefined,
          artifactPath: artifactPath || undefined,
        },
        token,
      )
      setEditingPreset(false)
    } catch (e) {
      setPresetError((e as Error).message)
    } finally {
      setSavingPreset(false)
    }
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
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <WrenchScrewdriverIcon className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-semibold">Configuration</h1>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Build preset, commands, and worker assignment for{" "}
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

      {/* ── Build Preset ───────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-2xl bg-white px-4 py-5 shadow-md sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Build Preset</h2>
          {!editingPreset && (
            <button
              onClick={() => setEditingPreset(true)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Edit
            </button>
          )}
        </div>

        {!editingPreset ? (
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="w-20 shrink-0 text-gray-500">Preset</span>
              <span className="font-medium capitalize">{project.preset || "node"}</span>
            </div>
            {project.custom_init && (
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-gray-500">Init</span>
                <code className="break-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                  {project.custom_init}
                </code>
              </div>
            )}
            {project.custom_build && (
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-gray-500">Build</span>
                <code className="break-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                  {project.custom_build}
                </code>
              </div>
            )}
            {project.artifact_path && (
              <div className="flex gap-3">
                <span className="w-20 shrink-0 text-gray-500">Artifact</span>
                <code className="break-all rounded bg-gray-100 px-2 py-0.5 font-mono text-xs">
                  {project.artifact_path}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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
              <p className="text-xs text-gray-400">
                Runs <code className="rounded bg-gray-100 px-1 font-mono">yarn</code> then{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">yarn build</code>
              </p>
            )}
            {preset === "go" && (
              <p className="text-xs text-gray-400">
                Runs{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">go mod download</code> then{" "}
                <code className="rounded bg-gray-100 px-1 font-mono">go build ./...</code>
              </p>
            )}
            {preset === "custom" && (
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Init command</label>
                  <input
                    type="text"
                    placeholder="e.g. npm install"
                    value={customInit}
                    onChange={(e) => setCustomInit(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Build command</label>
                  <input
                    type="text"
                    placeholder="e.g. npm run build"
                    value={customBuild}
                    onChange={(e) => setCustomBuild(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                Artifact folder override{" "}
                <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. dist"
                value={artifactPath}
                onChange={(e) => setArtifactPath(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            {presetError && <p className="text-sm text-red-600">{presetError}</p>}
            <div className="flex gap-2">
              <button
                onClick={savePreset}
                disabled={savingPreset}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {savingPreset ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setPreset((project.preset as Preset) || "node")
                  setCustomInit(project.custom_init ?? "")
                  setCustomBuild(project.custom_build ?? "")
                  setArtifactPath(project.artifact_path ?? "")
                  setEditingPreset(false)
                  setPresetError(null)
                }}
                className="rounded-lg px-4 py-1.5 text-sm text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
