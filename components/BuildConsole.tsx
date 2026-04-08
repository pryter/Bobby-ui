"use client"

import { useState, useEffect, useRef } from "react"
import { BuildPhase } from "@/lib/buildPhases"
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline"

/* ── Step indicator dot ──────────────────────────────────────────────────── */
function StepDot({ status, index }: { status: BuildPhase["status"]; index: number }) {
  if (status === "success") {
    return (
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500 z-10 shadow-sm">
        <CheckIcon className="h-4 w-4 text-white" />
      </div>
    )
  }
  if (status === "failure") {
    return (
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 z-10 shadow-sm">
        <XMarkIcon className="h-4 w-4 text-white" />
      </div>
    )
  }
  if (status === "running") {
    return (
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center z-10">
        {/* Outer spinning ring */}
        <span className="absolute inset-0 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
        {/* Inner fill */}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 border border-green-200">
          <span className="text-[10px] font-bold text-green-600">{index + 1}</span>
        </span>
      </div>
    )
  }
  // pending
  return (
    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2
                    border-gray-200 bg-white
                    dark:border-white/[0.10] dark:bg-white/[0.04]">
      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{index + 1}</span>
    </div>
  )
}

/* ── Connector line between steps ────────────────────────────────────────── */
function Connector({ status }: { status: BuildPhase["status"] }) {
  const color =
    status === "success"
      ? "bg-green-400 dark:bg-green-500/60"
      : status === "running"
      ? "bg-gradient-to-b from-green-400 to-gray-200 dark:from-green-500/60 dark:to-white/[0.08]"
      : "bg-gray-200 dark:bg-white/[0.08]"
  return <div className={`w-0.5 min-h-[1.5rem] flex-1 ${color} transition-colors duration-500 mx-auto`} />
}

/* ── Single phase step ───────────────────────────────────────────────────── */
function PhaseStep({
  phase,
  index,
  isLast,
}: {
  phase: BuildPhase
  index: number
  isLast: boolean
}) {
  const [open, setOpen] = useState(
    phase.status === "running" || phase.status === "failure"
  )

  useEffect(() => {
    if (phase.status === "running") setOpen(true)
    if (phase.status === "success") setOpen(false)
  }, [phase.status])

  const titleColor =
    phase.status === "success"
      ? "text-gray-800 dark:text-gray-200"
      : phase.status === "failure"
      ? "text-red-600 dark:text-red-400"
      : phase.status === "running"
      ? "text-gray-900 dark:text-white"
      : "text-gray-400 dark:text-gray-500"

  const subtitleText =
    phase.status === "running"
      ? "In progress…"
      : phase.status === "success"
      ? `${phase.logs.length} lines`
      : phase.status === "failure"
      ? "Failed"
      : "Pending"

  const subtitleColor =
    phase.status === "running"
      ? "text-yellow-600 dark:text-yellow-400"
      : phase.status === "success"
      ? "text-gray-400 dark:text-gray-500"
      : phase.status === "failure"
      ? "text-red-400 dark:text-red-400"
      : "text-gray-300 dark:text-gray-600"

  return (
    <div className="flex gap-4">
      {/* Left: dot + connecting line */}
      <div className="flex flex-col items-center">
        <StepDot status={phase.status} index={index} />
        {!isLast && <Connector status={phase.status} />}
      </div>

      {/* Right: step content */}
      <div className="flex-1 pb-5 min-w-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 py-1 text-left group"
        >
          <div className="min-w-0">
            <p className={`text-sm font-semibold leading-tight ${titleColor}`}>{phase.label}</p>
            <p className={`mt-0.5 text-xs ${subtitleColor}`}>{subtitleText}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phase.status === "running" && (
              <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold
                               border-yellow-200 bg-yellow-50 text-yellow-700
                               dark:border-yellow-500/20 dark:bg-yellow-500/[0.08] dark:text-yellow-300">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
                Live
              </span>
            )}
            {(phase.logs.length > 0 || phase.status !== "pending") && (
              open
                ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
                : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
            )}
          </div>
        </button>

        {open && (
          <div className="mt-2 overflow-x-auto rounded-xl border px-4 py-3
                          border-gray-800 bg-gray-950
                          dark:border-white/[0.06] dark:bg-black/60">
            {phase.logs.length === 0 ? (
              <span className="font-mono text-xs italic text-gray-500">
                Waiting for output…
              </span>
            ) : (
              phase.logs.map((line, i) => (
                <div
                  key={i}
                  className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-green-400"
                >
                  {line}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main export ─────────────────────────────────────────────────────────── */
interface BuildConsoleProps {
  phases: BuildPhase[]
  active: boolean
}

export default function BuildConsole({ phases, active }: BuildConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalLines = phases.reduce((sum, p) => sum + p.logs.length, 0)
  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [totalLines, active])

  if (!active && phases.length === 0) return null

  const completedCount = phases.filter((p) => p.status === "success").length

  return (
    <div className="mt-4">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Build Log</h3>
          {active && (
            <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold
                             border-green-200 bg-green-50 text-green-700
                             dark:border-green-500/20 dark:bg-green-500/[0.08] dark:text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
        {phases.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {completedCount} / {phases.length} steps
          </span>
        )}
      </div>

      {/* Stepper card */}
      <div
        ref={scrollRef}
        className="max-h-[32rem] overflow-y-auto rounded-2xl border px-5 pt-5 pb-1
                   border-gray-200/80 bg-white/60
                   dark:border-white/[0.07] dark:bg-white/[0.02]"
      >
        {phases.length === 0 ? (
          <div className="flex items-center gap-4 pb-5">
            <div className="flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full border-2
                            border-gray-200 bg-gray-50
                            dark:border-white/[0.10] dark:bg-white/[0.04]" />
            <p className="text-sm italic text-gray-400 dark:text-gray-500">Waiting for build output…</p>
          </div>
        ) : (
          phases.map((phase, i) => (
            <PhaseStep
              key={phase.id + i}
              phase={phase}
              index={i}
              isLast={i === phases.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
