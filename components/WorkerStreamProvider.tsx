"use client"

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react"
import { getWorkerStreamURL } from "@/lib/api"
import { useAuth } from "./AuthProvider"

export interface WorkerStreamEvent {
  type: "worker_online" | "worker_offline" | "build_update" | "build_log"
  payload: Record<string, unknown>
}

type EventHandler = (event: WorkerStreamEvent) => void

interface WorkerStreamContextValue {
  /** Subscribe to all worker stream events. Returns an unsubscribe function. */
  subscribe: (handler: EventHandler) => () => void
}

const WorkerStreamContext = createContext<WorkerStreamContextValue | null>(null)

/**
 * Maintains a single persistent WebSocket for the entire dashboard session.
 * Lives in the layout so it survives page navigations — no reconnect when
 * switching between Workers and Projects pages.
 */
export function WorkerStreamProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const handlersRef = useRef<Set<EventHandler>>(new Set())

  useEffect(() => {
    if (!token) return

    let cancelled = false
    let ws: WebSocket | null = null
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (cancelled) return
      ws = new WebSocket(getWorkerStreamURL(token))

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

  const subscribe = (handler: EventHandler): (() => void) => {
    handlersRef.current.add(handler)
    return () => handlersRef.current.delete(handler)
  }

  return (
    <WorkerStreamContext.Provider value={{ subscribe }}>
      {children}
    </WorkerStreamContext.Provider>
  )
}

export function useWorkerStreamContext(): WorkerStreamContextValue {
  const ctx = useContext(WorkerStreamContext)
  if (!ctx) throw new Error("useWorkerStreamContext must be inside <WorkerStreamProvider>")
  return ctx
}
