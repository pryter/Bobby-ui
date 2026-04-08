"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Build, getBuildSnapshot } from "./api"
import {
  BuildPhase,
  PhaseTimelineState,
  StructuredBuildEvent,
  applyBuildEvent,
  emptyPhaseTimeline,
  normalizeSnapshotEvent,
  timelinePhases,
} from "./buildPhases"
import { useWorkerStreamContext } from "@/components/WorkerStreamProvider"
import { useAuth } from "@/components/AuthProvider"

interface UseWorkerStreamResult {
  online: boolean
  activeBuild: Build | null
  phases: BuildPhase[]
}

/**
 * Subscribes to the worker stream for a given `setupId` and folds its
 * structured build events into a phase timeline suitable for BuildConsole.
 *
 * Implements the UI state machine from STREAMING_API.md §4:
 *   - `build_started`  → full reset of this build's state.
 *   - `phase_start` / `build_log` / `phase_end` → fold into the timeline,
 *     dedup by `seq`, and re-fetch /snapshot if a gap is detected.
 *   - `build_finished` → lock the terminal state.
 *   - On WS reconnect → re-fetch /snapshot and merge events with seq > lastSeq.
 *
 * `initialBuild` is the page's prior knowledge of an already-running build
 * (typically the in-progress row from the builds list endpoint). When set,
 * the hook immediately latches on to that buildId, seeds `activeBuild`, and
 * fetches /snapshot — so a page reload in the middle of a live build shows
 * all phases/logs up to now instead of waiting for the next WS frame.
 */
export function useWorkerStream(
  setupId: string,
  initialOnline: boolean,
  initialBuild?: Build | null,
): UseWorkerStreamResult {
  const { subscribe, connectionEpoch } = useWorkerStreamContext()
  const { token } = useAuth()

  const [online, setOnline] = useState(initialOnline)
  const [activeBuild, setActiveBuild] = useState<Build | null>(null)
  const [timeline, setTimeline] = useState<PhaseTimelineState>(emptyPhaseTimeline)

  // Sync `online` with the prop. `useState(initialOnline)` only captures the
  // first value, so when the parent page first mounts with the worker still
  // loading (worker?.online → undefined → false) and then the fetch resolves,
  // the display needs to catch up. Without this effect, `online` stays at
  // the stale initial value until a worker_online/_offline event fires.
  useEffect(() => {
    setOnline(initialOnline)
  }, [initialOnline])

  // Refs for values we need to read inside the WS callback without
  // re-subscribing on every change.
  const activeBuildIdRef = useRef<string | null>(null)
  const timelineRef = useRef<PhaseTimelineState>(timeline)
  timelineRef.current = timeline
  const tokenRef = useRef(token)
  tokenRef.current = token

  /** Fetch /snapshot for a build and merge any events we haven't seen. */
  const refetchSnapshot = useCallback(async (buildId: string) => {
    const t = tokenRef.current
    if (!t) return
    let snap
    try {
      snap = await getBuildSnapshot(buildId, t)
    } catch {
      return
    }
    if (!snap) return
    // The user may have navigated away or a new build started while we were
    // waiting — ignore the response if it's no longer relevant.
    if (activeBuildIdRef.current !== buildId) return

    setTimeline((cur) => {
      let s = cur
      for (const e of snap.events) {
        const ne = normalizeSnapshotEvent(e)
        if (ne) s = applyBuildEvent(s, ne)
      }
      return s
    })

    // Seed (or refresh) activeBuild from the snapshot metadata. Previously we
    // only did this when the build was already concluded, which meant a page
    // that latched onto a live build purely via a WS fallback path ended up
    // with phases in the timeline but `activeBuild` stuck at null — breaking
    // the "is this build live?" checks in the page components.
    setActiveBuild((prev) => {
      if (prev && prev.id !== buildId) return prev
      const repoId = typeof snap.repoId === "number" ? snap.repoId : prev?.repo_id ?? 0
      const repoName = (snap.repoName as string | undefined) ?? prev?.repo_name ?? ""
      const headSha = (snap.headSha as string | undefined) ?? prev?.head_sha ?? ""
      const startedAt = (snap.startedAt as string | undefined) ?? prev?.started_at ?? new Date().toISOString()
      const status = snap.conclusion ? "completed" : prev?.status ?? "in_progress"
      const conclusion = (snap.conclusion as string | undefined) ?? prev?.conclusion ?? null
      const finishedAt = (snap.finishedAt as string | undefined) ?? prev?.finished_at ?? null
      return {
        id: buildId,
        setup_id: prev?.setup_id ?? "",
        repo_id: repoId,
        repo_name: repoName,
        head_sha: headSha,
        status,
        conclusion,
        artifact_url: prev?.artifact_url ?? null,
        check_run_url: prev?.check_run_url ?? null,
        started_at: startedAt,
        finished_at: finishedAt,
      }
    })
  }, [])

  useEffect(() => {
    // Don't subscribe until we actually know which worker to watch for.
    // Callers like ProjectDetail pass `project?.setup_id ?? ""` on first
    // render, and we must not install a handler that silently drops every
    // event because its closure captures setupId="".
    if (!setupId) return
    return subscribe((evt) => {
      const p = evt.payload as Record<string, unknown>
      if (p?.setupId !== setupId) return

      switch (evt.type) {
        case "worker_online":
          setOnline(true)
          break
        case "worker_offline":
          setOnline(false)
          break

        case "build_started": {
          // Explicit lifecycle reset — do NOT merge with prior state even if
          // the buildId happens to match (rebuilds reuse ids).
          const buildId = p.buildId as string
          activeBuildIdRef.current = buildId
          setTimeline(emptyPhaseTimeline())
          setActiveBuild({
            id: buildId,
            setup_id: setupId,
            repo_id: (p.repoId as number) ?? 0,
            repo_name: (p.repoName as string) ?? "",
            head_sha: (p.headSha as string) ?? "",
            status: "in_progress",
            conclusion: null,
            artifact_url: null,
            check_run_url: null,
            started_at: (p.startedAt as string) ?? new Date().toISOString(),
            finished_at: null,
          })
          break
        }

        case "build_update": {
          const buildId = p.buildId as string
          setActiveBuild((prev) => {
            if (prev && prev.id !== buildId) return prev
            if (prev) {
              return {
                ...prev,
                status: (p.status ?? prev.status) as string,
                conclusion: (p.conclusion as string) || prev.conclusion,
                artifact_url: (p.artifactUrl ?? prev.artifact_url) as string | null,
                finished_at: (p.finishedAt ?? prev.finished_at) as string | null,
              }
            }
            // Build is in progress but we haven't seen build_started (e.g. we
            // mounted mid-build). Synthesize the Build and catch up via
            // /snapshot.
            activeBuildIdRef.current = buildId
            void refetchSnapshot(buildId)
            return {
              id: buildId,
              setup_id: setupId,
              repo_id: (p.repoId as number) ?? 0,
              repo_name: (p.repoName as string) ?? "",
              head_sha: (p.headSha as string) ?? "",
              status: (p.status as string) ?? "in_progress",
              conclusion: (p.conclusion as string) || null,
              artifact_url: (p.artifactUrl as string) || null,
              check_run_url: null,
              started_at: (p.startedAt as string) ?? new Date().toISOString(),
              finished_at: (p.finishedAt as string) ?? null,
            }
          })
          break
        }

        case "phase_start":
        case "phase_end":
        case "build_log": {
          const buildId = p.buildId as string
          if (!buildId) break
          // Only fold events that belong to the build we're currently showing.
          // If we don't yet have an active build, latch on — build_update /
          // snapshot will catch up the rest.
          if (activeBuildIdRef.current && activeBuildIdRef.current !== buildId) {
            break
          }
          if (!activeBuildIdRef.current) {
            activeBuildIdRef.current = buildId
            void refetchSnapshot(buildId)
          }

          const seq = typeof p.seq === "number" ? p.seq : 0
          // Gap detection — if the worker skipped ahead, the WS lost frames
          // during a hiccup. Re-seed from /snapshot.
          if (seq > 0 && seq > timelineRef.current.lastSeq + 1) {
            void refetchSnapshot(buildId)
          }

          let structured: StructuredBuildEvent | null = null
          if (evt.type === "phase_start" && typeof p.phaseId === "string") {
            structured = {
              kind: "phase_start",
              seq,
              phaseId: p.phaseId,
              label: (p.label as string) ?? p.phaseId,
            }
          } else if (evt.type === "phase_end" && typeof p.phaseId === "string") {
            structured = {
              kind: "phase_end",
              seq,
              phaseId: p.phaseId,
              status: (p.status as "success" | "failure") ?? "success",
            }
          } else if (evt.type === "build_log" && typeof p.line === "string") {
            structured = { kind: "log", seq, line: p.line }
          }
          if (structured) {
            const s0 = structured
            setTimeline((s) => applyBuildEvent(s, s0))
          }
          break
        }

        case "build_finished": {
          const buildId = p.buildId as string
          setActiveBuild((prev) => {
            if (!prev || prev.id !== buildId) return prev
            return {
              ...prev,
              status: "completed",
              conclusion: (p.conclusion as string) ?? prev.conclusion,
              finished_at: (p.finishedAt as string) ?? prev.finished_at,
            }
          })
          break
        }
      }
    })
  }, [subscribe, setupId, refetchSnapshot])

  // Seed from a caller-provided in-progress build. This is what makes a page
  // reload during a live build show the full current state instead of an
  // empty console. Re-runs if the parent swaps in a different build id
  // (e.g. new rebuild picked up from the REST list).
  const initialBuildId = initialBuild?.id ?? null
  useEffect(() => {
    if (!initialBuildId) return
    // If a WS `build_started` has already moved us onto this build, don't
    // clobber its state — just refetch to merge anything we might have
    // missed pre-mount.
    if (activeBuildIdRef.current === initialBuildId) {
      void refetchSnapshot(initialBuildId)
      return
    }
    activeBuildIdRef.current = initialBuildId
    setTimeline(emptyPhaseTimeline())
    if (initialBuild) setActiveBuild(initialBuild)
    void refetchSnapshot(initialBuildId)
    // We intentionally key the effect on the build id, not the whole object,
    // so parents re-creating the Build reference on every render don't
    // re-trigger a reset. `initialBuild` is read inside for the seed value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBuildId, refetchSnapshot])

  // On every WS (re)open, catch up from /snapshot for whichever build we're
  // currently tracking. This is the fix for "log stream stops updating after
  // a while" — any events dropped while the socket was dead are replayed.
  useEffect(() => {
    if (connectionEpoch === 0) return
    const bid = activeBuildIdRef.current
    if (bid) void refetchSnapshot(bid)
  }, [connectionEpoch, refetchSnapshot])

  const phases = useMemo(() => timelinePhases(timeline), [timeline])

  return { online, activeBuild, phases }
}
