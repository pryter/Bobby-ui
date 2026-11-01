"use client"

import { useRef, useState, useEffect, useLayoutEffect } from "react"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion"
import {
  CodeBracketIcon,
  RocketLaunchIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid"
import { useTheme } from "@/lib/useTheme"
import Navbar from "@/components/Navbar"
import SiteFooter from "@/components/SiteFooter"
import ProductCarousel from "@/components/products/ProductCarousel"
import Research from "@/components/landing/Research"
import { UCELOT_URL } from "@/lib/products"
import PixelGradient, { type Stop } from "@/components/PixelGradient"

// Hero background ramps for the pixelated primary flare (PixelGradient `stops`).
// Low-contrast warm → page-bg so the tiles read as a subtle flare, not hard rings.
// Strong, high-contrast warm → page-bg ramp: a deep gold core that decays
// quickly to white, so the pixel tiles read as a defined gradient (each tile
// clearly different from its neighbour) rather than a faint wash.
const HERO_FLARE_LIGHT: Stop[] = [
  { pos: 0.0,  c: [196, 128, 6] },    // deep gold core — darker start
  { pos: 0.38, c: [228, 165, 22] },   // strong amber
  { pos: 0.56, c: [247, 200, 78] },   // warm yellow
  { pos: 0.74, c: [253, 230, 155] },  // soft
  { pos: 0.88, c: [255, 247, 220] },  // pale
  { pos: 1.0,  c: [255, 255, 255] },  // white page bg
]
const HERO_FLARE_DARK: Stop[] = [
  { pos: 0.0,  c: [250, 210, 90] },   // bright warm core (glows on dark)
  { pos: 0.34, c: [220, 158, 36] },
  { pos: 0.54, c: [140, 92, 22] },
  { pos: 0.74, c: [60, 40, 14] },
  { pos: 0.9,  c: [20, 16, 10] },
  { pos: 1.0,  c: [13, 13, 15] },        // dark page bg
]

// ─── Tile config ──────────────────────────────────────────────────────────────

const BobbyIcon = ({className}: {className: string}) => {
  return <div className={"relative p-2" + className}>
    <svg className="size-full" viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
      <path id="Path" fill="currentColor" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
    </svg>
  </div>
}
const TILE_CONFIGS = [
  { id: 0, color: "#1db954", Icon: CodeBracketIcon,  shape: "roundedSq" },
  { id: 1, color: "#f5a623", Icon: BobbyIcon,    shape: "roundedSq" },
  { id: 2, color: "#2563eb", Icon: RocketLaunchIcon, shape: "circle"    },
  { id: 3, color: "#f04e30", Icon: BoltIcon,         shape: "pentagon"  },
  { id: 4, color: "#7c3aed", Icon: ShieldCheckIcon,  shape: "circle"    },
]

const SHAPE_STYLE: Record<string, React.CSSProperties> = {
  roundedSq: { borderRadius: "clamp(16px, 14%, 28px)" },
  circle:    { borderRadius: "50%" },
  pentagon:  { clipPath: "polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)", borderRadius: "clamp(12px, 10%, 20px) 0 0 clamp(12px, 10%, 20px)" },
}


type TileConfig = typeof TILE_CONFIGS[number]

// ─── Single tile ──────────────────────────────────────────────────────────────
// Rise and pop are driven by scrollYProgress; swap is a periodic animation.

function TileItem({
  tile,
  isShrinking,
  scrollYProgress,
  displayIndex,
  riseAmount,   // px, computed by parent based on viewport
}: {
  tile: TileConfig
  isShrinking: boolean
  scrollYProgress: MotionValue<number>
  displayIndex: number
  riseAmount: number
}) {
  // Phase 2 — staggered rise, all done by ~0.58
  const riseStart = 0.26 + displayIndex * 0.04
  const riseEnd   = riseStart + 0.08
  const tileY = useTransform(scrollYProgress, [riseStart, riseEnd], [0, -riseAmount])

  // Phase 3 — staggered pop, all done by ~0.84 → leaves 16% blank hold
  const popStart   = 0.70 + displayIndex * 0.025
  const popEnd     = popStart + 0.06
  const popScale   = useTransform(scrollYProgress, [popStart, popEnd], [1, 0])
  const popOpacity = useTransform(scrollYProgress, [popStart, popEnd + 0.01], [1, 0])

  return (
    <motion.div
      style={{ y: tileY, scale: popScale, opacity: popOpacity }}
      className="flex-shrink-0"
    >
      <motion.div
        animate={{ scale: isShrinking ? 0 : 1 }}
        initial={{ scale: 1 }}
        transition={isShrinking
          ? { scale: { duration: 0.25, ease: [0.4, 0, 1, 1] } }
          : { scale: { type: "spring", stiffness: 300, damping: 20 } }
        }
        className="relative w-[80px] h-[80px] sm:w-[104px] sm:h-[104px] md:w-[138px] md:h-[138px] lg:w-[180px] lg:h-[180px]"
      >
        {/* Shape + shadow */}
        {tile.shape === "pentagon" ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: tile.color, ...SHAPE_STYLE[tile.shape] }}
          >
            <tile.Icon className="w-10 h-10 sm:w-[48px] sm:h-[48px] md:w-[62px] md:h-[62px] lg:w-[80px] lg:h-[80px] text-white dark:text-black/80" />
          </div>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: tile.color,
                borderRadius: SHAPE_STYLE[tile.shape].borderRadius,
                boxShadow: `0 8px 24px 2px ${tile.color}55`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <tile.Icon className="w-10 h-10 sm:w-[48px] sm:h-[48px] md:w-[62px] md:h-[62px] lg:w-[80px] lg:h-[80px] text-white dark:text-black/80" />
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Tile row ─────────────────────────────────────────────────────────────────

function TileRow({
  scrollYProgress,
  riseAmount,
  count,
}: {
  scrollYProgress: MotionValue<number>
  riseAmount: number
  count: number
}) {
  const [order, setOrder] = useState([0, 1, 2, 3, 4])
  const [shrinking, setShrinking] = useState<Set<number>>(new Set())
  const orderRef  = useRef([0, 1, 2, 3, 4])
  const pausedRef = useRef(false)
  const countRef  = useRef(count)
  useEffect(() => { countRef.current = count }, [count])

  // Stop swaps as soon as text begins moving (Phase 1a begins at 0.04)
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      pausedRef.current = v > 0.04
    })
    return unsub
  }, [scrollYProgress])

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return
      const n = countRef.current
      const pos1 = Math.floor(Math.random() * n)
      let pos2 = Math.floor(Math.random() * (n - 1))
      if (pos2 >= pos1) pos2++
      const id1 = orderRef.current[pos1]
      const id2 = orderRef.current[pos2]
      setShrinking(new Set([id1, id2]))
      setTimeout(() => {
        const next = [...orderRef.current]
        ;[next[pos1], next[pos2]] = [next[pos2], next[pos1]]
        orderRef.current = next
        setOrder([...next])
        setShrinking(new Set())
      }, 300)
    }
    const id = setInterval(tick, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-end justify-start sm:justify-center gap-3 sm:gap-3 md:gap-4">
      {order.slice(0, count).map((tileId, displayIndex) => (
        <TileItem
          key={tileId}
          tile={TILE_CONFIGS[tileId]}
          isShrinking={shrinking.has(tileId)}
          scrollYProgress={scrollYProgress}
          displayIndex={displayIndex}
          riseAmount={riseAmount}
        />
      ))}
    </div>
  )
}


// ─── Hero scroll ring ─────────────────────────────────────────────────────────

function HeroScrollRing({ progress, dark }: { progress: MotionValue<number>; dark: boolean }) {
  const size  = 34
  const stroke = 3
  const r     = (size - stroke) / 2
  const circ  = 2 * Math.PI * r

  const dashOffset = useTransform(progress, [0.05, 0.90,1], [circ, 0,0])
  const opacity    = useTransform(progress, [0, 0.02, 0.80, 1], [0, 1, 1, 0])

  return (
    <motion.div
      style={{ opacity }}
      className="fixed top-[68px] mt-6 right-4 z-50 pointer-events-none"
    >
      <svg
        width={size} height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset, stroke: "rgb(var(--primary-400))" }}
        />
      </svg>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { dark, toggle: toggleTheme } = useTheme()
  const heroRef                   = useRef<HTMLDivElement>(null)
  const tilesWrapRef              = useRef<HTMLDivElement>(null)
  const ctaRef                    = useRef<HTMLDivElement>(null)
  const [riseAmount, setRiseAmount] = useState(140)
  const [tileCount, setTileCount]   = useState(5)   // 4 on mobile, 5 on sm+

  // Set correct tile count before first paint — prevents flash of wrong count
  useLayoutEffect(() => {
    setTileCount(window.innerWidth < 640 ? 4 : 5)
  }, [])

  useEffect(() => {
    const measure = () => {
      setTileCount(window.innerWidth < 640 ? 4 : 5)
      if (!tilesWrapRef.current) return
      const rect = tilesWrapRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      setRiseAmount(Math.max(30, rect.top + rect.height / 2 - vh / 2))
    }
    // Delay riseAmount measurement until after entrance animations settle
    const t = setTimeout(measure, 1200)
    window.addEventListener("resize", measure)
    return () => { clearTimeout(t); window.removeEventListener("resize", measure) }
  }, [])

  // Always start from the top on mount — prevents browser scroll restoration
  // from dropping the user mid-animation on refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      history.scrollRestoration = "manual"
      window.scrollTo(0, 0)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  })

  // Smooth spring follows scroll with inertia — lower stiffness = more lag
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 24, restDelta: 0.001 })

  // Hero flare starts dissolving once the tiles reach centre (tile rise finishes
  // ~0.42–0.50), rippling away outer→inner ring-by-ring to the page background
  // and completing just as the hero ends.
  const heroFlareWipe = useTransform(smoothProgress, [0.42, 1.0], [0, 1])

  // ── CTA section scroll timeline ────────────────────────────────────────────
  const { scrollYProgress: ctaSYP } = useScroll({
    target: ctaRef,
    offset: ["start end", "start 20%"],
  })
  const ctaProgress = useSpring(ctaSYP, { stiffness: 45, damping: 10, restDelta: 0.001 })

  const ctaOpacity = useTransform(ctaProgress, [0, 0.5], [0, 1])
  const ctaY       = useTransform(ctaProgress, [0, 0.5], [100, 0])

  // ── Phase 1a: title fades first ────────────────────────────────────────────
  const titleOpacity = useTransform(smoothProgress, [0.04, 0.15], [1, 0])
  const titleY       = useTransform(smoothProgress, [0.04, 0.15], [0, -65])
  const titleScale   = useTransform(smoothProgress, [0.04, 0.15], [1, 0.88])

  // ── Phase 1b: subtext fades after title ────────────────────────────────────
  const subtextOpacity = useTransform(smoothProgress, [0.12, 0.21], [1, 0])
  const subtextY       = useTransform(smoothProgress, [0.12, 0.21], [0, -50])
  const subtextScale   = useTransform(smoothProgress, [0.12, 0.21], [1, 0.92])

  // ── Background parallax ────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-[#0d0d0f] text-gray-900 dark:text-white transition-colors">
      <Navbar dark={dark} onToggle={toggleTheme} />
      <HeroScrollRing progress={smoothProgress} dark={dark} />

      {/*
        ── Hero ──────────────────────────────────────────────────────────────
        Height = 100vh + 1800px  →  sticky scroll range is always 1800px,
        consistent across viewport sizes. offset "end end" maps progress
        0→1 exactly over that 1800px sticky window.

          0.10 – 0.32  │ Phase 1: text fades up + scales down     (~396px)
          0.28 – 0.62  │ Phase 2: tiles rise to center, L→R       (~612px)
          0.62 – 0.88  │ Phase 3: tiles pop out,        L→R       (~468px)
        ─────────────────────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ height: tileCount === 4 ? "calc(100vh + 2500px)" : "calc(100vh + 2500px)" }}>
        <div className="sticky top-0 h-screen overflow-hidden">

          {/* Background — pixelated primary flare from the top. As the hero
              scrolls away the bloom dissolves outer→inner into the page bg (a
              pixel ripple), driven by smoothProgress via wipeProgress. */}
          <PixelGradient
            stops={dark ? HERO_FLARE_DARK : HERO_FLARE_LIGHT}
            metric="circle"
            tiltDeg={0}
            anchorX={0.5}
            anchorY={-0.6}
            tilePx={32}
            tileAspect={1.2}
            bloomStart={0}
            bloomEnd={0.68}
            wipeProgress={heroFlareWipe}
            wipeSteps={24}
          />

          {/* ── Hero content: text upper, tiles lower ─────────────────── */}
          <div className="relative h-full flex flex-col justify-center items-start sm:items-center px-5 md:px-12 pt-[72px] sm:pt-[128px]"
               style={{ paddingBottom: "max(28px, 6vh)" }}>

            {/* Phase 1 – Text (title and subtext animate independently) */}
            <div className="flex flex-col items-start sm:items-center text-left sm:text-center w-full max-w-3xl pointer-events-none select-none">

              {/* Title exits first */}
              <motion.div style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}>
                <motion.h1
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 0.1, 0.35, 1], delay: 0.1 }}
                  className="text-[clamp(2.5rem,11vw,3.2rem)] sm:text-[clamp(3.2rem,7.5vw,6rem)] font-black tracking-tight leading-[1.03]
                             text-gray-900 dark:text-white"
                >
                  Research in<br />intelligence.
                </motion.h1>
              </motion.div>

              {/* Subtext exits after title */}
              <motion.div
                style={{ opacity: subtextOpacity, y: subtextY, scale: subtextScale }}
                className="mt-8 sm:mt-14"
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 0.1, 0.35, 1], delay: 0.30 }}
                  className="text-sm md:text-base text-gray-400 dark:text-gray-200
                             max-w-sm leading-relaxed"
                >
                  We&apos;re exploring how machines understand and reason over knowledge.
                </motion.p>
              </motion.div>

            </div>

            {/* Phase 2 & 3 – Tiles */}
            <motion.div
              ref={tilesWrapRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="mt-24 sm:mt-28"
            >
              <TileRow scrollYProgress={smoothProgress} riseAmount={riseAmount} count={tileCount} />
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Research ────────────────────────────────────────────────────────── */}
      <Research />

      {/* ── Products ────────────────────────────────────────────────────────── */}
      <ProductCarousel />

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="px-5 pb-32">
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="relative max-w-2xl mx-auto text-center rounded-3xl px-8 py-20 overflow-hidden
                     border border-gray-200/80 dark:border-white/[0.07]
                     bg-gray-50/60 dark:bg-white/[0.02]"
        >
          <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100"
               style={{ background: "radial-gradient(ellipse at 50% 0%,rgb(var(--primary-400) / 0.07) 0%,transparent 60%)" }} />
          <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Try it on your own code.
          </h2>
          <p className="relative text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
            Ucelot is where most of our research ends up. It reads your repositories and documents,
            connects what belongs together, and shows where every answer came from.
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <a
              href={UCELOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-full text-sm font-bold text-black
                         transition-all hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: "rgb(var(--primary-400))" }}
            >
              Try Ucelot ↗
            </a>
            <a
              href="/docs"
              className="px-6 py-3 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200
                         border border-gray-300 dark:border-white/[0.12]
                         transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.05]"
            >
              Read the docs
            </a>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  )
}
