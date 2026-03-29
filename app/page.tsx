"use client"

import { useRef, useState, useEffect, useLayoutEffect } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion"
import { useRouter } from "next/navigation"
import {
  CodeBracketIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  BoltIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
  CommandLineIcon,
  SignalIcon,
  LinkIcon,
} from "@heroicons/react/24/solid"
import Image from "next/image";

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

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Features", "Docs", "Pricing", "FAQ"]

function Navbar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const router    = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const pillRef   = useRef<HTMLDivElement>(null)
  const [pillW, setPillW]   = useState(0)
  const [pillH, setPillH]   = useState(36)
  const [winH,  setWinH]    = useState(844)

  useEffect(() => {
    const measure = () => {
      // offsetWidth is 0 when display:none (sm:hidden on desktop) — skip to avoid overwriting with 0
      if (pillRef.current && pillRef.current.offsetWidth > 0) {
        setPillW(pillRef.current.offsetWidth)
        setPillH(pillRef.current.offsetHeight)
      }
      setWinH(window.innerHeight)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const spring = { type: "spring", stiffness: 320, damping: 32 } as const

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 sm:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP pill (unchanged) ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.1, 0.35, 1] }}
        className="fixed top-5 inset-x-0 z-50 hidden sm:flex sm:justify-center px-4"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full
                        bg-[#111]/90 backdrop-blur-xl
                        border border-white/[0.08] shadow-xl shadow-black/30">
          <div className="flex items-center gap-0.5 px-2 mr-1">
            <div className="w-6 h-6 flex items-center justify-center -mt-0.5">
              <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                <path id="Path" fill="white" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-semibold">Bobby</span>
          </div>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <button key={l} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors">{l}</button>
            ))}
          </div>
          <button onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs ml-1"
                  aria-label="Toggle theme">
            {dark ? "○" : "●"}
          </button>
          <button onClick={() => router.push("/account")}
                  className="ml-1 px-4 py-1.5 rounded-full text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                  style={{ background: "#a3e635" }}>
            Get started
          </button>
        </div>
      </motion.div>

      {/* ── MOBILE morphing element ────────────────────────────────────────────
          Single persistent div. Animates its own dimensions between pill and
          sidebar states — no mount/unmount, so no scale glitch.              */}
      <motion.div
        ref={pillRef}
        initial={{ opacity: 0, y: -14, borderRadius: 9999 }}
        animate={{
          opacity: 1,
          y:            0,
          width:        menuOpen ? 288        : (pillW || undefined),
          height:       menuOpen ? winH - 32  : pillH,
          borderRadius: menuOpen ? 24         : 100,
          top:          menuOpen ? 16         : 20,
        }}
        transition={{
          opacity:      { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          y:            { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          width:        spring,
          height:       spring,
          borderRadius: spring,
          top:          spring,
        }}
        className="fixed left-4 z-50 sm:hidden overflow-hidden
                   bg-[#111]/90 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/40"
      >
        {/* ── Pill content layer (normal flow — sizes the container) */}
        <motion.div
          animate={{ opacity: menuOpen ? 0 : 1 }}
          transition={{ duration: menuOpen ? 0.08 : 0.18, delay: menuOpen ? 0 : 0.22 }}
          className="flex items-center gap-1 pl-2 pr-1 py-1.5"
          style={{ pointerEvents: menuOpen ? "none" : "auto" }}
        >
          <div className="flex items-center gap-0.5 px-2 mr-1">
            <div className="w-6 h-6 flex items-center justify-center ">
              <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                <path id="Path" fill="white" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-semibold mt-0.5">Bobby</span>
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs"
            aria-label="Toggle theme"
          >
            {dark ? "○" : "●"}
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="w-12 h-8 flex items-center justify-center rounded-full text-white bg-white/[0.12] hover:bg-white/20 transition-colors ml-0.5 mr-1"
            aria-label="Open menu"
          >
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
              <rect y="0"   width="15" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="4.75" width="10" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="9.5"  width="15" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
        </motion.div>

        {/* ── Sidebar content layer (fades in on open) */}
        <motion.div
          animate={{ opacity: menuOpen ? 1 : 0 }}
          transition={{ duration: 0.18, delay: menuOpen ? 0.24 : 0 }}
          className="absolute inset-0 flex flex-col"
          style={{ pointerEvents: menuOpen ? "auto" : "none" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-0.5">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                  <path id="Path" fill="white" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
                </svg>
              </div>
              <span className="text-white text-sm mt-0.5 font-semibold">Bobby</span>
            </div>
            <button onClick={() => setMenuOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-sm"
                    aria-label="Close menu">✕</button>
          </div>

          {/* Nav links */}
          <div className="flex flex-col px-3 py-4 gap-0.5 flex-1">
            {NAV_LINKS.map((l, i) => (
              <motion.button
                key={l}
                initial={false}
                animate={{ opacity: menuOpen ? 1 : 0, x: menuOpen ? 0 : -8 }}
                transition={{ delay: menuOpen ? i * 0.05 + 0.3 : 0, duration: 0.2, ease: [0.22, 0.1, 0.35, 1] }}
                className="px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors text-left font-medium"
              >{l}</motion.button>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={false}
            animate={{ opacity: menuOpen ? 1 : 0 }}
            transition={{ delay: menuOpen ? 0.36 : 0, duration: 0.18 }}
            className="px-4 pb-8 flex flex-col gap-2"
          >
            <button onClick={onToggle}
                    className="px-4 py-3 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors text-left flex items-center gap-2.5">
              <span className="text-base leading-none">{dark ? "○" : "●"}</span>
              <span>{dark ? "Light mode" : "Dark mode"}</span>
            </button>
            <button onClick={() => { router.push("/account"); setMenuOpen(false) }}
                    className="w-full py-2.5 rounded-full text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
                    style={{ background: "#a3e635" }}>
              Get started
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── MOBILE CTA — top right, hides when sidebar opens */}
      <motion.button
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: menuOpen ? 0 : 1, y: 0 }}
        transition={{
          opacity: { duration: 0.12 },
          y:       { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
        }}
        onClick={() => router.push("/account")}
        className="fixed top-5 right-4 z-50 sm:hidden px-4 py-3.5 shadow-md rounded-full text-xs font-bold text-black whitespace-nowrap"
        style={{ background: "#a3e635", pointerEvents: menuOpen ? "none" : "auto" }}
      >
        Get started
      </motion.button>
    </>
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
          stroke="#a3e635"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
    </motion.div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

type FeatureIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>

const FEATURES: { icon: FeatureIcon; title: string; desc: string }[] = [
  { icon: AdjustmentsHorizontalIcon, title: "Zero Config",       desc: "Bobby reads your codebase and sets up the entire pipeline. Not a single YAML file." },
  { icon: CommandLineIcon,           title: "Zero Code",         desc: "No Dockerfiles. No CI scripts. Push to git and your app ships itself." },
  { icon: RocketLaunchIcon,          title: "Instant Deploy",    desc: "From commit to live in seconds. Built for speed at every step." },
  { icon: ShieldCheckIcon,           title: "Secure by Default", desc: "Isolated build envs, encrypted secrets, signed artifacts — always on." },
  { icon: SignalIcon,                title: "Live Streaming",    desc: "Watch every build happen in real time. No polling, no mystery." },
  { icon: LinkIcon,                  title: "Git Native",        desc: "Connect any GitHub, GitLab, or Bitbucket repo in one click." },
]

function FeatureCard({ icon: Icon, title, desc, index, scrollProgress }: { icon: FeatureIcon; title: string; desc: string; index: number; scrollProgress: MotionValue<number> }) {
  const start   = 0.12 + index * 0.05
  const end     = start + 0.15
  const opacity = useTransform(scrollProgress, [start, end], [0, 1])
  const y       = useTransform(scrollProgress, [start, end], [100, 0])

  return (
    <motion.div
      style={{ opacity, y }}
      className="rounded-2xl p-6 border border-gray-200/80 dark:border-white/[0.07]
                 bg-white/60 dark:bg-white/[0.02]
                 hover:border-indigo-200 dark:hover:border-indigo-500/25
                 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/[0.04]
                 transition-all duration-300"
    >
      <Icon className="w-6 h-6 mb-3 text-indigo-500 dark:text-indigo-400" />
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [dark, setDark]           = useState(true)
  const heroRef                   = useRef<HTMLDivElement>(null)
  const tilesWrapRef              = useRef<HTMLDivElement>(null)
  const featuresRef               = useRef<HTMLDivElement>(null)
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

  // ── Features section scroll timeline ──────────────────────────────────────
  const { scrollYProgress: featuresSYP } = useScroll({
    target: featuresRef,
    offset: ["start end", "start 10%"],
  })
  // Low stiffness = heavy lag behind fast scroll (momentum absorption feel)
  // Underdamped (ζ ≈ 0.75) = slight overshoot on settle = springy
  const featuresProgress = useSpring(featuresSYP, { stiffness: 45, damping: 10, restDelta: 0.001 })

  const featuresHeadingOpacity = useTransform(featuresProgress, [0, 0.3], [0, 1])
  const featuresHeadingY       = useTransform(featuresProgress, [0, 0.3], [100, 0])

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
  const bgScale = useTransform(smoothProgress, [0, 1], [1, 1.2])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setDark(mq.matches)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', dark ? '#080808' : '#ffffff')
  }, [dark])

  return (
    <div className="bg-white dark:bg-[#080808] text-gray-900 dark:text-white transition-colors">
      <Navbar dark={dark} onToggle={() => setDark((d) => !d)} />
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

          {/* Background */}
          <motion.div style={{ scale: bgScale }} className="absolute inset-0 pointer-events-none">
            <div className="dark:hidden absolute inset-0"
                 style={{ backgroundImage: "radial-gradient(circle,rgba(0,0,0,0.055) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="hidden dark:block absolute inset-0"
                 style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
            <div className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]"
                 style={{ background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,rgba(124,77,255,0.05) 45%,transparent 70%)", filter: "blur(80px)" }} />
            <div className="hidden dark:block absolute top-[16%] left-[16%] w-96 h-96 animate-orb-1 opacity-20"
                 style={{ background: "radial-gradient(circle,rgba(59,106,237,0.7) 0%,transparent 70%)", filter: "blur(70px)" }} />
            <div className="hidden dark:block absolute bottom-[12%] right-[12%] w-80 h-80 animate-orb-2 opacity-15"
                 style={{ background: "radial-gradient(circle,rgba(240,90,42,0.6) 0%,transparent 70%)", filter: "blur(70px)" }} />
          </motion.div>

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
                  className="text-[clamp(3.2rem,7.5vw,6rem)] font-black tracking-tight leading-[1.03]
                             text-gray-900 dark:text-white"
                >
                  <span className="sm:hidden">Automate<br />every<br />deployment</span>
                  <span className="hidden sm:inline">Automate every<br />deployment</span>
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
                  Zero config. Zero code.<br />
                  Bobby ships your projects the moment you push.
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

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="px-5 md:px-12 pb-32 pt-8">
        <motion.div
          style={{ opacity: featuresHeadingOpacity, y: featuresHeadingY }}
          className="text-center mb-14"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400 mb-3">
            Why Bobby
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything handled.{" "}
            <span className="text-gray-400 dark:text-gray-500">Nothing needed.</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} scrollProgress={featuresProgress} />)}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section ref={ctaRef} className="px-5 pb-32">
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="relative max-w-2xl mx-auto text-center rounded-3xl px-8 py-20 overflow-hidden
                     border border-gray-200/80 dark:border-white/[0.07]
                     bg-gray-50/60 dark:bg-white/[0.02]"
        >
          <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100"
               style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(163,230,53,0.07) 0%,transparent 60%)" }} />
          <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to ship faster?
          </h2>
          <p className="relative text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
            Join developers shipping with confidence. No setup, no config — just results.
          </p>
          <button
            onClick={() => { window.location.href = "/account" }}
            className="relative px-8 py-3 rounded-full text-sm font-bold text-black
                       transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: "#a3e635" }}
          >
            Get started for free
          </button>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="px-5 md:px-12 py-8 border-t border-gray-200/50 dark:border-white/[0.05]">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-0.5 px-2 mr-1">
            <div className="w-6 h-6 flex items-center justify-center -mt-0.5">
              <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                <path id="Path" fill="currentColor" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold">Bobby</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">© 2025 Bobby. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
