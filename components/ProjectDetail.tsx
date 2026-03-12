"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import {
  MonitoredRepo,
  Build,
  Worker,
  getRepo,
  getRepoBuilds,
  getWorkers,
  updateRepoPreset,
  updateRepoWorker,
  getBuildLog,
  getArtifactDownloadURL,
} from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import { parseLogPhases } from "@/lib/buildPhases"
import BuildConsole from "@/components/BuildConsole"
import { useAuth } from "@/components/AuthProvider"

type Preset = "node" | "go" | "custom"

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

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="mt-4">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="mt-2 h-4 w-32 bg-gray-100 rounded" />
      </div>
      <div className="mt-8 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>
      <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
      <div className="mt-8">
        <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
        <div className="rounded-2xl bg-white shadow-md h-16" />
      </div>
    </div>
  )
}

export default function ProjectDetail({ id }: { id: string }) {
  const { token } = useAuth()

  const [project, setProject] = useState<MonitoredRepo | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      getRepo(id, token).catch(() => null),
      getRepoBuilds(id, token).catch(() => [] as Build[]),
      getWorkers(token).catch(() => [] as Worker[]),
    ]).then(([proj, blds, ws]) => {
      if (!proj) { setNotFound(true); setLoading(false); return }
      setProject(proj)
      setBuilds(blds)
      setWorkers(ws)
      setLoading(false)
    })
  }, [id, token])

  const { activeBuild, phases } = useWorkerStream(project?.setup_id ?? "", false)

  // ── Preset editor ──────────────────────────────────────────────────────────
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
        token
      )
      setEditingPreset(false)
    } catch (e) {
      setPresetError((e as Error).message)
    } finally {
      setSavingPreset(false)
    }
  }

  // ── Worker assignment ─────────────────────────────────────────────────────
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

  // ── Build list with live build merged in ──────────────────────────────────
  const buildList: (Build & { isLive?: boolean })[] = activeBuild
    ? [{ ...activeBuild, isLive: true }, ...builds.filter((b) => b.id !== activeBuild.id)]
    : builds

  const latestBuild = buildList[0] ?? null
  const previousBuilds = buildList.slice(1)

  // ── Latest build console expand/collapse ──────────────────────────────────
  const [showLatestConsole, setShowLatestConsole] = useState(false)
  useEffect(() => {
    if (phases.length > 0) setShowLatestConsole(true)
  }, [phases.length > 0])

  // ── Past build log expansion ──────────────────────────────────────────────
  const [expandedBuildId, setExpandedBuildId] = useState<string | null>(null)
  const [buildLogCache, setBuildLogCache] = useState<Record<string, string>>({})

  async function toggleBuildLog(buildId: string) {
    if (expandedBuildId === buildId) { setExpandedBuildId(null); return }
    setExpandedBuildId(buildId)
    if (!buildLogCache[buildId]) {
      const text = await getBuildLog(buildId, token)
      setBuildLogCache((prev) => ({ ...prev, [buildId]: text }))
    }
  }

  if (loading) return <ProjectDetailSkeleton />

  if (notFound || !project) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
        <Link href="/dashboard/project" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to projects
        </Link>
        <p className="mt-8 text-gray-500">Project not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-8 sm:py-10">
      <Link href="/dashboard/project" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to projects
      </Link>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-xl font-semibold sm:text-2xl">{project.repo_full_name}</h1>
        <p className="mt-1 font-mono text-sm text-gray-400">{project.repo_name}</p>
      </div>

      {/* Linked Worker */}
      <div className="mt-6 rounded-2xl bg-white px-4 py-5 shadow-md sm:mt-8 sm:px-6">
        <div className="flex items-center justify-between mb-4">
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
            <span className="text-gray-500 mr-2">Worker</span>
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

      {/* Build Preset */}
      <div className="mt-4 rounded-2xl bg-white px-4 py-5 shadow-md sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Build Preset</h2>
          {!editingPreset && (
            <button onClick={() => setEditingPreset(true)} className="text-sm text-gray-500 hover:text-gray-900">
              Edit
            </button>
          )}
        </div>

        {!editingPreset ? (
          <div className="space-y-2 text-sm">
            <div className="flex gap-3">
              <span className="text-gray-500 w-20 shrink-0">Preset</span>
              <span className="font-medium capitalize">{project.preset || "node"}</span>
            </div>
            {project.custom_init && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-20 shrink-0">Init</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded break-all">{project.custom_init}</code>
              </div>
            )}
            {project.custom_build && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-20 shrink-0">Build</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded break-all">{project.custom_build}</code>
              </div>
            )}
            {project.artifact_path && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-20 shrink-0">Artifact</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded break-all">{project.artifact_path}</code>
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
                Runs <code className="font-mono bg-gray-100 px-1 rounded">yarn</code> then{" "}
                <code className="font-mono bg-gray-100 px-1 rounded">yarn build</code>
              </p>
            )}
            {preset === "go" && (
              <p className="text-xs text-gray-400">
                Runs <code className="font-mono bg-gray-100 px-1 rounded">go mod download</code> then{" "}
                <code className="font-mono bg-gray-100 px-1 rounded">go build ./...</code>
              </p>
            )}
            {preset === "custom" && (
              <div className="space-y-2">
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Artifact folder override <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. dist"
                value={artifactPath}
                onChange={(e) => setArtifactPath(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-gray-900"
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

      {/* Latest Build */}
      {latestBuild && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-3">Latest Build</h2>
          <div className="rounded-2xl bg-white shadow-md overflow-hidden">
            <button
              onClick={() => setShowLatestConsole((v) => !v)}
              className="flex w-full flex-wrap items-start justify-between gap-y-2 px-4 py-4 text-left sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{latestBuild.repo_name || `repo #${latestBuild.repo_id}`}</h3>
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {latestBuild.head_sha?.slice(0, 7)} · {new Date(latestBuild.started_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <StatusBadge status={latestBuild.status} conclusion={latestBuild.conclusion} />
                {latestBuild.artifact_url && (
                  <a
                    href={getArtifactDownloadURL(latestBuild.artifact_url)!}
                    className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                    download
                    onClick={(e) => e.stopPropagation()}
                  >
                    Download
                  </a>
                )}
                {showLatestConsole ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </button>
            {showLatestConsole && (
              <div className="border-t border-gray-100 px-4 pb-4 sm:px-6">
                {phases.length > 0 ? (
                  <BuildConsole phases={phases} active={!latestBuild.conclusion} />
                ) : (
                  <p className="pt-3 text-xs text-gray-400">
                    {activeBuild ? "Waiting for build output…" : "No log recorded for this build."}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Builds */}
      {previousBuilds.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="text-lg font-semibold mb-3">Previous Builds</h2>
          <div className="space-y-2">
            {previousBuilds.map((b) => {
              const isExpanded = expandedBuildId === b.id
              const cachedLog = buildLogCache[b.id]
              const pastPhases = cachedLog
                ? parseLogPhases(cachedLog.split("\n").filter(Boolean))
                : null

              return (
                <div key={b.id} className="rounded-2xl bg-white shadow-md overflow-hidden">
                  <button
                    onClick={() => toggleBuildLog(b.id)}
                    className="flex w-full flex-wrap items-start justify-between gap-y-2 px-4 py-4 text-left sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-gray-400">
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
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      )}
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 pb-4 sm:px-6">
                      {pastPhases ? (
                        pastPhases.length > 0 ? (
                          <BuildConsole phases={pastPhases} active={false} />
                        ) : (
                          <p className="pt-3 text-xs text-gray-400">No log recorded for this build.</p>
                        )
                      ) : (
                        <p className="pt-3 text-xs text-gray-400 animate-pulse">Loading log…</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {buildList.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">No builds yet. Push to this repo to trigger a build.</p>
      )}
    </div>
  )
}
