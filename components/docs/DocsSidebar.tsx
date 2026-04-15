"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useMemo, useState } from "react"
import type { DocNode } from "@/lib/docs"

type Variant = "desktop" | "mobile"

function isAncestorActive(node: DocNode, pathname: string): boolean {
  if (node.type === "doc") return false
  return node.children.some((child) =>
    child.type === "doc"
      ? pathname === `/docs/${child.slug}`
      : isAncestorActive(child, pathname),
  )
}

function NodeList({
  nodes,
  pathname,
  variant,
  depth,
  onNavigate,
}: {
  nodes: DocNode[]
  pathname: string
  variant: Variant
  depth: number
  onNavigate?: () => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((node) =>
        node.type === "doc" ? (
          <DocLink
            key={node.slug}
            slug={node.slug}
            title={node.title}
            pathname={pathname}
            variant={variant}
            depth={depth}
            onNavigate={onNavigate}
          />
        ) : (
          <CategorySection
            key={node.slug}
            node={node}
            pathname={pathname}
            variant={variant}
            depth={depth}
            onNavigate={onNavigate}
          />
        ),
      )}
    </div>
  )
}

function DocLink({
  slug,
  title,
  pathname,
  variant,
  depth,
  onNavigate,
}: {
  slug: string
  title: string
  pathname: string
  variant: Variant
  depth: number
  onNavigate?: () => void
}) {
  const active =
    pathname === `/docs/${slug}` ||
    (slug === "introduction" && pathname === "/docs")

  const desktop = variant === "desktop"

  return (
    <Link
      href={`/docs/${slug}`}
      onClick={onNavigate}
      className="relative block px-3 py-2 rounded-lg text-sm transition-colors"
    >
      {active && (
        <motion.div
          layoutId={`docs-active-pill-${variant}`}
          className={
            "absolute inset-0 rounded-lg " +
            (desktop ? "bg-black/[0.05] dark:bg-white/[0.06]" : "bg-white/[0.08]")
          }
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span
        className={
          "relative z-10 " +
          (active
            ? desktop
              ? "text-black dark:text-white font-semibold"
              : "text-white font-semibold"
            : desktop
              ? "text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
              : "text-gray-300 hover:text-white")
        }
      >
        {title}
      </span>
    </Link>
  )
}

function CategorySection({
  node,
  pathname,
  variant,
  depth,
  onNavigate,
}: {
  node: Extract<DocNode, { type: "category" }>
  pathname: string
  variant: Variant
  depth: number
  onNavigate?: () => void
}) {
  const hasActive = isAncestorActive(node, pathname)
  const [open, setOpen] = useState(true)

  // Auto-expand if a descendant becomes active.
  useEffect(() => {
    if (hasActive) setOpen(true)
  }, [hasActive])

  const desktop = variant === "desktop"

  return (
    <div className="flex flex-col mt-5 first:mt-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={
          "flex items-center justify-between mb-2 text-[11px] uppercase tracking-wider font-semibold transition-colors " +
          (desktop
            ? "text-gray-500 hover:text-black dark:hover:text-white"
            : "text-gray-500 hover:text-white")
        }
        aria-expanded={open}
      >
        <span>{node.title}</span>
        <motion.svg
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className="ml-2"
        >
          <path
            d="M5 3.5L9 7L5 10.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-0.5">
              <NodeList
                nodes={node.children}
                pathname={pathname}
                variant={variant}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DocsSidebar({ tree }: { tree: DocNode[] }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [winH, setWinH] = useState(844)

  useEffect(() => {
    const measure = () => setWinH(window.innerHeight)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const spring = { type: "spring", stiffness: 320, damping: 32 } as const

  // Stable reference so AnimatePresence layout pills share identity across renders.
  const nodes = useMemo(() => tree, [tree])

  return (
    <>
      {/* ── DESKTOP sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:block sticky top-28 h-[calc(100vh-7rem)] w-72 shrink-0
                   border-r border-black/[0.06] dark:border-white/[0.06]
                   pr-6 overflow-y-auto"
      >
        <div className="mb-4 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
          Documentation
        </div>
        <nav>
          <NodeList nodes={nodes} pathname={pathname} variant="desktop" depth={0} />
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

      {/* ── MOBILE morphing pill → panel ─────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{
          width: mobileOpen ? 304 : "auto",
          height: mobileOpen ? winH - 32 : 48,
          borderRadius: 24,
          right: mobileOpen ? 16 : 24,
          bottom: mobileOpen ? 16 : 24,
        }}
        transition={{
          width: spring,
          height: spring,
          borderRadius: spring,
          right: spring,
          bottom: spring,
        }}
        className="fixed z-[60] lg:hidden overflow-hidden
                   bg-[#111]/95 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/40"
      >
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
            <rect y="0" width="14" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="4.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
            <rect y="8.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </motion.button>

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

          <nav className="px-3 py-4 flex-1 overflow-y-auto">
            <NodeList
              nodes={nodes}
              pathname={pathname}
              variant="mobile"
              depth={0}
              onNavigate={() => setMobileOpen(false)}
            />
          </nav>
        </motion.div>
      </motion.div>
    </>
  )
}
