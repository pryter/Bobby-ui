"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, animate, useMotionValue, useReducedMotion, type MotionValue, type PanInfo } from "framer-motion"
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/20/solid"
import StatusBadge from "@/components/products/StatusBadge"
import ProductVisual from "@/components/products/ProductVisual"
import { ACTIVE_PRODUCTS, type Product } from "@/lib/products"

// ─── Products carousel ────────────────────────────────────────────────────────
// One product is "open" at a time: its card widens to reveal an overview panel
// beside the summary column, while the rest stay compact and run off the right
// edge of the page. Swipe/drag, trackpad, arrow keys, the arrow buttons or the
// tabs below all move between them.
//
// It also advances on its own every AUTOPLAY_MS, looping back to the start. The
// active tab fills up as a timer. Autoplay pauses while the pointer is over the
// cards, during a drag, while a control has keyboard focus, when the section is
// off-screen or the tab is hidden — and never runs under prefers-reduced-motion.
//
// The track is always aligned so the open card sits at the left edge. Every
// card before it is compact, so the offset is simply index × (compact + gap).

const GAP = 20
const AUTOPLAY_MS = 6000
const SPRING = { type: "spring", stiffness: 260, damping: 34, mass: 0.9 } as const
const EASE = [0.22, 1, 0.36, 1] as const

type Dims = { mobile: boolean; compact: number; open: number; height: number }

function measure(containerWidth: number): Dims {
  if (containerWidth < 720) {
    // Phones: one size, the open card simply sits at full scale.
    const w = Math.round(containerWidth * 0.86)
    return { mobile: true, compact: w, open: w, height: 440 }
  }
  const compact = Math.round(Math.min(300, Math.max(260, containerWidth * 0.24)))
  const open = Math.round(Math.min(800, Math.max(600, containerWidth * 0.64)))
  return { mobile: false, compact, open, height: 480 }
}

const pad = (n: number) => String(n).padStart(2, "0")

function ArrowButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "prev" ? ArrowLeftIcon : ArrowRightIcon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous product" : "Next product"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900
                 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30
                 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.08]"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function ProductSlide({
  product, index, active, dims, onSelect,
}: {
  product: Product
  index: number
  active: number
  dims: Dims
  onSelect: (i: number) => void
}) {
  const isOpen = index === active
  const isPast = index < active
  const width = isOpen ? dims.open : dims.compact
  // Cards that have slid past the left edge fade away; the one just behind
  // stays faintly visible as a hint that you can go back.
  const opacity = isPast ? (index === active - 1 ? 0.35 : 0) : 1
  // Narrow overview panels drop the feature blurbs and list titles only.
  const roomy = dims.open - dims.compact >= 440

  return (
    <motion.article
      initial={false}
      animate={{ width, opacity, scale: dims.mobile && !isOpen ? 0.94 : 1 }}
      whileHover={!isOpen && !dims.mobile ? { y: -4 } : undefined}
      transition={SPRING}
      onClick={() => { if (!isOpen) onSelect(index) }}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${ACTIVE_PRODUCTS.length}: ${product.name}`}
      aria-current={isOpen ? "true" : undefined}
      style={{ height: dims.height, originX: 0 }}
      className={
        "relative shrink-0 overflow-hidden rounded-[28px] border bg-white text-left transition-[border-color,box-shadow] duration-300 dark:bg-[#111113] " +
        (isOpen
          ? "border-gray-200 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_48px_-24px_rgba(16,24,40,0.25)] dark:border-white/[0.1] dark:shadow-none"
          : "cursor-pointer border-gray-200/70 hover:border-gray-300 dark:border-white/[0.06] dark:hover:border-white/[0.14]")
      }
    >
      <div className="flex h-full">
        {/* Summary column — same width whether the card is open or compact */}
        <div className="flex h-full shrink-0 flex-col p-5" style={{ width: dims.compact }}>
          <div className="flex items-center justify-between">
            <StatusBadge status={product.status} />
            <span className="font-mono text-xs tabular-nums text-gray-400 dark:text-gray-500">{pad(index + 1)}</span>
          </div>
          <ProductVisual
            product={product}
            zoom={1.3}
            sizes="300px"
            priority={index === 0}
            className="mt-4 flex-1 rounded-2xl"
          />
          <h3 className="mt-5 text-xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {product.tagline}
          </p>
          {dims.mobile && (
            <Link
              href={`/products/${product.slug}`}
              tabIndex={isOpen ? 0 : -1}
              className="mt-3 text-sm font-semibold text-gray-900 dark:text-white"
            >
              Explore →
            </Link>
          )}
        </div>

        {/* Overview panel — revealed as the card widens */}
        {!dims.mobile && (
          <motion.div
            initial={false}
            animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 24 }}
            transition={{ duration: isOpen ? 0.45 : 0.15, delay: isOpen ? 0.18 : 0, ease: EASE }}
            aria-hidden={!isOpen}
            className="flex h-full shrink-0 flex-col border-l border-gray-100 py-8 pl-8 pr-9 dark:border-white/[0.06]"
            style={{ width: dims.open - dims.compact, pointerEvents: isOpen ? "auto" : "none" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Overview</p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">{product.summary}</p>
            <ul
              className={
                "mt-6 grid gap-x-6 border-t border-gray-100 pt-6 dark:border-white/[0.06] " +
                (roomy ? "grid-cols-2 gap-y-5" : "grid-cols-1 gap-y-3")
              }
            >
              {(roomy ? product.features : product.features.slice(0, 3)).map((f) => (
                <li key={f.title}>
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="h-2 w-2 flex-none rounded-[2px]" style={{ background: product.accent }} />
                    {f.title}
                  </div>
                  {roomy && (
                    <p className="mt-1 pl-[18px] text-[13px] leading-snug text-gray-500 dark:text-gray-400">{f.short}</p>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-6">
              <Link
                href={`/products/${product.slug}`}
                tabIndex={isOpen ? 0 : -1}
                className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors
                           hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Explore {product.shortName} →
              </Link>
              {product.primary?.external && (
                <a
                  href={product.primary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isOpen ? 0 : -1}
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  {product.primary.label} ↗
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.article>
  )
}

// Dark fill that grows across the active tab/segment as the autoplay timer runs.
function TimerFill({ progress, full }: { progress: MotionValue<number>; full: boolean }) {
  return (
    <motion.span
      className="absolute inset-0 rounded-full bg-gray-900 dark:bg-white"
      style={{ scaleX: full ? 1 : progress, originX: 0 }}
    />
  )
}

export default function ProductCarousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<Dims>(() => measure(1152))
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const x = useMotionValue(0)
  const dragged = useRef(false)
  const count = ACTIVE_PRODUCTS.length

  // Autoplay state — `progress` runs 0 → 1 over AUTOPLAY_MS for the open card.
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useMotionValue(0)
  const reducedMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const paused = hovered || keyboardFocus || dragging || !inView || !pageVisible || !!reducedMotion

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setDims(measure(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const offsetFor = useCallback((i: number) => -i * (dims.compact + GAP), [dims.compact])

  useEffect(() => {
    activeRef.current = active
    const controls = animate(x, offsetFor(active), SPRING)
    return () => controls.stop()
  }, [active, offsetFor, x])

  const go = useCallback((i: number) => {
    const next = Math.max(0, Math.min(count - 1, i))
    // Same index (short drag, or pushing past either end) → spring back into place.
    if (next === activeRef.current) animate(x, offsetFor(next), SPRING)
    setActive(next)
  }, [count, offsetFor, x])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    const onVisibility = () => setPageVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVisibility) }
  }, [])

  // Each new card starts its timer from zero…
  useEffect(() => { progress.set(0) }, [active, progress])

  // …and runs it while nothing is pausing autoplay. Pausing keeps the progress,
  // so the timer resumes where it left off instead of restarting.
  useEffect(() => {
    if (paused) return
    const remaining = AUTOPLAY_MS * (1 - progress.get())
    const controls = animate(progress, 1, {
      duration: remaining / 1000,
      ease: "linear",
      onComplete: () => go((activeRef.current + 1) % count),
    })
    return () => controls.stop()
  }, [paused, active, progress, go, count])

  // Trackpad: one horizontal swipe = one step. The lock holds until the wheel
  // goes quiet, so a swipe's inertia tail doesn't skip a second card. Native
  // listener (non-passive) so the swipe doesn't also trigger browser back/forward.
  useEffect(() => {
    const el = regionRef.current
    if (!el) return
    let locked = false
    let quiet: ReturnType<typeof setTimeout> | undefined
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      clearTimeout(quiet)
      quiet = setTimeout(() => { locked = false }, 220)
      if (locked || Math.abs(e.deltaX) < 8) return
      locked = true
      go(activeRef.current + (e.deltaX > 0 ? 1 : -1))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => { el.removeEventListener("wheel", onWheel); clearTimeout(quiet) }
  }, [go])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info
    const swiped = Math.abs(offset.x) > 60 || Math.abs(velocity.x) > 450
    const dir = swiped ? (offset.x + velocity.x * 0.2 < 0 ? 1 : -1) : 0
    go(activeRef.current + dir)
  }

  return (
    <section ref={sectionRef} id="products" className="scroll-mt-24 overflow-hidden px-5 pb-32 pt-8 md:px-12">
      <div ref={containerRef} className="mx-auto max-w-6xl">
        {/* Heading + controls */}
        <div className="mb-10 flex items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
              Products
            </p>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              What we&apos;ve built.
            </h2>
          </motion.div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="mr-2 font-mono text-sm tabular-nums text-gray-400 dark:text-gray-500">
              <span className="text-gray-900 dark:text-white">{pad(active + 1)}</span> / {pad(count)}
            </span>
            <ArrowButton dir="prev" disabled={active === 0} onClick={() => go(active - 1)} />
            <ArrowButton dir="next" disabled={active === count - 1} onClick={() => go(active + 1)} />
          </div>
        </div>

        {/* Track */}
        <div
          ref={regionRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Products"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1) }
            if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1) }
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          // Only keyboard focus pauses — a mouse click shouldn't stop autoplay for good.
          onFocus={(e) => setKeyboardFocus(e.target.matches(":focus-visible"))}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKeyboardFocus(false) }}
          className="rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4
                     focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0d0d0f]"
        >
          <motion.div
            className="flex cursor-grab items-start active:cursor-grabbing"
            style={{ x, gap: GAP }}
            drag="x"
            dragMomentum={false}
            dragConstraints={{ left: offsetFor(count - 1), right: 0 }}
            dragElastic={0.18}
            onPointerDownCapture={() => { dragged.current = false }}
            onDragStart={() => setDragging(true)}
            onDrag={(_, info) => { if (Math.abs(info.offset.x) > 6) dragged.current = true }}
            onDragEnd={(e, info) => { setDragging(false); onDragEnd(e, info) }}
            onClickCapture={(e) => {
              // A drag that ends over a card shouldn't also count as a click on it.
              if (dragged.current) { e.preventDefault(); e.stopPropagation() }
            }}
          >
            {ACTIVE_PRODUCTS.map((p, i) => (
              <ProductSlide key={p.slug} product={p} index={i} active={active} dims={dims} onSelect={go} />
            ))}
          </motion.div>
        </div>

        {/* Tabs (desktop) / progress segments (mobile) */}
        <div className="mt-8 hidden border-b border-gray-200 md:flex dark:border-white/[0.08]">
          {ACTIVE_PRODUCTS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => go(i)}
              className={
                "relative mr-8 pb-3 text-sm font-semibold transition-colors " +
                (i === active
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300")
              }
            >
              {p.shortName}
              {i === active && (
                <motion.span
                  layoutId="product-tab-indicator"
                  className="absolute inset-x-0 -bottom-px h-[2px] overflow-hidden rounded-full bg-gray-300 dark:bg-white/20"
                  transition={SPRING}
                >
                  <TimerFill progress={progress} full={!!reducedMotion} />
                </motion.span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-6 flex gap-1.5 md:hidden">
          {ACTIVE_PRODUCTS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${p.shortName}`}
              className={
                "relative h-1 overflow-hidden rounded-full bg-gray-300 transition-all duration-300 dark:bg-white/20 " +
                (i === active ? "w-8" : "w-4")
              }
            >
              {i === active && <TimerFill progress={progress} full={!!reducedMotion} />}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
