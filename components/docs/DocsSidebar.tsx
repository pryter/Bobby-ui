"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import type { DocMeta } from "@/lib/docs"

export default function DocsSidebar({ docs }: { docs: DocMeta[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [winH, setWinH] = useState(844)

  useEffect(() => {
    const measure = () => setWinH(window.innerHeight)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Close on route change so navigating a doc collapses the panel.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (slug: string) => {
    if (slug === "introduction") return pathname === "/docs" || pathname === `/docs/${slug}`
    return pathname === `/docs/${slug}`
  }

  const spring = { type: "spring", stiffness: 320, damping: 32 } as const

  return (
    <>
      {/* ── DESKTOP sidebar (unchanged column layout) ─────────────────────── */}
      <aside
        className="hidden lg:block sticky top-28 h-[calc(100vh-7rem)] w-72 shrink-0
                   border-r border-black/[0.06] dark:border-white/[0.06]
                   pr-6 overflow-y-auto"
      >
        <div className="mb-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
          Documentation
        </div>
        <nav className="flex flex-col gap-0.5">
          {docs.map((doc) => {
            const active = isActive(doc.slug)
            return (
              <Link
                key={doc.slug}
                href={`/docs/${doc.slug}`}
                className="relative px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="docs-active-pill-desktop"
                    className="absolute inset-0 rounded-lg bg-black/[0.05] dark:bg-white/[0.06]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={
                    "relative z-10 " +
                    (active
                      ? "text-black dark:text-white font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white")
                  }
                >
                  {doc.title}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* ── MOBILE backdrop ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="docs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── MOBILE morphing pill → panel ──────────────────────────────────
          Single persistent motion.div anchored bottom-right. Animates its own
          width/height/borderRadius between the floating "Contents" pill and a
          full-height side panel — same pattern as the landing nav, mirrored to
          the right edge. Two content layers cross-fade inside.                */}
      <motion.div
        initial={false}
        animate={{
          width:        mobileOpen ? 304        : "auto",
          height:       mobileOpen ? winH - 32  : 48,
          borderRadius: mobileOpen ? 24         : 24,
          right:        mobileOpen ? 16         : 24,
          bottom:       mobileOpen ? 16         : 24,
        }}
        transition={{
          width:        spring,
          height:       spring,
          borderRadius: spring,
          right:        spring,
          bottom:       spring,
        }}
        className="fixed z-[60] lg:hidden overflow-hidden
                   bg-[#111]/95 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/40"
      >
        {/* ── Pill content (drives intrinsic size when collapsed) ──────── */}
        <motion.button
          onClick={() => setMobileOpen(true)}
          animate={{ opacity: mobileOpen ? 0 : 1 }}
          transition={{ duration: mobileOpen ? 0.08 : 0.18, delay: mobileOpen ? 0 : 0.22 }}
          style={{ pointerEvents: mobileOpen ? "none" : "auto" }}
          className="h-12 pl-5 pr-4 flex items-center gap-2 text-bobby-lime text-sm font-bold whitespace-nowrap"
          aria-label="Open contents"
        >
          <span>Contents</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <rect y="0"   width="14" height="1.5" rx="0.75" fill="currentColor"/>
            <rect y="4.25" width="9"  height="1.5" rx="0.75" fill="currentColor"/>
            <rect y="8.5"  width="14" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </motion.button>

        {/* ── Panel content (fades in once expanded) ───────────────────── */}
        <motion.div
          animate={{ opacity: mobileOpen ? 1 : 0 }}
          transition={{ duration: 0.18, delay: mobileOpen ? 0.24 : 0 }}
          style={{ pointerEvents: mobileOpen ? "auto" : "none" }}
          className="absolute inset-0 flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              Documentation
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-sm"
              aria-label="Close contents"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col px-3 py-4 gap-0.5 flex-1 overflow-y-auto">
            {docs.map((doc, i) => {
              const active = isActive(doc.slug)
              return (
                <motion.div
                  key={doc.slug}
                  initial={false}
                  animate={{
                    opacity: mobileOpen ? 1 : 0,
                    x:       mobileOpen ? 0 : 8,
                  }}
                  transition={{
                    delay:    mobileOpen ? i * 0.04 + 0.3 : 0,
                    duration: 0.2,
                    ease:     [0.22, 0.1, 0.35, 1],
                  }}
                >
                  <Link
                    href={`/docs/${doc.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="relative block px-4 py-3 rounded-xl text-sm transition-colors"
                  >
                    {active && (
                      <motion.div
                        layoutId="docs-active-pill-mobile"
                        className="absolute inset-0 rounded-xl bg-white/[0.08]"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span
                      className={
                        "relative z-10 " +
                        (active
                          ? "text-white font-semibold"
                          : "text-gray-300 hover:text-white")
                      }
                    >
                      {doc.title}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </nav>
        </motion.div>
      </motion.div>
    </>
  )
}
