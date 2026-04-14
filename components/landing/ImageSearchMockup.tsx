"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MagnifyingGlassIcon,
  StarIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

// ── Fake data (enough to look like the real ImagePicker) ─────────────────────
const SEARCH_QUERY = "postgres"

const REPOS = [
  { name: "library/postgres",           desc: "The PostgreSQL object-relational database system.", stars: 13200, official: true },
  { name: "bitnami/postgresql",         desc: "Bitnami PostgreSQL Docker Image",                    stars:  1240, official: false },
  { name: "timescale/timescaledb",      desc: "An open-source time-series SQL database.",           stars:   890, official: false },
  { name: "postgis/postgis",            desc: "PostgreSQL with PostGIS spatial extensions.",        stars:   620, official: false },
]

const VERSIONS = ["17", "16", "15", "14", "13"]
const VARIANTS  = ["alpine", "bookworm", "bullseye", "trixie"]
const MATCHING_TAGS = [
  { name: "16-alpine",         size: "147 MB", updated: "2d ago" },
  { name: "16.3-alpine",       size: "147 MB", updated: "1w ago" },
  { name: "16-alpine3.19",     size: "148 MB", updated: "3w ago" },
  { name: "16.2-alpine3.19",   size: "148 MB", updated: "1m ago" },
]

// ── Animation script — one frame per second-ish ──────────────────────────────
// Each "phase" is a visual milestone; within a phase we may animate something
// continuously (e.g. typing characters).
type Phase =
  | { kind: "idle" }
  | { kind: "typing"; chars: number }
  | { kind: "results"; hovered: number }
  | { kind: "picked" }               // repo selected, tags panel visible
  | { kind: "versionOpen"; hovered: number }
  | { kind: "versionPicked" }
  | { kind: "variantOpen"; hovered: number }
  | { kind: "done" }                 // showing final chips
  | { kind: "reset" }

export default function ImageSearchMockup() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })

  useEffect(() => {
    let stopped = false
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    const run = async () => {
      while (!stopped) {
        // Idle
        setPhase({ kind: "idle" })
        await sleep(800)

        // Type "postgres" one char at a time
        for (let i = 1; i <= SEARCH_QUERY.length; i++) {
          setPhase({ kind: "typing", chars: i })
          await sleep(95)
          if (stopped) return
        }
        await sleep(350)

        // Results appear, simulated pointer walks down a couple rows
        setPhase({ kind: "results", hovered: -1 })
        await sleep(350)
        setPhase({ kind: "results", hovered: 0 })
        await sleep(550)
        setPhase({ kind: "results", hovered: 1 })
        await sleep(600)
        setPhase({ kind: "results", hovered: 0 })
        await sleep(350)

        // Click postgres
        setPhase({ kind: "picked" })
        await sleep(900)

        // Open version dropdown, hover "17" then "16", click 16
        setPhase({ kind: "versionOpen", hovered: 0 })
        await sleep(500)
        setPhase({ kind: "versionOpen", hovered: 1 })
        await sleep(650)
        setPhase({ kind: "versionPicked" })
        await sleep(600)

        // Open variant dropdown, hover "alpine", click
        setPhase({ kind: "variantOpen", hovered: 0 })
        await sleep(750)
        setPhase({ kind: "done" })
        await sleep(2000)

        // Reset back to idle
        setPhase({ kind: "reset" })
        await sleep(500)
      }
    }
    run()
    return () => { stopped = true }
  }, [])

  // ── Derived visuals from phase ────────────────────────────────────────────
  const typed =
    phase.kind === "typing"
      ? SEARCH_QUERY.slice(0, phase.chars)
      : phase.kind === "idle" || phase.kind === "reset"
      ? ""
      : SEARCH_QUERY

  const showCursor = phase.kind === "idle" || phase.kind === "typing"
  const showResults = phase.kind === "results"
  const showTags = ["picked", "versionOpen", "versionPicked", "variantOpen", "done"].includes(phase.kind)
  const showVersionDropdown = phase.kind === "versionOpen"
  const showVariantDropdown = phase.kind === "variantOpen"
  const versionPicked = ["versionPicked", "variantOpen", "done"].includes(phase.kind) ? "16" : null
  const variantPicked = phase.kind === "done" ? "alpine" : null
  const showMatchingTags = phase.kind === "done"

  return (
    <div className="relative h-full w-full rounded-2xl border border-gray-200 bg-white
                    dark:border-white/[0.08] dark:bg-[#0c0c0c] p-5 md:p-6 overflow-hidden">
      {/* Ambient lime glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.35), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-4">
        {/* ── Search input ─────────────────────────────────────────────── */}
        <div className="relative">
          <div
            className={
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm " +
              "bg-white dark:bg-[#141414] " +
              (showResults
                ? "border-[#a3e635] ring-2 ring-[#a3e635]/30"
                : "border-gray-200 dark:border-white/[0.10]")
            }
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            <div className="flex-1 font-mono text-gray-900 dark:text-white tabular-nums">
              {typed}
              {showCursor && (
                <span className="ml-[1px] inline-block w-[1px] h-4 align-middle bg-gray-900 dark:bg-white animate-pulse" />
              )}
              {!typed && !showCursor && (
                <span className="text-gray-400 dark:text-gray-600">Search Docker Hub…</span>
              )}
            </div>
            {typed && phase.kind !== "idle" && phase.kind !== "reset" && (
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            )}
          </div>

          {/* Results dropdown */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-full mt-1.5 z-10
                           rounded-lg border border-gray-200 bg-white shadow-lg
                           dark:border-white/[0.10] dark:bg-[#1a1a1a] overflow-hidden"
              >
                {REPOS.map((r, i) => {
                  const hovered = phase.kind === "results" && phase.hovered === i
                  return (
                    <div
                      key={r.name}
                      className={
                        "flex items-start gap-3 px-3 py-2 text-sm transition-colors " +
                        (hovered ? "bg-gray-50 dark:bg-white/[0.04]" : "")
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-900 dark:text-white truncate">
                            {r.name.startsWith("library/") ? r.name.slice(8) : r.name}
                          </span>
                          {r.official && (
                            <CheckBadgeIcon className="h-3.5 w-3.5 text-[#a3e635] flex-none" />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {r.desc}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <StarIcon className="h-3 w-3" />
                        <span className="tabular-nums">{r.stars.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Selected repo / tags ─────────────────────────────────────── */}
        <AnimatePresence>
          {showTags && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-3"
            >
              {/* Repo pill */}
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/[0.08]
                              bg-gray-50 dark:bg-white/[0.03] px-3 py-2 text-sm">
                <span className="font-mono text-gray-900 dark:text-white">postgres</span>
                <CheckBadgeIcon className="h-3.5 w-3.5 text-[#a3e635]" />
                <span className="text-gray-400 dark:text-gray-500 text-xs">Official image</span>
              </div>

              {/* Two dropdown buttons */}
              <div className="grid grid-cols-2 gap-3">
                <DropdownButton
                  label="Version"
                  value={versionPicked ?? "—"}
                  active={showVersionDropdown}
                  placeholder="Any version"
                />
                <DropdownButton
                  label="Distribution"
                  value={variantPicked ?? "—"}
                  active={showVariantDropdown}
                  placeholder="Any distro"
                />
              </div>

              {/* Version dropdown panel */}
              <AnimatePresence>
                {showVersionDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="-mt-1 rounded-lg border border-gray-200 bg-white shadow-lg
                               dark:border-white/[0.10] dark:bg-[#1a1a1a] overflow-hidden
                               mr-auto w-1/2 pr-1.5"
                  >
                    {VERSIONS.map((v, i) => {
                      const hovered = phase.kind === "versionOpen" && phase.hovered === i
                      return (
                        <div
                          key={v}
                          className={
                            "px-3 py-1.5 text-sm font-mono transition-colors " +
                            (hovered
                              ? "bg-[#a3e635]/10 text-[#7ba320] dark:text-[#a3e635]"
                              : "text-gray-700 dark:text-gray-200")
                          }
                        >
                          {v}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Variant dropdown panel */}
              <AnimatePresence>
                {showVariantDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="-mt-1 rounded-lg border border-gray-200 bg-white shadow-lg
                               dark:border-white/[0.10] dark:bg-[#1a1a1a] overflow-hidden
                               ml-auto w-1/2 pl-1.5"
                  >
                    {VARIANTS.map((v, i) => {
                      const hovered = phase.kind === "variantOpen" && phase.hovered === i
                      const suggested = v === "alpine"
                      return (
                        <div
                          key={v}
                          className={
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-mono transition-colors " +
                            (hovered
                              ? "bg-[#a3e635]/10 text-[#7ba320] dark:text-[#a3e635]"
                              : "text-gray-700 dark:text-gray-200")
                          }
                        >
                          <span>{v}</span>
                          {suggested && (
                            <span className="text-[9px] uppercase tracking-wider rounded
                                             border border-[#a3e635]/40 bg-[#a3e635]/10
                                             text-[#7ba320] dark:text-[#a3e635]
                                             px-1 py-[1px]">
                              suggested
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Matching tag chips */}
              <AnimatePresence>
                {showMatchingTags && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, staggerChildren: 0.05 }}
                    className="flex flex-col gap-1.5"
                  >
                    <div className="text-[11px] uppercase tracking-[0.15em] text-gray-400 font-semibold">
                      Matching tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {MATCHING_TAGS.map((t, i) => (
                        <motion.div
                          key={t.name}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.25 }}
                          className="inline-flex items-center gap-1.5 rounded-md
                                     border border-[#a3e635]/40 bg-[#a3e635]/10
                                     px-2 py-1 text-xs font-mono
                                     text-[#5f8418] dark:text-[#a3e635]"
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-gray-400">{t.size}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function DropdownButton({
  label, value, active, placeholder,
}: {
  label: string
  value: string
  active: boolean
  placeholder: string
}) {
  const hasValue = value !== "—"
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold">
        {label}
      </span>
      <div
        className={
          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm " +
          "bg-white dark:bg-[#141414] transition-colors " +
          (active
            ? "border-[#a3e635] ring-2 ring-[#a3e635]/30"
            : "border-gray-200 dark:border-white/[0.10]")
        }
      >
        <span
          className={
            "font-mono " +
            (hasValue
              ? "text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-600")
          }
        >
          {hasValue ? value : placeholder}
        </span>
        <ChevronDownIcon
          className={"h-4 w-4 text-gray-400 transition-transform " + (active ? "rotate-180" : "")}
        />
      </div>
    </div>
  )
}
