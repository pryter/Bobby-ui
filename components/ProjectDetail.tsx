"use client"

import { useState } from "react"
import Link from "next/link"
import { MonitoredRepo, Build, updateRepoPreset } from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import BuildConsole from "@/components/BuildConsole"

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

interface ProjectDetailProps {
  project: MonitoredRepo
  builds: Build[]
  token: string
}

export default function ProjectDetail({ project, builds: initialBuilds, token }: ProjectDetailProps) {
  const { activeBuild, logs } = useWorkerStream(token, project.setup_id, false)

  // Preset editor state
  const [preset, setPreset] = useState<Preset>((project.preset as Preset) || "node")
  const [customInit, setCustomInit] = useState(project.custom_init ?? "")
  const [customBuild, setCustomBuild] = useState(project.custom_build ?? "")
  const [artifactPath, setArtifactPath] = useState(project.artifact_path ?? "")
  const [editingPreset, setEditingPreset] = useState(false)
  const [savingPreset, setSavingPreset] = useState(false)
  const [presetError, setPresetError] = useState<string | null>(null)

  async function savePreset() {
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

  // Merge active build at top; filter duplicate from history
  const buildList: (Build & { isLive?: boolean })[] = activeBuild
    ? [
        { ...activeBuild, isLive: true },
        ...initialBuilds.filter((b) => b.id !== activeBuild.id),
      ]
    : initialBuilds

  const latestBuild = buildList[0] ?? null
  const previousBuilds = buildList.slice(1)

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-8 py-10">
      <Link href="/dashboard/project" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to projects
      </Link>

      {/* Header */}
      <div className="mt-4">
        <h1 className="text-2xl font-semibold">{project.repo_full_name}</h1>
        <p className="mt-1 font-mono text-sm text-gray-400">{project.repo_name}</p>
      </div>

      {/* Build Preset */}
      <div className="mt-8 rounded-2xl bg-white px-6 py-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
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
              <span className="text-gray-500 w-24">Preset</span>
              <span className="font-medium capitalize">{project.preset || "node"}</span>
            </div>
            {project.custom_init && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Init</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{project.custom_init}</code>
              </div>
            )}
            {project.custom_build && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Build</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{project.custom_build}</code>
              </div>
            )}
            {project.artifact_path && (
              <div className="flex gap-3">
                <span className="text-gray-500 w-24">Artifact dir</span>
                <code className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{project.artifact_path}</code>
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
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Latest Build</h2>
          <div className="rounded-2xl bg-white shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h3 className="font-medium">{latestBuild.repo_name || `repo #${latestBuild.repo_id}`}</h3>
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {latestBuild.head_sha?.slice(0, 7)} · {new Date(latestBuild.started_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={latestBuild.status} conclusion={latestBuild.conclusion} />
                {latestBuild.artifact_url && (
                  <a
                    href={latestBuild.artifact_url}
                    className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                    download
                  >
                    Download artifact
                  </a>
                )}
              </div>
            </div>
            {/* Inline live console */}
            {latestBuild.isLive && logs.length > 0 && (
              <div className="border-t border-gray-100 px-6 pb-4">
                <BuildConsole logs={logs} active={!latestBuild.conclusion} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Builds */}
      {previousBuilds.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Previous Builds</h2>
          <div className="space-y-3">
            {previousBuilds.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-md">
                <div>
                  <p className="font-mono text-xs text-gray-400">
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
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {buildList.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">No builds yet. Push to this repo to trigger a build.</p>
      )}
    </div>
  )
}
