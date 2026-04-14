"use client"

import { useRef, useState, useEffect, useLayoutEffect, createContext, useContext } from "react"
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useMotionTemplate,
  useMotionValue,
  animate,
  MotionValue,
} from "framer-motion"
import { useRouter } from "next/navigation"
import {
  CodeBracketIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid"
import Image from "next/image";
import dynamic from "next/dynamic"
import { useTheme } from "@/lib/useTheme"

// Mockups used inside DeepDive sections — lazy loaded so their deps don't
// bloat the initial landing bundle.
const ImageSearchMockup = dynamic(
  () => import("@/components/landing/ImageSearchMockup"),
  { ssr: false },
)
const IntegrationsOrb = dynamic(
  () => import("@/components/landing/IntegrationsOrb"),
  { ssr: false },
)

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

// Shared state between DeepDiveSection (producer) and Navbar (consumer). When
// the mobile timeline has fully morphed into its pill AND the deep-dive
// section is still on-screen, we ask the mobile nav to collapse to just
// [logo | menu button] and hide the floating "Get started" CTA — this gives
// the centered pill timeline room to breathe and turns the nav row into a
// three-part composition: logo · pill · menu.
const DeepDiveNavContext = createContext<{
  compact: boolean
  setCompact: (v: boolean) => void
}>({
  compact: false,
  setCompact: () => {},
})

function Navbar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const router    = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [winH,  setWinH]    = useState(844)

  // When the deep-dive section's timeline pill is in its formed + pinned
  // state, we compact the mobile nav to [logo | menu] only so the centered
  // timeline pill has room to breathe.
  const { compact } = useContext(DeepDiveNavContext)

  useEffect(() => {
    const measure = () => setWinH(window.innerHeight)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

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
        className="fixed top-5 inset-x-0 z-[60] hidden sm:flex sm:justify-center px-4"
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
          sidebar states — no mount/unmount, so no scale glitch.
          Width/height use Framer's "auto" so the pill always hugs its current
          content. When `compact` drops the wordmark + theme toggle, the auto
          width re-measures to the smaller natural size and springs in.     */}
      <motion.div
        initial={{ opacity: 0, y: -14, borderRadius: 9999 }}
        animate={{
          opacity: 1,
          y:            0,
          width:        menuOpen ? 288        : "auto",
          height:       menuOpen ? winH - 32  : "auto",
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
        className="fixed left-4 z-[60] sm:hidden overflow-hidden
                   bg-[#111]/90 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/40"
      >
        {/* ── Pill content layer (normal flow — sizes the container).
            In `compact` mode (deep-dive timeline pill is live) we drop the
            "Bobby" wordmark + theme toggle, leaving [logo | menu] only, and
            tighten the surrounding padding / logo margin so the pill really
            contracts rather than leaving an empty interior.
            The AnimatePresence wrappers let the absent elements collapse
            smoothly rather than pop. */}
        <motion.div
          animate={{ opacity: menuOpen ? 0 : 1 }}
          transition={{ duration: menuOpen ? 0.08 : 0.18, delay: menuOpen ? 0 : 0.22 }}
          className={
            "flex items-center gap-1 py-1.5 " +
            (compact ? "pl-1.5 pr-1" : "pl-2 pr-1")
          }
          style={{ pointerEvents: menuOpen ? "none" : "auto" }}
        >
          <div
            className={
              "flex items-center gap-0.5 " +
              (compact ? "px-1 mr-0" : "px-2 mr-1")
            }
          >
            <div className="w-6 h-6 flex items-center justify-center ">
              <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                <path id="Path" fill="white" stroke="none" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"/>
              </svg>
            </div>
            <AnimatePresence initial={false}>
              {!compact && (
                <motion.span
                  key="wordmark"
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: "auto", marginLeft: 0 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="text-white text-sm font-semibold mt-0.5 overflow-hidden whitespace-nowrap"
                >
                  Bobby
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <AnimatePresence initial={false}>
            {!compact && (
              <motion.button
                key="theme"
                onClick={onToggle}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 32 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs overflow-hidden"
                aria-label="Toggle theme"
              >
                {dark ? "○" : "●"}
              </motion.button>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMenuOpen(true)}
            className={
              "h-8 flex items-center justify-center rounded-full text-white bg-white/[0.12] hover:bg-white/20 transition-colors " +
              (compact ? "w-8 ml-0 mr-0" : "w-12 ml-0.5 mr-1")
            }
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

      {/* ── MOBILE CTA — top right, hides when sidebar opens.
          In `compact` mode (deep-dive timeline pill live) the button
          shrinks to a circular icon so the pill timeline + shrunken left
          nav breathe on the same row.

          Layout strategy — both children are ALWAYS mounted (no
          AnimatePresence). That way Framer's `width: "auto"` always
          resolves to the same natural width (the text span's intrinsic
          size), no matter which state we're transitioning to. Previously
          the text was conditionally mounted, so in the compact→expanded
          direction the measurement raced with the mount — the button
          would briefly settle at a too-small width before the text showed
          up, producing the "shrinks then pops" glitch.

          - Height fixed at h-11 (44) in both states.
          - Width: `44` when compact, `"auto"` otherwise.
          - Text sits in-flow, right-anchored (`justify-end`), so when the
            button is at 44 the text overflows leftward under overflow-hidden.
            As the button expands the text slides into view from the right.
          - Icon is absolutely placed over the 44×44 right-edge footprint,
            so it never contributes to intrinsic width and never drifts
            during the width spring.
          - Both children cross-fade via opacity/scale tied directly to
            `compact` — no mount/unmount race. */}
      <motion.button
        initial={{ opacity: 0, y: -14 }}
        animate={{
          opacity: menuOpen ? 0 : 1,
          y:       0,
          width:   compact ? 44 : "auto",
        }}
        transition={{
          opacity: { duration: 0.12 },
          y:       { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          width:   spring,
        }}
        onClick={() => router.push("/account")}
        className="fixed top-5 right-4 z-[60] sm:hidden h-11 shadow-md rounded-full font-bold text-black flex items-center justify-end overflow-hidden"
        style={{ background: "#a3e635", pointerEvents: menuOpen ? "none" : "auto" }}
        aria-label="Get started"
      >
        {/* Text — always mounted, drives intrinsic (auto) width. */}
        <motion.span
          animate={{ opacity: compact ? 0 : 1 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 text-xs whitespace-nowrap"
          aria-hidden={compact}
        >
          Get started
        </motion.span>
        {/* Icon — always mounted, absolute overlay on the right-edge 44×44
            footprint. pointer-events-none so clicks pass through to the
            button itself. */}
        <motion.span
          animate={{
            opacity: compact ? 1 : 0,
            scale:   compact ? 1 : 0.6,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute right-0 top-0 h-11 w-11 flex items-center justify-center"
          aria-hidden={!compact}
        >
          <RocketLaunchIcon className="w-5 h-5" />
        </motion.span>
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

type ShowcaseVisual = React.ComponentType

const SHOWCASE: { title: string; highlight?: string; desc: string; Visual: ShowcaseVisual }[] = [
  {
    title: "Zero Config",
    highlight: "Setup",
    desc: "Bobby reads your codebase and wires the pipeline. Not a single YAML file.",
    Visual: StackGridVisual,
  },
  {
    title: "No-Code",
    highlight: "Pipelines",
    desc: "Compose build, test and deploy stages visually. No Dockerfiles, no CI scripts.",
    Visual: PipelineVisual,
  },
  {
    title: "Self-Hosted",
    highlight: "Infra",
    desc: "Enterprise-grade infrastructure that runs on your own machine. Your data never leaves.",
    Visual: ServerVisual,
  },
  {
    title: "Rich",
    highlight: "Integrations",
    desc: "GitHub, GitLab, Bitbucket, registries and more — connect everything in one click.",
    Visual: OrbitVisual,
  },
]

function ShowcaseCard({
  title, highlight, desc, Visual, index, scrollProgress, featured,
}: {
  title: string
  highlight?: string
  desc: string
  Visual: ShowcaseVisual
  index: number
  scrollProgress: MotionValue<number>
  featured?: boolean
}) {
  const start   = 0.12 + index * 0.07
  const end     = start + 0.18
  const opacity = useTransform(scrollProgress, [start, end], [0, 1])
  const y       = useTransform(scrollProgress, [start, end], [80, 0])

  return (
    <motion.div style={{ opacity, y }} className="relative h-full">
      {/* Moving flares + bright border cores — travel along the card edge, 180° apart */}
      {featured && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            {/* Start at top-center (12.5%) and bottom-center (62.5%) so they
                phase-align with the conic bright arcs at angles 0° and 180°. */}
            {[
              { from: "12.5%", to: "112.5%" },
              { from: "62.5%", to: "162.5%" },
            ].map((phase, i) => (
              <motion.div
                key={i}
                aria-hidden
                animate={{ offsetDistance: [phase.from, phase.to] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 rounded-full"
                style={{
                  top: 0,
                  left: 0,
                  background:
                    "radial-gradient(circle, rgba(163,230,53,0.25) 0%, rgba(163,230,53,0.11) 25%, rgba(163,230,53,0.04) 50%, rgba(163,230,53,0) 70%)",
                  filter: "blur(20px)",
                  offsetPath: "rect(0 100% 100% 0 round 1.5rem)",
                  offsetAnchor: "center",
                  offsetRotate: "0deg",
                } as React.CSSProperties}
              />
            ))}
          </div>
          {/* Rotating gradient masked to the border ring — bright arcs chase around */}
          <motion.div
            aria-hidden
            animate={{ "--angle": ["0deg", "360deg"] } as { [key: string]: string[] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-3xl pointer-events-none z-10"
            style={{
              padding: "1.5px",
              background:
                "conic-gradient(from var(--angle) at 50% 50%, transparent 0deg, transparent 150deg, rgba(163,230,53,0.95) 175deg, rgba(163,230,53,1) 180deg, rgba(163,230,53,0.95) 185deg, transparent 210deg, transparent 330deg, rgba(163,230,53,0.95) 355deg, rgba(163,230,53,1) 360deg, rgba(163,230,53,0.95) 5deg, transparent 30deg)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              "--angle": "0deg",
            } as React.CSSProperties}
          />
        </>
      )}
      <div
        className={
          "relative group rounded-3xl overflow-hidden h-full transition-colors duration-300 " +
          (featured
            ? "border border-[#a3e635]/40 dark:border-[#a3e635]/30 " +
              "bg-white dark:bg-[#080808] " +
              "shadow-[0_0_18px_-6px_rgba(163,230,53,0.22),0_0_40px_-12px_rgba(163,230,53,0.12)] " +
              "hover:border-[#a3e635]/60 dark:hover:border-[#a3e635]/50"
            : "border border-gray-200/80 dark:border-white/[0.07] " +
              "bg-white/70 dark:bg-white/[0.02] " +
              "hover:border-[#a3e635]/40 dark:hover:border-[#a3e635]/25")
        }
      >
        <div className="px-7 pt-7 pb-3">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}{" "}
            {highlight && (
              <span className={featured ? "text-[#7ba320] dark:text-[#a3e635]/80" : "text-gray-400 dark:text-gray-500"}>
                {highlight}
              </span>
            )}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
            {desc}
          </p>
        </div>
        <div className="relative h-48 md:h-56 overflow-hidden">
          <Visual />
        </div>
      </div>
    </motion.div>
  )
}

// ── Visuals ───────────────────────────────────────────────────────────────────

function StackGridVisual() {
  // 5×3 grid. Three center cells show simple, reliable brand glyphs.
  const HIGHLIGHT_CELLS = [6, 7, 8] as const
  const LOGOS: { bg: string; node: React.ReactNode }[] = [
    {
      // Node.js — hexagon with JS letters
      bg: "bg-[#539E43]",
      node: (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full" fill="rgba(255,255,255,0.22)">
            <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
          </svg>
          <span className="relative text-white font-black text-[9px] tracking-tight leading-none">JS</span>
        </div>
      ),
    },
    {
      // Docker — container blocks + hull
      bg: "bg-[#2396ED]",
      node: (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white">
          <rect x="4"  y="11" width="3" height="3" rx="0.3" />
          <rect x="7.5" y="11" width="3" height="3" rx="0.3" />
          <rect x="11" y="11" width="3" height="3" rx="0.3" />
          <rect x="14.5" y="11" width="3" height="3" rx="0.3" />
          <rect x="7.5" y="7.5" width="3" height="3" rx="0.3" />
          <rect x="11" y="7.5" width="3" height="3" rx="0.3" />
          <rect x="11" y="4" width="3" height="3" rx="0.3" />
          <path d="M2 15 Q12 19 22 15 Q21 18.5 17 19.5 Q11 20.8 6 19 Q3 18 2 15 Z" />
        </svg>
      ),
    },
    {
      // Python — two offset rounded rects
      bg: "bg-[#3776AB]",
      node: (
        <svg viewBox="0 0 24 24" className="w-6 h-6">
          <rect x="5"  y="3"  width="11" height="10" rx="2.5" fill="white" />
          <rect x="8"  y="11" width="11" height="10" rx="2.5" fill="#FFD43B" />
          <circle cx="7.8"  cy="6"  r="0.9" fill="#3776AB" />
          <circle cx="16.2" cy="18" r="0.9" fill="#3776AB" />
        </svg>
      ),
    },
  ]

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative grid grid-cols-5 gap-2.5 p-2">
        {Array.from({ length: 15 }).map((_, i) => {
          const idx = HIGHLIGHT_CELLS.indexOf(i as typeof HIGHLIGHT_CELLS[number])
          if (idx === -1) {
            return (
              <div
                key={i}
                className="w-10 h-10 rounded-lg border border-gray-200/70 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.015]"
              />
            )
          }
          const logo = LOGOS[idx]
          return (
            <div
              key={i}
              className={`w-10 h-10 rounded-lg ${logo.bg} flex items-center justify-center shadow-lg shadow-black/10`}
            >
              {logo.node}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrbitVisual() {
  // Center Bobby hub with platform chips orbiting
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(163,230,53,0.10) 0%, transparent 65%)" }} />
      {/* faint connection lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" preserveAspectRatio="none">
        <line x1="80"  y1="80"  x2="200" y2="110" stroke="currentColor" className="text-gray-300 dark:text-white/10" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="320" y1="80"  x2="200" y2="110" stroke="currentColor" className="text-gray-300 dark:text-white/10" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="100" y1="170" x2="200" y2="110" stroke="currentColor" className="text-gray-300 dark:text-white/10" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="300" y1="170" x2="200" y2="110" stroke="currentColor" className="text-gray-300 dark:text-white/10" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
      {/* center hub — lime glow pulse */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.25, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-20 h-20 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(163,230,53,0.55) 0%, transparent 70%)", filter: "blur(8px)" }}
      />
      <div className="relative z-10 w-14 h-14 p-2 rounded-full bg-gradient-to-br from-[#a3e635] to-[#7ba320] shadow-xl shadow-[#a3e635]/40 flex items-center justify-center ring-4 ring-[#a3e635]/20">
        <BobbyIcon className="text-gray-900" />
      </div>
      {/* orbit chips */}
      <div className="absolute top-6 left-10 w-11 h-11 rounded-xl bg-gray-900 dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center shadow-lg shadow-black/10">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.27-5.23-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.17a11 11 0 0 1 5.79 0c2.21-1.48 3.18-1.17 3.18-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.37-5.25 5.66.41.35.78 1.04.78 2.1v3.12c0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>
      </div>
      <div className="absolute top-6 right-10 w-11 h-11 rounded-xl bg-[#fc6d26] flex items-center justify-center shadow-lg shadow-black/10">
        <span className="text-white text-base font-bold">GL</span>
      </div>
      <div className="absolute bottom-6 left-14 w-11 h-11 rounded-xl bg-[#2684ff] flex items-center justify-center shadow-lg shadow-black/10">
        <span className="text-white text-base font-bold">BB</span>
      </div>
      <div className="absolute bottom-6 right-14 w-11 h-11 rounded-xl bg-gray-100 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/10 flex items-center justify-center shadow-lg shadow-black/10">
        <RocketLaunchIcon className="w-5 h-5 text-[#7ba320] dark:text-[#a3e635]" />
      </div>
    </div>
  )
}

function PipelineVisual() {
  // Horizontal no-code pipeline: Source → Build → Test → Deploy
  const stages = [
    { label: "Source", color: "bg-gray-900 dark:bg-white/[0.08]", dot: "bg-gray-400",  text: "text-white" },
    { label: "Build",  color: "bg-[#2563eb]",                     dot: "bg-blue-200",  text: "text-white" },
    { label: "Test",   color: "bg-[#f5a623]",                     dot: "bg-yellow-100",text: "text-white" },
    { label: "Deploy", color: "bg-[#a3e635]",                     dot: "bg-lime-900/40",text: "text-gray-900" },
  ]
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(99,102,241,0.10) 0%, transparent 65%)" }} />
      <div className="relative z-10 flex items-center gap-0 w-full max-w-sm">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <motion.div
              animate={s.label === "Deploy"
                ? { boxShadow: ["0 8px 18px -4px rgba(163,230,53,0.45)", "0 8px 30px -2px rgba(163,230,53,0.85)", "0 8px 18px -4px rgba(163,230,53,0.45)"] }
                : {}}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className={`${s.color} ${s.text} relative rounded-xl px-3 py-2.5 min-w-[74px] shadow-lg shadow-black/10`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                <span className="text-[11px] font-semibold tracking-wide">{s.label}</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-black/15 overflow-hidden">
                <motion.div
                  className="h-full bg-current rounded-full opacity-80"
                  initial={{ width: 0 }}
                  animate={{ width: `${30 + i * 22}%` }}
                  transition={{ duration: 1.2, delay: i * 0.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
            {i < stages.length - 1 && (
              <svg className="flex-1 h-px mx-1 text-gray-300 dark:text-white/15" viewBox="0 0 40 2" preserveAspectRatio="none">
                <line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ServerVisual() {
  // Self-hosted: a server rack sitting on "your machine" with a lock badge
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0"
           style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(163,230,53,0.10) 0%, transparent 65%)" }} />
      <div className="relative">
        {/* Server rack */}
        <div className="relative w-44 rounded-2xl bg-gradient-to-b from-white to-gray-50 dark:from-white/[0.06] dark:to-white/[0.02]
                        border border-gray-200/80 dark:border-white/10 shadow-xl shadow-black/10 p-3 space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-gray-100/80 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.05] px-2 py-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[#a3e635]" : i === 1 ? "bg-indigo-400" : "bg-[#f5a623]"} animate-pulse`} />
              <div className="h-1.5 rounded-full bg-gray-300/70 dark:bg-white/10 flex-1" />
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
              </div>
            </div>
          ))}
          {/* Lock badge — top right */}
          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(163,230,53,0.55)", "0 0 0 10px rgba(163,230,53,0)", "0 0 0 0 rgba(163,230,53,0)"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#a3e635] flex items-center justify-center ring-4 ring-white dark:ring-[#080808]"
          >
            <ShieldCheckIcon className="w-4 h-4 text-gray-900" />
          </motion.div>
        </div>
        {/* "Your machine" base */}
        <div className="mx-auto mt-2 w-52 h-1.5 rounded-full bg-gray-200/80 dark:bg-white/[0.06]" />
        <div className="mx-auto mt-1.5 text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 text-center">
          your machine
        </div>
      </div>
    </div>
  )
}

// ─── Deep-dive timeline ──────────────────────────────────────────────────────

const DEEP_FEATURES: {
  eyebrow: string
  title: string
  desc: string
  bullets: string[]
}[] = [
  {
    eyebrow: "Step 01",
    title: "Zero Config Setup",
    desc:
      "Run one command and Bobby is live. No network config, no port forwarding, no firewall holes, no reverse proxies to stand up. Bobby punches out to the control plane for you, so your laptop or homelab box becomes a first-class build runner the moment the binary lands — even behind NAT or a corporate VPN.",
    bullets: [
      "Single-binary install — no daemon zoo",
      "No port forwarding, NAT traversal, or firewall rules",
      "Works behind VPNs, CGNAT, and restrictive networks",
    ],
  },
  {
    eyebrow: "Step 02",
    title: "No-Code Pipelines",
    desc:
      "Compose build, test, and deploy stages in a drag-and-drop canvas. If you've used n8n or Zapier, you already know how — snap nodes together, wire inputs to outputs, and your pipeline is live. Swap steps, branch on conditions, fan out in parallel. No Dockerfiles, no CI scripts, no brittle shell glue.",
    bullets: [
      "Drag-and-drop n8n-style canvas",
      "Reusable nodes: build, test, scan, deploy",
      "Branching, parallelism, and retries out of the box",
    ],
  },
  {
    eyebrow: "Step 03",
    title: "Self-Hosted Infra",
    desc:
      "Enterprise-grade infrastructure that runs where your code lives. A built-in registry proxy caches OCI images close to the build, fully isolated micro-VMs run every step in a clean room, and every artifact is versioned and signed right on your machine. You get the guarantees of a managed platform with none of the data egress.",
    bullets: [
      "Registry proxy with transparent layer caching",
      "Fully isolated micro-VMs per pipeline run",
      "Content-addressed image versioning and signing",
    ],
  },
  {
    eyebrow: "Step 04",
    title: "Rich Integrations",
    desc:
      "Connect Bobby to everything your workflow already touches. Git webhooks trigger pipelines on push, PR, or tag. Container registries, secret stores, chat, and ticketing systems are one click away. Everything that isn't first-party is one tiny plugin shim — and plugins are just binaries, so you can ship your own in an afternoon.",
    bullets: [
      "Git webhooks for GitHub, GitLab, Bitbucket",
      "First-party registry, secret, and chat integrations",
      "Plugin SDK — ship your own in minutes",
    ],
  },
]

function DeepDiveSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const detailsColRef = useRef<HTMLDivElement>(null)
  const { setCompact } = useContext(DeepDiveNavContext)
  // Mobile-only scroll-pin buffer. A tall (~120vh) wrapper whose only job is
  // to consume scroll distance while the inline timeline morphs into the
  // pill. The MobileTimeline is rendered sticky inside it, so the user sees
  // the morph unfold without any detail content scrolling past.
  const morphBufferRef = useRef<HTMLDivElement>(null)
  const detailRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)

  // Section progress — now tracked over the details column only, so the
  // mobile morph buffer above doesn't skew the per-step math.
  const { scrollYProgress } = useScroll({
    target: detailsColRef,
    offset: ["start start", "end end"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 22, restDelta: 0.001 })

  // Dedicated scroll tracker for the mobile morph. Goes 0 → 1 as the user
  // scrolls through the buffer, giving the inline→pill transition real
  // scroll distance instead of firing instantly behind the detail content.
  const { scrollYProgress: morphRawProgress } = useScroll({
    target: morphBufferRef,
    offset: ["start start", "end start"],
  })
  const morphProgress = useSpring(morphRawProgress, {
    stiffness: 120, damping: 24, restDelta: 0.001,
  })

  // ── Nav-compact signal ──────────────────────────────────────────────────
  // We want the mobile nav to collapse only while the timeline pill is
  // fully formed AND the deep-dive section is still on-screen. That's the
  // intersection of two independent signals:
  //   1. `morphPastShape` — morph progress has crossed ~0.88 (pill is formed)
  //   2. `sectionInView`  — section is still in viewport (so the pill is
  //      actually visible; once we scroll past, the pill exits with the
  //      sticky parent and the nav should come back in full form).
  const [sectionInView, setSectionInView] = useState(false)
  const [morphPastShape, setMorphPastShape] = useState(false)
  // `pastDeepDive` flips true once the reader has scrolled past the end of
  // step 4's content (the last DeepFeatureDetail's scroll spacer). From that
  // point on — even though the section itself still has pb-72 of trailing
  // padding — the mobile timeline pill should fade out and the nav should
  // return to its full (non-compact) form, since there's nothing more in the
  // timeline for the pill to navigate between.
  const [pastDeepDive, setPastDeepDive] = useState(false)
  const endSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sectionRef.current) return
    const io = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const el = endSentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // True once the sentinel is in view (we've scrolled down far enough
        // to see it at the bottom of the viewport, which happens right as
        // step 4's 340vh spacer ends) OR we've scrolled past it (top < 0).
        // Staying true in the "above" case matters so the pill doesn't
        // reappear if the user scrolls all the way to the next section.
        const crossed =
          entry.isIntersecting || entry.boundingClientRect.top < 0
        setPastDeepDive(crossed)
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useMotionValueEvent(morphProgress, "change", (v) => {
    // Threshold sits just under SHAPE (0.65) so the nav compacts in sync with
    // the pill fully forming.
    setMorphPastShape(v >= 0.63)
  })
  useEffect(() => {
    // Nav goes compact only while the pill is live: section must be in view,
    // morph past the shape threshold, AND we haven't yet scrolled past step
    // 4's end (otherwise the pill is fading out and nav should already be
    // recovering).
    setCompact(sectionInView && morphPastShape && !pastDeepDive)
  }, [sectionInView, morphPastShape, pastDeepDive, setCompact])
  // Safety: if DeepDiveSection unmounts mid-state, make sure the nav isn't
  // left stuck in compact mode.
  useEffect(() => {
    return () => setCompact(false)
  }, [setCompact])

  // Track which detail section is currently on stage. Each slice visually
  // hands off to the next at the lift-off point (local ≈ 0.72 → 1.0), which
  // sits around slice-fraction 0.9. Advancing active at v*total + 0.1 keeps
  // the highlighted step in sync with the content actually showing.
  useMotionValueEvent(progress, "change", (v) => {
    const total = DEEP_FEATURES.length
    const raw = v * total
    const i = Math.max(0, Math.min(total - 1, Math.floor(raw)))
    setActive(i)
  })

  const scrollTo = (i: number) => {
    const col = detailsColRef.current
    if (!col) return
    // Land the user at the "fully unfolded" moment of this step — after the
    // entry cascade has completed but before the lift-off/exit kicks in.
    // Local progress ≈ 0.55 sits cleanly in the pause plateau.
    const slice = 1 / DEEP_FEATURES.length
    const targetLocal = 0.55
    // local maps [start - 0.07*slice, end + 0.07*slice] → [0,1], so invert:
    const targetSectionProgress = (i - 0.07) * slice + targetLocal * 1.14 * slice
    const colTop = col.getBoundingClientRect().top + window.scrollY
    const scrollRange = col.offsetHeight - window.innerHeight
    const targetY = colTop + targetSectionProgress * scrollRange
    window.scrollTo({ top: targetY, behavior: "smooth" })
  }

  return (
    <section ref={sectionRef} className="relative px-5 md:px-12 pt-28 md:pt-20 pb-72">
      <div className="max-w-6xl mx-auto">
        {/* Section heading — desktop only. On mobile the heading is
            rendered inside the sticky morph frame below so it stays
            visible, frozen, while the timeline morphs into the pill. */}
        <motion.div
          className="hidden md:block max-w-2xl mb-20"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7ba320] dark:text-[#a3e635] mb-3"
          >
            Deep Dive
          </motion.p>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 32 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
          >
            How Bobby works{" "}
            <span className="text-gray-400 dark:text-gray-500">end to end.</span>
          </motion.h2>
        </motion.div>

        {/* ── Mobile sticky pill wrapper ───────────────────────────────────
            Direct child of `max-w-6xl` so it pins across the whole section
            — through the morph buffer *and* the details column below —
            instead of releasing when the morph finishes.
            The heading is rendered here too and fades/collapses during the
            morph, leaving the pill alone in the pinned row for the rest of
            the section.
            `top` is scroll-animated: starts at 80px (top-20) so the
            full-width list sits safely below the nav during PRE, then
            glides up to 20px (top-5) as the pill forms — landing on the
            nav's Y line by the time the wordmark + theme toggle have
            dropped out of the shrunken left pill, filling the empty
            space between [logo] and [Get started]. */}
        <MobileStickyWrapper
          morphProgress={morphProgress}
          pastDeepDive={pastDeepDive}
        >
          <MobileSectionHeading morphProgress={morphProgress} />
          <MobileTimeline
            features={DEEP_FEATURES}
            active={active}
            morphProgress={morphProgress}
            morphRawProgress={morphRawProgress}
            onJump={scrollTo}
          />
        </MobileStickyWrapper>

        {/* Morph buffer spacer — empty element that consumes the scroll
            distance used to drive `morphProgress`. Sits immediately after
            the sticky so the morph starts ~1 pill-height after the pill
            first pins. Desktop collapses it to zero. */}
        <div ref={morphBufferRef} className="md:hidden h-[140vh] mb-8" />

        <div className="grid md:grid-cols-12 gap-x-12 gap-y-16">
          {/* ── Left: sticky interactive timeline (desktop only) ──────────── */}
          <div className="hidden md:block md:col-span-4">
            <div className="md:sticky md:top-28">
              <div className="relative pl-8">
                {/* Vertical rail */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10" />
                {/* Lime progress fill — height animates with scroll */}
                <motion.div
                  className="absolute left-[9px] top-2 w-px bg-[#a3e635] origin-top"
                  style={{
                    height: useTransform(progress, [0, 1], ["0%", "100%"]),
                    boxShadow: "0 0 8px rgba(163,230,53,0.55)",
                  }}
                />
                <motion.ul
                  className="space-y-7"
                  initial="hidden"
                  whileInView="shown"
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ staggerChildren: 0.11, delayChildren: 0.1 }}
                >
                  {DEEP_FEATURES.map((f, i) => {
                    const isActive = active === i
                    const isDone = active > i
                    return (
                      <motion.li
                        key={i}
                        className="relative"
                        variants={{
                          hidden: { opacity: 0, x: -18 },
                          shown: {
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                          },
                        }}
                      >
                        {/* Dot */}
                        <button
                          onClick={() => scrollTo(i)}
                          className="absolute -left-8 top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors duration-300"
                          style={{
                            background: isActive || isDone ? "#a3e635" : "transparent",
                            borderWidth: 2,
                            borderColor: isActive || isDone ? "#a3e635" : "rgb(229 231 235)",
                            boxShadow: isActive ? "0 0 0 6px rgba(163,230,53,0.18)" : "none",
                          }}
                          aria-label={`Jump to ${f.title}`}
                        >
                          {isDone && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-gray-900">
                              <path d="M4.5 8.5 2 6l.9-.9 1.6 1.6L9.1 2 10 2.9z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => scrollTo(i)}
                          className="text-left w-full group"
                        >
                          <p className={
                            "text-[10px] font-bold uppercase tracking-[0.18em] mb-1 transition-colors duration-300 " +
                            (isActive
                              ? "text-[#7ba320] dark:text-[#a3e635]"
                              : "text-gray-400 dark:text-gray-600")
                          }>
                            {f.eyebrow}
                          </p>
                          <h3 className={
                            "text-lg font-bold tracking-tight transition-colors duration-300 " +
                            (isActive
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")
                          }>
                            {f.title}
                          </h3>
                        </button>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              </div>
            </div>
          </div>

          {/* ── Right: scrolling feature details ──────────────────────────── */}
          <div ref={detailsColRef} className="col-span-full md:col-span-8">
            {DEEP_FEATURES.map((f, i) => (
              <DeepFeatureDetail
                key={i}
                feature={f}
                index={i}
                total={DEEP_FEATURES.length}
                sectionProgress={progress}
                registerRef={(el) => { detailRefs.current[i] = el }}
              />
            ))}
            {/* End-of-timeline sentinel — IntersectionObserver above watches
                this div. Once it comes into view (i.e., step 4's scroll
                spacer has finished) the pill fades out and the nav exits
                compact mode. */}
            <div ref={endSentinelRef} aria-hidden className="h-0" />
          </div>
        </div>
      </div>
    </section>
  )
}

function DeepFeatureDetail({
  feature, index, total, sectionProgress, registerRef,
}: {
  feature: typeof DEEP_FEATURES[number]
  index: number
  total: number
  sectionProgress: MotionValue<number>
  registerRef: (el: HTMLDivElement | null) => void
}) {
  // Each detail owns a slice of the section's scroll range (e.g. 25% for 4 items).
  // We convert sectionProgress → localProgress in [0,1] scoped to this slice,
  // then drive a staggered cascade of element reveals within the slice.
  const slice = 1 / total
  const start = index * slice
  const end   = start + slice

  // Local progress: 0 just before the slice, 1 just after.
  // Extended by a small ±7% so enter/exit start slightly before/after the
  // exact slice — enough for a smooth handoff without bleeding far into
  // neighbouring slices (previously ±20% caused the last slice's exit to
  // complete well past the section's bottom, visually overlapping the next
  // page section).
  const local = useTransform(sectionProgress, [start - slice * 0.07, end + slice * 0.07], [0, 1])

  // Outer block fade + lift-off — lift-off pushed all the way to local 0.93
  // so the freeze window owns the bulk of the middle/late slice.
  const outerOpacity = useTransform(local, [0, 0.15, 0.93, 1],    [0, 1, 1, 0])
  const outerY       = useTransform(local, [0, 0.15, 0.93, 1],    [40, 0, 0, -90])

  // Per-element staggered reveals, keyed off localProgress.
  // Each element enters over its own window, stays, then fades with the block.
  const eyebrowOp   = useTransform(local, [0.08, 0.18],      [0, 1])
  const eyebrowY    = useTransform(local, [0.08, 0.18],      [20, 0])

  const titleOp     = useTransform(local, [0.12, 0.24],      [0, 1])
  const titleY      = useTransform(local, [0.12, 0.24],      [45, 0])

  const descOp      = useTransform(local, [0.20, 0.34],      [0, 1])
  const descY       = useTransform(local, [0.20, 0.34],      [35, 0])

  const bullet0Op   = useTransform(local, [0.32, 0.40],      [0, 1])
  const bullet0X    = useTransform(local, [0.32, 0.40],      [-24, 0])
  const bullet1Op   = useTransform(local, [0.36, 0.44],      [0, 1])
  const bullet1X    = useTransform(local, [0.36, 0.44],      [-24, 0])
  const bullet2Op   = useTransform(local, [0.40, 0.48],      [0, 1])
  const bullet2X    = useTransform(local, [0.40, 0.48],      [-24, 0])

  const imgOp       = useTransform(local, [0.25, 0.45],      [0, 1])
  // Image y choreography:
  //   [0.22 → 0.48]  entry rise  80 → 0 (at "normal" compact width)
  //   [0.48 → 0.62]  ░░ PAUSE ░░ — text is fully loaded and image sits at its
  //                               normal compact size so the eye can land
  //   [0.62 → 0.74]  focus lift  0 → -296 (glides up to viewport centre as
  //                               it simultaneously expands to full width)
  //   [0.74 → 0.93]  ████ FREEZE ████ — locked at -296, full width, centred
  //   [0.93 → 1.00]  outerY lift-off carries the whole block out
  const imgY        = useTransform(
    local,
    [0.22, 0.48, 0.62, 0.74, 0.93],
    [80,    0,    0,   -296, -296],
  )
  // Image width grows from a compact ~60% of the column to full width — the
  // growth is held off until after the pause so the normal size has a moment
  // to breathe before the focus lift. On mobile the detail column is already
  // full-viewport and the compact→grow choreography reads as the image
  // shrinking away then puffing back; instead, start full-width and stay
  // full-width the whole way through.
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mm = window.matchMedia("(max-width: 767px)")
    setIsMobile(mm.matches)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mm.addEventListener("change", onChange)
    return () => mm.removeEventListener("change", onChange)
  }, [])
  const imgWidth    = useTransform(
    local,
    [0.22, 0.48, 0.62, 0.74, 0.93],
    isMobile
      ? ["100%", "100%", "100%", "100%", "100%"]
      : ["62%",  "62%",  "62%",  "100%", "100%"],
  )
  // Scale settles at 1 by 0.48 and stays there through the pause + freeze.
  const imgScale    = useTransform(local, [0.22, 0.48, 0.93], [0.88, 1, 1])
  // Prior left-to-right clip-path reveal removed — the opacity+y+scale
  // entry already does enough work on its own, and stacking the wipe on top
  // made the visual entry feel overwhelming. Now it's a plain in/out fade
  // (imgOp) with the subtle rise + scale.

  // Focus phase — only for sections that actually have a visual. The text
  // block fades and drifts upward just as the image begins its focus lift,
  // giving a brief pause at 0.48–0.62 where text + normal-size image both sit
  // fully loaded before anything moves.
  // Only steps 1 (No-Code video) and 2 (Self-Hosted video) run the freeze/
  // center focus choreography. Step 0 (Zero Config card) and step 3
  // (Integrations orb) are decorative — their visual sits alongside the text
  // rather than taking over, so no grow/fade-out of the text block.
  const hasVisual = index === 1 || index === 2
  const textBlockOp = useTransform(
    local,
    hasVisual ? [0.62, 0.72] : [0, 0.01],
    hasVisual ? [1,    0]    : [1, 1],
  )
  const textBlockY = useTransform(
    local,
    hasVisual ? [0.62, 0.72] : [0, 0.01],
    hasVisual ? [0,   -40]   : [0, 0],
  )

  // Accent rail on the left of the text block — grows as you scroll through.
  const railScaleY  = useTransform(local, [0.10, 0.55],      [0, 1])

  const bulletOps = [bullet0Op, bullet1Op, bullet2Op]
  const bulletXs  = [bullet0X,  bullet1X,  bullet2X]

  return (
    // Outer scroll spacer — gives the slice enough scroll distance for the
    // entry animation to fully unfold. The actual content inside is pinned to
    // the viewport via `sticky`, so the user stays on the content while the
    // animation plays rather than scrolling past it.
    <div
      ref={registerRef}
      className="relative min-h-[340vh]"
    >
      <motion.div
        style={{ opacity: outerOpacity, y: outerY }}
        // `top-28` matches the left timeline column so STEP 0x and the
        // detail's own eyebrow sit on the same Y line. `justify-start` keeps
        // the content anchored to the top of the viewport instead of
        // centering it (which previously pushed the first detail down).
        className="sticky top-28 h-[calc(100vh-7rem)] flex flex-col justify-start gap-8 pb-12"
      >
        <div className="relative">
          {/* Lime accent rail — scales in vertically as the section reveals */}
          <motion.div
            aria-hidden
            style={{ scaleY: railScaleY }}
            className="absolute -left-5 top-2 bottom-20 w-[2px] bg-[#a3e635] origin-top rounded-full"
          />

          {/* Heading block (eyebrow + title) — stays visible while the image
              grows so the viewer always has context for what they're looking at. */}
          <motion.p
            style={{ opacity: eyebrowOp, y: eyebrowY }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7ba320] dark:text-[#a3e635] mb-3"
          >
            {feature.eyebrow}
          </motion.p>
          <motion.h3
            style={{ opacity: titleOp, y: titleY }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            {feature.title}
          </motion.h3>

          {/* Supporting copy (description + bullets) — this is what fades out
              during the focus phase so the image can take centre stage. */}
          <motion.div style={{ opacity: textBlockOp, y: textBlockY }}>
            <motion.p
              style={{ opacity: descOp, y: descY }}
              className="text-gray-500 dark:text-gray-400 leading-relaxed text-base md:text-lg max-w-xl mb-6"
            >
              {feature.desc}
            </motion.p>
            <ul className="space-y-2 mb-8 max-w-xl">
              {feature.bullets.map((b, bi) => (
                <motion.li
                  key={b}
                  style={{ opacity: bulletOps[bi], x: bulletXs[bi] }}
                  className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300"
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 flex-none fill-[#a3e635]">
                    <path d="M6.5 11.5 3 8l1.1-1.1 2.4 2.4L11.9 4 13 5.1z" />
                  </svg>
                  <span>{b}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Visual slot — index 0 (Zero Config) shows a "Start now" card that
            links to the docs, index 1 (No-Code Pipelines) embeds the
            showcase video, index 2 (Self-Hosted) plays a recorded Docker
            session as video, and index 3 (Integrations) renders a 3D orb. */}
        {index === 0 ? (
          // Zero Config — card sits alongside the text, no grow/freeze/center
          // choreography (matches the Integrations orb treatment at step 4).
          // The reader reads the copy and the card is simply there as a CTA,
          // not a spotlighted visual to transition into.
          <motion.div style={{ opacity: imgOp }}>
            <ZeroConfigStartCard />
          </motion.div>
        ) : index === 1 ? (
          // No-Code — video capped in width so the sticky content never
          // outgrows the viewport and bleeds into the next section.
          <motion.video
            style={{ opacity: imgOp, y: imgY, scale: imgScale, width: imgWidth }}
            src="/showcase.webm"
            autoPlay
            loop
            muted
            playsInline
            className="block h-auto rounded-2xl
                       border border-gray-200/80 dark:border-white/[0.07]"
          />
        ) : index === 2 ? (
          // Self-Hosted — recorded Docker container-finder session. Video
          // replaces the previous animated ImageSearchMockup since playback
          // is cheaper than running the mockup's framer-motion animation
          // tree on every scroll frame.
          <motion.video
            style={{ opacity: imgOp, y: imgY, scale: imgScale, width: imgWidth }}
            src="/container-finder.webm"
            autoPlay
            loop
            muted
            playsInline
            className="block h-auto rounded-2xl
                       border border-gray-200/80 dark:border-white/[0.07]"
          />
        ) : (
          // Integrations — 3D orb, rendered without any card frame and without
          // the grow/freeze/center choreography. Wide/short aspect so the
          // ellipsoid reads as a horizontal band of platform logos, centred
          // in the column. `overflow-hidden` contains the orb's 640px-wide
          // orbit rings + tile bleed (rx=260 + tile halfwidth means tiles
          // can extend ~290px from centre, wider than a mobile viewport) so
          // the orb doesn't push horizontal scroll on small screens.
          <motion.div
            style={{ opacity: imgOp }}
            className="relative mx-auto aspect-[16/6] w-full overflow-hidden"
          >
            <IntegrationsOrb />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// ─── Mobile sticky wrapper ───────────────────────────────────────────────────
// Wraps the heading + timeline in one scroll-pinned container. Its sticky
// `top` is animated over morph progress so the pill migrates from the
// heading-safe 80px drop-down to the nav's 20px Y line — it glides into
// the gap the shrunken nav has just opened up in the middle of the row.
function MobileStickyWrapper({
  morphProgress,
  pastDeepDive,
  children,
}: {
  morphProgress: MotionValue<number>
  /** True once step 4 has been fully scrolled through. Fades the pill out
   *  so the reader isn't staring at a now-useless timeline stub through
   *  the section's trailing padding. */
  pastDeepDive: boolean
  children: React.ReactNode
}) {
  // Phased after the heading finishes collapsing (heading's gridTemplateRows
  // hits 0fr at morphProgress ≈ 0.65 = SHAPE) and after the nav's compact
  // signal fires (~0.63). Doing the climb in the [0.65 → 0.80] window means
  // the pill only migrates up once there's nothing above it to collide with
  // the nav — no fleeting overlap during the transition — and finishes well
  // before the buffer ends so the pill is locked in place by the time the
  // user reaches the first detail section.
  // Pre-morph top is 112 (pt-28) to match the section's mobile top padding
  // so the sticky pin is seamless — no jump from flow position to pinned
  // position — and gives the heading extra breathing room below the nav.
  const top = useTransform(morphProgress, [0.65, 0.80], [112, 20])
  return (
    // zIndex 30 sits below the fixed nav (z-60) so the timeline pill passes
    // under the nav rather than on top of it — the nav's logo and CTA stay
    // the dominant layer even when the pill shares their Y line.
    <motion.div
      style={{ top, position: "sticky", zIndex: 30 }}
      className="md:hidden"
      // Fade + lift out once the reader has finished step 4. pointerEvents
      // disable prevents stray taps on the invisible pill stub.
      animate={{
        opacity: pastDeepDive ? 0 : 1,
        y:       pastDeepDive ? -8 : 0,
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      initial={false}
    >
      <div style={{ pointerEvents: pastDeepDive ? "none" : "auto" }}>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Mobile section heading ──────────────────────────────────────────────────
// Shown inside the mobile sticky pill wrapper. Fades and collapses its own
// height as the morph progresses so once the pill is formed, the heading
// stops taking space in the sticky row — the pill sits alone at top-32 for
// the rest of the Deep Dive section.
function MobileSectionHeading({ morphProgress }: { morphProgress: MotionValue<number> }) {
  // Match the MobileTimeline's PRE/RETRACT/SHAPE beats so the heading fades
  // alongside the list retract and finishes collapsing as the pill takes shape.
  const opacity = useTransform(morphProgress, [0.05, 0.30], [1, 0])
  const rows    = useTransform(morphProgress, [0.30, 0.65], ["1fr", "0fr"])
  return (
    <motion.div style={{ gridTemplateRows: rows }} className="grid">
      <motion.div style={{ opacity }} className="overflow-hidden min-h-0">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7ba320] dark:text-[#a3e635] mb-3">
            Deep Dive
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            How Bobby works<br/>
            <span className="text-gray-400 dark:text-gray-500">end to end.</span>
          </h2>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Single timeline row ─────────────────────────────────────────────────────
// One row of the mobile timeline. Used to be inlined inside MobileTimeline's
// features.map(), but pulling it out into its own component (and rendering 4
// explicit instances) gives each row a stable identity, makes the animate
// props obviously bound to local props, and removes the indexed-closure
// edge cases that made the shrink behaviour unpredictable when the active
// step changed mid-morph.
function TimelineRow({
  step,
  feature,
  active,
  pillReady,
  expanded,
  dotSize,
  activeHalo,
  inactiveOpacity,
  inactiveRows,
  chevOpacity,
  onJump,
  onToggleExpand,
}: {
  step: number
  feature: typeof DEEP_FEATURES[number]
  active: number
  pillReady: boolean
  expanded: boolean
  dotSize: MotionValue<number>
  activeHalo: MotionValue<string>
  inactiveOpacity: MotionValue<number>
  inactiveRows: MotionValue<string>
  chevOpacity: MotionValue<number>
  onJump: (i: number) => void
  onToggleExpand: () => void
}) {
  const isActive = active === step
  const isDone = active > step
  const tween = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }

  // The button content is the same regardless of wrapper. Defining it once
  // here keeps the active/inactive branches identical apart from their
  // wrapper chrome — no chance of the two branches drifting in their
  // animate targets.
  const rowButton = (
    <motion.button
      onClick={() => onJump(step)}
      initial={false}
      animate={{
        paddingTop:    pillReady ? 3 : 14,
        paddingBottom: pillReady ? 3 : 14,
      }}
      transition={tween}
      className="flex w-full items-center gap-3 text-left"
      aria-label={`Jump to ${feature.title}`}
    >
      <motion.span
        className="flex-none rounded-full flex items-center justify-center"
        style={{
          width: dotSize,
          height: dotSize,
          background: isActive || isDone ? "#a3e635" : "transparent",
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: isActive || isDone ? "#a3e635" : "rgb(229 231 235)",
          boxShadow: isActive ? activeHalo : "none",
        }}
      >
        {isDone && (
          <motion.svg
            viewBox="0 0 12 12"
            initial={false}
            animate={{
              width:  pillReady ? 7 : 10,
              height: pillReady ? 7 : 10,
            }}
            transition={tween}
            className="fill-gray-900"
          >
            <path d="M4.5 8.5 2 6l.9-.9 1.6 1.6L9.1 2 10 2.9z" />
          </motion.svg>
        )}
      </motion.span>
      <span className="min-w-0 flex-1">
        {/* Eyebrow collapses to zero rows in pill state — grid row hits
            0fr, opacity hits 0, font goes to 0, so it leaves no baseline
            gap and the title sits centered on the dot. */}
        <motion.span
          initial={false}
          style={{gridTemplateRows: "1fr"}}
          transition={tween}
          className="grid"
        >
          <motion.span
            initial={false}
            style={{
              fontSize: pillReady ? 6 : 10,
            }}
            transition={tween}
            className={
              "block font-bold uppercase tracking-[0.18em] leading-none overflow-hidden min-h-0 mb-1 " +
              (isActive
                ? "text-[#7ba320] dark:text-[#a3e635]"
                : "text-gray-400 dark:text-gray-600")
            }
          >
            {feature.eyebrow}
          </motion.span>
        </motion.span>
        <motion.span
          initial={false}
          style={{ fontSize: pillReady ? 14 : 18 }}
          transition={tween}
          className={
            "block font-bold tracking-tight truncate leading-tight " +
            (isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400")
          }
        >
          {feature.title}
        </motion.span>
      </span>
    </motion.button>
  )

  // Inactive row, post-pill: hand-off to expand-toggle driven dropdown.
  if (!isActive && pillReady) {
    return (
      <motion.li
        initial={false}
        animate={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="grid"
      >
        <div className="overflow-hidden min-h-0">{rowButton}</div>
      </motion.li>
    )
  }

  // Inactive row, pre-pill: scroll-driven retract.
  if (!isActive) {
    return (
      <motion.li
        style={{ opacity: inactiveOpacity, gridTemplateRows: inactiveRows }}
        className="grid"
      >
        <div className="overflow-hidden min-h-0">{rowButton}</div>
      </motion.li>
    )
  }

  // Active row: always visible. Once the pill is formed the chevron on the
  // right becomes the tap target for expand/collapse.
  return (
    <li className="relative">
      {rowButton}
      <motion.button
        type="button"
        style={{ opacity: chevOpacity }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleExpand()
        }}
        disabled={!pillReady}
        aria-label={expanded ? "Collapse section navigation" : "Expand section navigation"}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg
          viewBox="0 0 12 12"
          className={"h-3 w-3 fill-current transition-transform " + (expanded ? "rotate-180" : "")}
        >
          <path d="M6 8.5 1.5 4l1.1-1.1L6 6.3l3.4-3.4L10.5 4z" />
        </svg>
      </motion.button>
    </li>
  )
}

// ─── Mobile timeline (floating right-edge pill) ──────────────────────────────
// Shown only on small screens. Sits sticky near the top of the Deep Dive
// section, aligned to the right edge. Collapsed state shows the currently
// active step as a compact pill; tapping expands the full list so the user
// can jump between steps without scrolling back up.
function MobileTimeline({
  features,
  active,
  morphProgress,
  morphRawProgress,
  onJump,
}: {
  features: typeof DEEP_FEATURES
  active: number
  /** Spring-smoothed morph progress (0 → 1). Drives the pill chrome — bg,
   *  radius, padding, maxWidth — so those flow in smoothly. */
  morphProgress: MotionValue<number>
  /** Raw, un-smoothed scroll progress (0 → 1). Used to trigger pillReady
   *  without spring lag — the text/dot compaction runs its own time-based
   *  animation and doesn't want to wait for the spring to catch up, which
   *  would fire the trigger way late (user scrolled into step 2 before
   *  the smoothed value crossed the threshold). */
  morphRawProgress: MotionValue<number>
  onJump: (i: number) => void
}) {
  // ── Morph choreography ────────────────────────────────────────────────
  // One continuous in-place transformation — no flying element, no handoff
  // to a separate pill. The whole container collapses like a sidebar nav:
  //
  //   PRE → RETRACT:  inactive rows fade + collapse their row height, so
  //                   the list visually retracts around the active row.
  //   RETRACT → SHAPE: the surviving container shrinks horizontally
  //                   (right-aligned) and its surface morphs into a pill
  //                   (rounded, solid bg, border, shadow, tighter padding).
  //
  // After SHAPE the container IS the pill — same DOM node, same active row
  // content — just wrapped in pill-shaped chrome. Tapping it expands the
  // height back out to reveal all rows as a dropdown.
  // Beats are intentionally biased toward the early/mid portion of the buffer
  // scroll (rather than ending at ~0.90) so the morph visually completes well
  // before the user reaches the first detail section. The remaining ~35% of
  // buffer scroll after SHAPE gives the spring plenty of room to settle —
  // previously the morph finishing at 0.90 left only 14% of buffer for the
  // spring to catch up, so on fast scrolls the pill would still be shrinking
  // as the user entered step 2.
  const PRE     = 0.05
  const RETRACT = 0.30
  const SHAPE   = 0.65

  // Inactive rows collapse + fade first.
  const inactiveOpacity = useTransform(morphProgress, [PRE, RETRACT], [1, 0])
  const inactiveRows    = useTransform(morphProgress, [PRE, RETRACT], ["1fr", "0fr"])
  const railOpacity     = inactiveOpacity

  // Container shrink: parent is `flex justify-end`, so as we lower maxWidth
  // the container pulls in from the LEFT while its right edge stays pinned —
  // which is exactly the "collapse toward a right-side pill" feel.
  //
  // We measure the parent width so we can tween between real pixel values
  // (string-unit tweens like "100%" → "240px" don't interpolate smoothly in
  // framer-motion). The maxWidth transform below reads parentW reactively.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const parentWRef = useRef(0)
  const [, forceRerender] = useState(0)
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const w = el.offsetWidth
      if (w && w !== parentWRef.current) {
        parentWRef.current = w
        forceRerender((n) => n + 1)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PILL_W = 210 // px — final pill width
  const maxWidth = useTransform(morphProgress, (v) => {
    const t = Math.max(0, Math.min(1, (v - RETRACT) / (SHAPE - RETRACT)))
    const start = parentWRef.current || PILL_W
    return start * (1 - t) + PILL_W * t
  })

  // Surface morph: flat timeline → pill chrome. Using a modest 22px target
  // radius (rather than the full 9999 stadium) means the collapsed pill is
  // still fully-round at its compact ~36px height (22 > 18 = half-height),
  // while the taller expanded state reads naturally as a rounded rectangle
  // — no radius animation needed on expand/collapse.
  const radius       = useTransform(morphProgress, [RETRACT, SHAPE], [0, 22])
  const padX         = useTransform(morphProgress, [RETRACT, SHAPE], [0, 12])
  const padY         = useTransform(morphProgress, [RETRACT, SHAPE], [0, 6])
  const bgOpacity    = useTransform(morphProgress, [RETRACT, SHAPE], [0, 1])
  const shadowOp     = useTransform(morphProgress, [RETRACT, SHAPE], [0, 0.18])
  const boxShadow    = useMotionTemplate`0 8px 24px -8px rgba(0,0,0,${shadowOp})`
  // Chevron only appears once the pill is formed enough to read as a tap
  // target; before that it's just distracting.
  const chevOpacity  = useTransform(morphProgress, [RETRACT, SHAPE], [0, 1])

  // ── Row-level compaction ──────────────────────────────────────────────
  // Pre-morph values are tuned to match the DESKTOP timeline's typography +
  // spacing (dot 18px, eyebrow 10px, title 18px/text-lg, ~28px row gap via
  // 14px paddingY on each row). That way the mobile full-size list reads
  // exactly like the desktop one before the morph kicks in. During the
  // morph (RETRACT → SHAPE) each dimension tweens down to its compact pill
  // value so the finished pill is a single tight line.
  // Row-level compaction runs as its OWN time-based animation keyed off
  // `pillReady` rather than off scroll-driven morphProgress. The moment the
  // pill is formed, everything tweens to its compact target over ~0.3s,
  // independent of scroll velocity or spring settle.
  //
  // Two flavours for the two consumer patterns:
  //   • `dotSize` / `haloPx` stay motion values because `railLeft` and
  //     `activeHalo` read them reactively via motion-value computations.
  //     We drive them imperatively with framer's `animate()` in an effect.
  //   • Everything else is consumed once as a style prop, so we skip the
  //     motion-value plumbing and let the JSX use declarative `animate`
  //     props directly — simpler, obviously correct, no motion-value
  //     subscription to debug.
  const dotSize = useMotionValue(18)
  const haloPx  = useMotionValue(6)
  // Halo shadow for the active dot — amplitude shrinks with haloPx so it
  // matches the smaller compact dot.
  const activeHalo     = useMotionTemplate`0 0 0 ${haloPx}px rgba(163,230,53,0.18)`
  // Rail tracks the dot's horizontal center: padX (pill inner-left) plus half
  // the dot width, which itself shrinks with the compaction above.
  const railLeft       = useTransform(() => padX.get() + dotSize.get() / 2)

  // Expand state (user taps the pill to see all rows as a dropdown).
  const [expanded, setExpanded] = useState(false)
  const [pillReady, setPillReady] = useState(false)
  // Trigger off RAW progress, not the spring. The spring lags by hundreds of
  // ms on fast scrolls, which would push pillReady's flip well past the
  // buffer and into detail step 1/2 — so the text animation would kick off
  // after the user is already deep in the content, feeling like a late pop.
  // Raw progress fires the instant scroll crosses the threshold, so the
  // 0.3s shrink animation runs in sync with the pill chrome filling in.
  useMotionValueEvent(morphRawProgress, "change", (v) => {
    setPillReady(v >= SHAPE - 0.05)
  })
  // Auto-collapse if we scroll back out of the pill state, so the dropdown
  // doesn't reappear half-open next time.
  useEffect(() => {
    console.log(pillReady)
    if (!pillReady) setExpanded(false)
  }, [pillReady])

  // Wrap the external onJump so every row tap also collapses the dropdown
  // back to the single-line pill. Without this, tapping a step in the
  // expanded dropdown would scroll the viewport but leave the dropdown
  // covering the detail the user just jumped to.
  const handleJump = (i: number) => {
    setExpanded(false)
    onJump(i)
  }

  // Drive the two motion values (dotSize, haloPx) imperatively — they're the
  // ones consumed reactively by railLeft/activeHalo so they can't be plain
  // animate-prop targets. The rest are consumed declaratively in the JSX
  // below via `animate={{ ... }}` bound to `pillReady`.
  useEffect(() => {
    const tween = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
    const a1 = animate(dotSize, pillReady ? 10 : 18, tween)
    const a2 = animate(haloPx,  pillReady ? 3  : 6,  tween)
    return () => { a1.stop(); a2.stop() }
  }, [pillReady, dotSize, haloPx])


  return (
    // Outer row: centers the morphing container horizontally. As the maxWidth
    // tween drops from the parent's full width down to PILL_W the container
    // pulls in symmetrically from both sides, landing the finished pill in
    // the middle of the nav row — flanked by the compacted [logo] on the
    // left and [menu] on the right.
    <div
      ref={wrapperRef}
      className="md:hidden flex justify-center"
    >
      <motion.div
        style={{
          maxWidth,
          borderRadius: radius,
          paddingLeft: padX,
          paddingRight: padX,
          paddingTop: padY,
          paddingBottom: padY,
          boxShadow,
        }}
        className="w-full relative"
      >
        {/* Pill surface layer — bg + border fade in during the SHAPE window.
            Kept as its own layer so we can fade opacity cleanly without
            fighting the padding/radius of the outer motion wrapper. */}
        <motion.div
          aria-hidden
          style={{ opacity: bgOpacity, borderRadius: radius }}
          className="pointer-events-none absolute inset-0
                     border border-gray-200 bg-white
                     dark:border-white/[0.12] dark:bg-[#141414]"
        />

        {/* Vertical rail — tracks the dot column; fades with inactive rows. */}
        <motion.div
          style={{ opacity: railOpacity, left: railLeft }}
          className="absolute top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10 pointer-events-none"
        />

        <ul className="relative flex flex-col">
          {/* Rows are unrolled — one explicit <TimelineRow /> per step —
              rather than rendered via features.map(). The static layout makes
              each row a stable, predictable element across renders: no key
              reconciliation, no conditional early returns inside a loop
              scope, no indexed closures over `i`. Each instance gets fresh
              dedicated props for its step index.
              `handleJump` wraps the parent `onJump` with an auto-collapse:
              tapping any row to navigate should always close the dropdown
              back to the single-line pill — leaving it open after a jump
              would obscure the detail view the user is jumping to. */}
          <TimelineRow step={0} feature={features[0]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={1} feature={features[1]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={2} feature={features[2]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={3} feature={features[3]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
        </ul>
      </motion.div>
    </div>
  )
}

// ─── Zero Config — "Start now" card ──────────────────────────────────────────
// Sits in the Step 01 visual slot. A compact, high-contrast card whose only
// job is to get the reader onto the install-and-go page of the docs.
function ZeroConfigStartCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border
                 border-gray-200 bg-white p-5 md:p-6
                 dark:border-white/[0.08] dark:bg-[#0c0c0c]"
    >
      {/* Ambient lime glow — matches the accent used elsewhere on the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.35), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RocketLaunchIcon className="h-4 w-4 text-[#7ba320] dark:text-[#a3e635]" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7ba320] dark:text-[#a3e635]">
            Get running in 60 seconds
          </span>
        </div>

        <h4 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          One command. No YAML.
        </h4>

        {/* Faux terminal snippet — reinforces the "one binary" pitch */}
        <div
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm
                     text-gray-800 dark:border-white/[0.08] dark:bg-[#141414] dark:text-gray-200"
        >
          <span className="text-gray-400 dark:text-gray-500 select-none">$ </span>
          curl -fsSL bobby.dev/install | sh
        </div>

        <a
          href="/docs"
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#a3e635] px-4 py-2
                     text-sm font-semibold text-[#0c0c0c] shadow-sm
                     transition-colors hover:bg-[#b4f04a]"
        >
          Start now
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <path d="M10.293 3.293a1 1 0 0 1 1.414 0l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L13.586 10H4a1 1 0 1 1 0-2h9.586l-3.293-3.293a1 1 0 0 1 0-1.414Z" />
          </svg>
        </a>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { dark, toggle: toggleTheme } = useTheme()
  const heroRef                   = useRef<HTMLDivElement>(null)
  const tilesWrapRef              = useRef<HTMLDivElement>(null)
  const featuresRef               = useRef<HTMLDivElement>(null)
  const ctaRef                    = useRef<HTMLDivElement>(null)
  const [riseAmount, setRiseAmount] = useState(140)
  const [tileCount, setTileCount]   = useState(5)   // 4 on mobile, 5 on sm+
  // Compact mobile nav flag — flipped by DeepDiveSection when its timeline
  // has morphed into its pill AND the section is still on-screen.
  const [deepDiveCompact, setDeepDiveCompact] = useState(false)

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

  return (
    <DeepDiveNavContext.Provider value={{ compact: deepDiveCompact, setCompact: setDeepDiveCompact }}>
    <div className="bg-white dark:bg-[#080808] text-gray-900 dark:text-white transition-colors">
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7ba320] dark:text-[#a3e635] mb-3">
            Why Bobby
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything handled.{" "}
            <span className="text-gray-400 dark:text-gray-500">Nothing needed.</span>
          </h2>
        </motion.div>
        {/* Bento layout: wide-narrow / narrow-wide to mirror the reference */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 max-w-5xl mx-auto">
          {SHOWCASE.map((f, i) => {
            // rows: [wide, narrow, narrow, wide] → spans 3,2,2,3 across 5 cols
            const span = i === 0 || i === 3 ? "md:col-span-3" : "md:col-span-2"
            return (
              <div key={f.title} className={span}>
                <ShowcaseCard {...f} index={i} scrollProgress={featuresProgress} featured={i === 0} />
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Deep-dive timeline ────────────────────────────────────────────── */}
      <DeepDiveSection />

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
    </DeepDiveNavContext.Provider>
  )
}
