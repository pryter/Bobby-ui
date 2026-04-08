"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { getWorkerStreamURL } from "@/lib/api"
import { useAuth } from "./AuthProvider"

/**
 * All event types the Service → UI WS can emit. The build-streaming set
 * mirrors the worker → service instructions 1:1 (see STREAMING_API.md §2).
 */
export type WorkerStreamEventType =
  | "worker_online"
  | "worker_offline"
  | "build_update"
  | "build_started"
  | "phase_start"
  | "build_log"
  | "phase_end"
  | "build_finished"

export interface WorkerStreamEvent {
  type: WorkerStreamEventType
  payload: Record<string, unknown>
}

type EventHandler = (event: WorkerStreamEvent) => void

interface WorkerStreamContextValue {
  /** Subscribe to all worker stream events. Returns an unsubscribe function. */
  subscribe: (handler: EventHandler) => () => void
  /** Increments every time the WS successfully (re)opens. Consumers can watch
   *  this to trigger snapshot catch-up after a reconnect. Starts at 0 and
   *  becomes 1 on the first open. */
  connectionEpoch: number
}

const WorkerStreamContext = createContext<WorkerStreamContextValue | null>(null)

/**
 * Maintains a single persistent WebSocket for the entire dashboard session.
 * Lives in the layout so it survives page navigations — no reconnect when
 * switching between Workers and Projects pages.
 *
 * Per the 2026-04 streaming rewrite, the server writes a Ping every 25s and
 * enforces a 60s read deadline; browsers reply to Pings automatically so the
 * client just needs to detect close/error and reconnect with backoff.
 */
export function WorkerStreamProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const handlersRef = useRef<Set<EventHandler>>(new Set())
  const [connectionEpoch, setConnectionEpoch] = useState(0)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    let ws: WebSocket | null = null
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (cancelled) return
      ws = new WebSocket(getWorkerStreamURL(token))

      ws.onopen = () => {
        // Successful open — reset backoff and bump the epoch so subscribers
        // know to re-seed from /snapshot.
        retryDelay = 1000
        setConnectionEpoch((e) => e + 1)
      }

      ws.onmessage = (e) => {
        let evt: WorkerStreamEvent
        try {
          evt = JSON.parse(e.data as string)
        } catch {
          return
        }
        handlersRef.current.forEach((h) => h(evt))
      }

      ws.onclose = () => {
        if (cancelled) return
        // Exponential backoff: 1s → 2s → 4s → … → 30s max
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30_000)
          connect()
        }, retryDelay)
      }

      ws.onerror = () => {
        // onclose fires after onerror — reconnect logic is handled there
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      ws?.close()
    }
  }, [token])

  const subscribe = useCallback((handler: EventHandler): (() => void) => {
    handlersRef.current.add(handler)
    return () => {
      handlersRef.current.delete(handler)
    }
  }, [])

  const value = useMemo<WorkerStreamContextValue>(
    () => ({ subscribe, connectionEpoch }),
    [subscribe, connectionEpoch],
  )

  return (
    <WorkerStreamContext.Provider value={value}>
      {children}
    </WorkerStreamContext.Provider>
  )
}

export function useWorkerStreamContext(): WorkerStreamContextValue {
  const ctx = useContext(WorkerStreamContext)
  if (!ctx) throw new Error("useWorkerStreamContext must be inside <WorkerStreamProvider>")
  return ctx
}
