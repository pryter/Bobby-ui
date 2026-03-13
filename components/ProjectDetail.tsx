"use client"

import { useState, useEffect, useMemo } from "react"
import type { ElementType } from "react"
import Link from "next/link"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CodeBracketIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline"
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid"
import {
  Build,
  Worker,
  getRepo,
  getRepoBuilds,
  getWorkers,
  getBuildLog,
} from "@/lib/api"
import { useWorkerStream } from "@/lib/useWorkerStream"
import { parseLogPhases } from "@/lib/buildPhases"
import BuildConsole from "@/components/BuildConsole"
import { useAuth } from "@/components/AuthProvider"

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDurationSecs(b: Build): number | null {
  if (!b.finished_at) return null
  return Math.round(
    (new Date(b.finished_at).getTime() - new Date(b.started_at).getTime()) / 1000,
  )
}

function formatDuration(secs: number | null): string {
  if (secs === null) return "—"
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status, conclusion }: { status: string; conclusion: string | null }) {
  const label = conclusion || status
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    failure: "bg-red-100 text-red-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-gray-100 text-gray-600",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[label] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  )
}

// ── StatusDot (icon-only) ─────────────────────────────────────────────────────

function StatusDot({ status, conclusion }: { status: string; conclusion: string | null }) {
  const label = conclusion || status
  if (label === "success")
    return <CheckCircleSolid className="h-4 w-4 shrink-0 text-green-500" />
  if (label === "failure")
    return <XCircleSolid className="h-4 w-4 shrink-0 text-red-500" />
  if (label === "in_progress")
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-yellow-400" />
      </span>
    )
  return <span className="h-4 w-4 shrink-0 rounded-full bg-gray-300" />
}

// ── MetricCard ────────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "gray",
}: {
  label: string
  value: string
  sub?: string
  icon: ElementType
  accent?: "green" | "red" | "yellow" | "gray"
}) {
  const accentMap = {
    green: "text-green-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    gray: "text-gray-400",
  }
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white px-4 py-4 shadow-md">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${accentMap[accent]}`} strokeWidth={2} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold leading-none text-gray-900">{value}</p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values, color = "#374151" }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-xs text-gray-300">Not enough data</span>
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const W = 160
  const H = 44
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W
      const y = H - 4 - ((v - min) / range) * (H - 10)
      return `${x},${y}`
    })
    .join(" ")
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
      aria-hidden
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl animate-pulse flex-col px-4 py-6 sm:px-8 sm:py-10">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-4">
        <div className="h-7 w-56 rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white shadow-md" />
        ))}
      </div>
      <div className="mt-8">
        <div className="mb-3 h-6 w-32 rounded bg-gray-200" />
        <div className="h-20 rounded-2xl bg-white shadow-md" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProjectDetail({ id }: { id: string }) {
  const { token } = useAuth()

  const [project, setProject] = useState<{ setup_id: string; repo_full_name: string; repo_name: string } | null>(null)
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

  // Worker name lookup (display only — editing lives in Configuration)
  const workerName = (wid: string) => {
    const w = workers.find((w) => w.setupId === wid)
    return w?.name || wid.slice(0, 8) + "…"
  }

  // ── Build list with live build merged in ──────────────────────────────────

  const buildList: (Build & { isLive?: boolean })[] = activeBuild
    ? [{ ...activeBuild, isLive: true }, ...builds.filter((b) => b.id !== activeBuild.id)]
    : builds

  const latestBuild = buildList[0] ?? null
  const previousBuilds = buildList.slice(1)

  // ── Derived metrics ───────────────────────────────────────────────────────

  const last20 = useMemo(() => buildList.slice(0, 20), [buildList])

  const successCount = useMemo(
    () => last20.filter((b) => b.conclusion === "success").length,
    [last20],
  )

  const successRate = last20.length > 0
    ? Math.round((successCount / last20.length) * 100)
    : null

  const avgDuration = useMemo(() => {
    const completed = last20.filter((b) => b.finished_at)
    if (!completed.length) return null
    const total = completed.reduce((sum, b) => sum + (getDurationSecs(b) ?? 0), 0)
    return Math.round(total / completed.length)
  }, [last20])

  const lastSuccess = useMemo(
    () => buildList.find((b) => b.conclusion === "success") ?? null,
    [buildList],
  )

  // Sparkline series (oldest → newest)
  const durationTrend = useMemo(
    () => [...last20].reverse().filter((b) => b.finished_at).map((b) => getDurationSecs(b) ?? 0),
    [last20],
  )
  const successTrend = useMemo(
    () => [...last20].reverse().map((b) => (b.conclusion === "success" ? 1 : 0)),
    [last20],
  )

  // ── Latest build console expand/collapse ─────────────────────────────────

  const [showLatestConsole, setShowLatestConsole] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (phases.length > 0) setShowLatestConsole(true) }, [phases.length > 0])

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

  // ─────────────────────────────────────────────────────────────────────────

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

      {/* ── Header + Quick Actions ─────────────────────────────────────────── */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">{project.repo_full_name}</h1>
          <p className="mt-1 font-mono text-sm text-gray-400">{project.repo_name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlayIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Run Build
          </button>
          <button
            disabled={!latestBuild}
            title={latestBuild ? "Rebuild last commit" : "No builds yet"}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            Rebuild Last
          </button>
        </div>
      </div>

      {/* ── Build Health Summary ───────────────────────────────────────────── */}
      {buildList.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Latest Status"
            value={latestBuild ? (latestBuild.conclusion ?? latestBuild.status) : "—"}
            sub={latestBuild ? timeAgo(latestBuild.started_at) : undefined}
            icon={
              latestBuild?.conclusion === "success"
                ? CheckCircleIcon
                : latestBuild?.conclusion === "failure"
                  ? XCircleIcon
                  : ClockIcon
            }
            accent={
              latestBuild?.conclusion === "success"
                ? "green"
                : latestBuild?.conclusion === "failure"
                  ? "red"
                  : "yellow"
            }
          />
          <MetricCard
            label="Success Rate"
            value={successRate !== null ? `${successRate}%` : "—"}
            sub={last20.length > 0 ? `${successCount} / ${last20.length} builds` : undefined}
            icon={CheckCircleIcon}
            accent={
              successRate === null
                ? "gray"
                : successRate >= 80
                  ? "green"
                  : successRate >= 50
                    ? "yellow"
                    : "red"
            }
          />
          <MetricCard
            label="Avg Duration"
            value={formatDuration(avgDuration)}
            sub={last20.length > 0 ? `last ${last20.length} builds` : undefined}
            icon={ClockIcon}
            accent="gray"
          />
          <MetricCard
            label="Last Success"
            value={lastSuccess ? timeAgo(lastSuccess.started_at) : "—"}
            sub={lastSuccess ? lastSuccess.head_sha?.slice(0, 7) : undefined}
            icon={CalendarIcon}
            accent={lastSuccess ? "green" : "gray"}
          />
        </div>
      )}

      {/* ── Latest Build ───────────────────────────────────────────────────── */}
      {latestBuild && (
        <div className="mt-6 sm:mt-8">
          <h2 className="mb-3 text-lg font-semibold">Latest Build</h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="px-4 pt-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                {/* Left: SHA, branch, status, meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <code className="font-mono text-sm font-semibold text-gray-800">
                      {latestBuild.head_sha?.slice(0, 7)}
                    </code>
                    {(latestBuild as any).branch && (
                      <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                        <CodeBracketIcon className="h-3 w-3" />
                        {(latestBuild as any).branch}
                      </span>
                    )}
                    <StatusDot status={latestBuild.status} conclusion={latestBuild.conclusion} />
                    <StatusBadge status={latestBuild.status} conclusion={latestBuild.conclusion} />
                    {(latestBuild as any).trigger && (
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                        {(latestBuild as any).trigger}
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarIcon className="h-3 w-3 shrink-0" />
                      {timeAgo(latestBuild.started_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3 shrink-0" />
                      {formatDuration(getDurationSecs(latestBuild))}
                    </span>
                    {(latestBuild as any).commit_author && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <UserIcon className="h-3 w-3 shrink-0" />
                        {(latestBuild as any).commit_author}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <WrenchScrewdriverIcon className="h-3 w-3 shrink-0" />
                      {workerName(latestBuild.setup_id)}
                    </span>
                  </div>

                  {/* Commit message */}
                  {(latestBuild as any).commit_message && (
                    <p className="mt-1.5 max-w-lg truncate text-xs italic text-gray-500">
                      &ldquo;{(latestBuild as any).commit_message}&rdquo;
                    </p>
                  )}
                </div>

                {/* Right: View Logs button */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setShowLatestConsole((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                  >
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    {showLatestConsole ? "Hide Logs" : "View Logs"}
                  </button>
                  {showLatestConsole ? (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {showLatestConsole ? (
              <div className="mt-4 border-t border-gray-100 px-4 pb-4 sm:px-6">
                {phases.length > 0 ? (
                  <BuildConsole phases={phases} active={!latestBuild.conclusion} />
                ) : (
                  <p className="pt-3 text-xs text-gray-400">
                    {activeBuild ? "Waiting for build output…" : "No log recorded for this build."}
                  </p>
                )}
              </div>
            ) : (
              <div className="pb-4" />
            )}
          </div>
        </div>
      )}

      {/* ── Previous Builds ────────────────────────────────────────────────── */}
      {previousBuilds.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="mb-3 text-lg font-semibold">Previous Builds</h2>
          <div className="space-y-2">
            {previousBuilds.map((b) => {
              const isExpanded = expandedBuildId === b.id
              const cachedLog = buildLogCache[b.id]
              const pastPhases = cachedLog
                ? parseLogPhases(cachedLog.split("\n").filter(Boolean))
                : null
              const dur = getDurationSecs(b)

              return (
                <div key={b.id} className="overflow-hidden rounded-2xl bg-white shadow-md">
                  <button
                    onClick={() => toggleBuildLog(b.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-6"
                  >
                    <StatusDot status={b.status} conclusion={b.conclusion} />

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
                      <code className="font-mono text-xs font-semibold text-gray-700">
                        {b.head_sha?.slice(0, 7)}
                      </code>
                      {(b as any).branch && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="font-mono text-xs text-indigo-500">
                            {(b as any).branch}
                          </span>
                        </>
                      )}
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(b.started_at)}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <ClockIcon className="h-3 w-3 shrink-0" />
                        {formatDuration(dur)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{workerName(b.setup_id)}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge status={b.status} conclusion={b.conclusion} />
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
                          <p className="pt-3 text-xs text-gray-400">
                            No log recorded for this build.
                          </p>
                        )
                      ) : (
                        <p className="animate-pulse pt-3 text-xs text-gray-400">Loading log…</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Build Trends ───────────────────────────────────────────────────── */}
      {last20.length >= 4 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="mb-3 text-lg font-semibold">Build Trends</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-5 py-4 shadow-md">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Success Rate
              </p>
              <p className="mt-0.5 text-xs text-gray-400">Last {last20.length} builds</p>
              <div className="mt-3 flex items-end justify-between">
                <Sparkline
                  values={successTrend}
                  color={successRate !== null && successRate >= 80 ? "#16a34a" : "#f59e0b"}
                />
                <span className="text-2xl font-bold text-gray-800">
                  {successRate !== null ? `${successRate}%` : "—"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-white px-5 py-4 shadow-md">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Build Duration
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Last {durationTrend.length} completed builds
              </p>
              <div className="mt-3 flex items-end justify-between">
                <Sparkline values={durationTrend} color="#6366f1" />
                <span className="text-2xl font-bold text-gray-800">
                  {formatDuration(avgDuration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {buildList.length === 0 && (
        <p className="mt-8 text-sm text-gray-500">
          No builds yet. Push to this repo to trigger a build.
        </p>
      )}
    </div>
  )
}
