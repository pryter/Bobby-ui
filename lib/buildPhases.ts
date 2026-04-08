import type { BuildSnapshotEvent } from "./api"

export interface BuildPhase {
  id: string
  label: string
  status: "pending" | "running" | "success" | "failure"
  logs: string[]
}

/** Internal state used to fold a sequence of structured build events into the
 *  shape BuildConsole renders. Phases are keyed on the stable `phaseId`, not
 *  insertion order, so re-applying the same events (e.g. after a snapshot
 *  refresh) is idempotent. */
export interface PhaseTimelineState {
  phasesById: Record<string, BuildPhase>
  phaseOrder: string[]
  orphanLogs: string[]
  openPhaseId: string | null
  lastSeq: number
}

export function emptyPhaseTimeline(): PhaseTimelineState {
  return {
    phasesById: {},
    phaseOrder: [],
    orphanLogs: [],
    openPhaseId: null,
    lastSeq: 0,
  }
}

/** Unified shape for both WS events and snapshot events. `seq` may be 0 for
 *  legacy snapshot entries — those bypass the dedupe check so they still
 *  replay in array order. */
export type StructuredBuildEvent =
  | { kind: "phase_start"; seq: number; phaseId: string; label: string }
  | { kind: "phase_end"; seq: number; phaseId: string; status: "success" | "failure" }
  | { kind: "log"; seq: number; line: string }

export function applyBuildEvent(
  state: PhaseTimelineState,
  evt: StructuredBuildEvent,
): PhaseTimelineState {
  // Dedupe: any event whose seq we've already processed is a duplicate.
  // seq === 0 is the legacy-snapshot escape hatch — always apply those.
  if (evt.seq > 0 && evt.seq <= state.lastSeq) return state

  const nextLastSeq = Math.max(state.lastSeq, evt.seq)

  switch (evt.kind) {
    case "phase_start": {
      const existing = state.phasesById[evt.phaseId]
      const phasesById = {
        ...state.phasesById,
        [evt.phaseId]: {
          id: evt.phaseId,
          label: evt.label,
          status: "running" as const,
          logs: existing?.logs ?? [],
        },
      }
      const phaseOrder = existing
        ? state.phaseOrder
        : [...state.phaseOrder, evt.phaseId]
      return {
        ...state,
        phasesById,
        phaseOrder,
        openPhaseId: evt.phaseId,
        lastSeq: nextLastSeq,
      }
    }

    case "phase_end": {
      const existing = state.phasesById[evt.phaseId]
      if (!existing) {
        return { ...state, lastSeq: nextLastSeq }
      }
      return {
        ...state,
        phasesById: {
          ...state.phasesById,
          [evt.phaseId]: { ...existing, status: evt.status },
        },
        openPhaseId: state.openPhaseId === evt.phaseId ? null : state.openPhaseId,
        lastSeq: nextLastSeq,
      }
    }

    case "log": {
      if (state.openPhaseId) {
        const ph = state.phasesById[state.openPhaseId]
        if (!ph) return { ...state, lastSeq: nextLastSeq }
        return {
          ...state,
          phasesById: {
            ...state.phasesById,
            [state.openPhaseId]: { ...ph, logs: [...ph.logs, evt.line] },
          },
          lastSeq: nextLastSeq,
        }
      }
      return {
        ...state,
        orphanLogs: [...state.orphanLogs, evt.line],
        lastSeq: nextLastSeq,
      }
    }
  }
}

/** Project the internal state into the ordered array BuildConsole expects. */
export function timelinePhases(state: PhaseTimelineState): BuildPhase[] {
  return state.phaseOrder
    .map((id) => state.phasesById[id])
    .filter((p): p is BuildPhase => !!p)
}

/** Normalize a snapshot event into the internal StructuredBuildEvent shape,
 *  or return null if it's malformed / unknown. */
export function normalizeSnapshotEvent(
  e: BuildSnapshotEvent,
): StructuredBuildEvent | null {
  if (e.type === "phase_start" && e.phaseId) {
    return {
      kind: "phase_start",
      seq: e.seq,
      phaseId: e.phaseId,
      label: e.label ?? e.phaseId,
    }
  }
  if (e.type === "phase_end" && e.phaseId && e.status) {
    return { kind: "phase_end", seq: e.seq, phaseId: e.phaseId, status: e.status }
  }
  if (e.type === "log" && typeof e.line === "string") {
    return { kind: "log", seq: e.seq, line: e.line }
  }
  return null
}

/** Fold a snapshot event array into a phase timeline. Used for initial page
 *  load, completed-build views, and reconnect catch-up. */
export function timelineFromSnapshotEvents(
  events: BuildSnapshotEvent[],
  initial: PhaseTimelineState = emptyPhaseTimeline(),
): PhaseTimelineState {
  let s = initial
  for (const e of events) {
    const ne = normalizeSnapshotEvent(e)
    if (ne) s = applyBuildEvent(s, ne)
  }
  return s
}
