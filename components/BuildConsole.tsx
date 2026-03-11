"use client"

import { useState, useEffect, useRef } from "react"
import { BuildPhase } from "@/lib/buildPhases"
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"

function PhaseIcon({ status }: { status: BuildPhase["status"] }) {
  if (status === "success")
    return <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-400" />
  if (status === "failure")
    return <XCircleIcon className="h-4 w-4 shrink-0 text-red-400" />
  if (status === "running")
    return (
      <span className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
    )
  return <span className="inline-block h-4 w-4 shrink-0 rounded-full border-2 border-gray-600" />
}

function PhaseSection({
  phase,
  isLast,
  active,
}: {
  phase: BuildPhase
  isLast: boolean
  active: boolean
}) {
  const [open, setOpen] = useState(
    phase.status === "running" || phase.status === "failure" || (isLast && active)
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase.status === "running" || (isLast && active)) setOpen(true)
  }, [phase.status, isLast, active])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [phase.logs.length, open])

  const labelColor =
    phase.status === "success"
      ? "text-green-400"
      : phase.status === "failure"
      ? "text-red-400"
      : phase.status === "running"
      ? "text-yellow-400"
      : "text-gray-400"

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-800 transition-colors"
      >
        <PhaseIcon status={phase.status} />
        <span className={`flex-1 text-xs font-semibold tracking-wide ${labelColor}`}>
          {phase.label}
        </span>
        <span className="mr-2 text-xs text-gray-600">{phase.logs.length} lines</span>
        {open ? (
          <ChevronDownIcon className="h-3 w-3 shrink-0 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 shrink-0 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="bg-gray-950 px-8 py-2">
          {phase.logs.length === 0 ? (
            <span className="text-gray-500 text-xs font-mono italic">Waiting for output…</span>
          ) : (
            phase.logs.map((line, i) => (
              <div
                key={i}
                className="text-green-400 text-xs font-mono leading-5 whitespace-pre-wrap break-all"
              >
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}

interface BuildConsoleProps {
  phases: BuildPhase[]
  active: boolean
}

export default function BuildConsole({ phases, active }: BuildConsoleProps) {
  if (!active && phases.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-gray-700">Build Console</h3>
        {active && (
          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="max-h-[28rem] overflow-y-auto rounded-xl bg-gray-900 divide-y divide-gray-800">
        {phases.length === 0 ? (
          <div className="px-4 py-3 text-xs font-mono italic text-gray-500">
            Waiting for build output…
          </div>
        ) : (
          phases.map((phase, i) => (
            <PhaseSection
              key={phase.id + i}
              phase={phase}
              isLast={i === phases.length - 1}
              active={active}
            />
          ))
        )}
      </div>
    </div>
  )
}
