"use client"

import { useEffect, useRef } from "react"
import { easeInOut, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"
import { BOARD_H, Board, FRAME_H, P3, W, type BoardMotion, type PieceMeta } from "./BoardPieces"
import { GRAIN } from "./AmbientBackground"

// ─── Dashboard assembly — cinematic camera ────────────────────────────────────
// The same real Projects screen, filmed like a product reveal. The board lies
// flat, as if on a table, and the camera starts low and close at the top of
// the sidebar. As you scroll it glides down the sidebar while each element
// lays itself down just ahead of it; then it rises and pulls back while the
// page header, groups and project tiles lay down in order, until the whole
// board is in view; finally the board settles head-on.
//
// How the camera works: a zero-size "rig" sits at the centre of the screen
// and carries the tilt, roll and zoom. The board hangs off the rig, offset by
// the focus point (fx, fy) in board pixels, so the rig always pivots on what
// the camera is looking at — moving the focus point glides the camera across
// the board's surface rather than sliding the board around.

const FLAT_START = 0.86
const FLAT_END = 0.96

// Camera keyframes (scroll progress → value). Focus point is in window px
// (app coordinates + the title bar's height).
// 0–0.16: hold at the top of the sidebar while its first rows are placed.
// 0.16–0.42: glide down the sidebar. Then pull back, rise, and settle.
const T = [0, 0.16, 0.42, 0.5, 0.64, 0.8, FLAT_START, FLAT_END, 1]
const CAM = {
  tilt: [58, 56, 52, 46, 38, 32, 30, 0, 0], // rotateX: how flat the board lies
  roll: [-10, -9, -5, -2, 0, 0, 0, 0, 0], // rotateZ
  zoom: [2.5, 2.45, 2.25, 1.6, 1.15, 0.95, 0.95, 1, 1], // × the flat fit
  fx: [150, 150, 150, 360, 560, 600, 600, W / 2, W / 2],
  fy: [130, 200, 780, 600, 480].map((y) => y + FRAME_H).concat([BOARD_H / 2, BOARD_H / 2, BOARD_H / 2, BOARD_H / 2]),
}

// Sidebar rows are placed one at a time, unhurried (each lands before the
// next starts), and always ahead of the camera as it glides down (focus y
// 200 → 780 over 0.16–0.42) so every row is seated by the time it's in frame.
// The rest follows in reading order once the camera starts pulling back.
function schedule({ region, order, y }: PieceMeta) {
  switch (region) {
    case "panel": return { at: -0.05, dur: 0.04 } // already in place
    // The ember glow spreads from its corner as the scene opens; the pixel
    // texture spreads from the bottom corner just before the camera gets there.
    case "decor": return order === 0 ? { at: 0, dur: 0.09 } : { at: 0.12 + ((y - 360) / 580) * 0.26 - 0.03, dur: 0.07 }
    case "topbar": return order === 0 ? { at: 0.03, dur: 0.04 } : { at: 0.48 + order * 0.02, dur: 0.05 }
    case "sidebar": return { at: Math.max(0.015 + order * 0.021, 0.12 + ((y - 360) / 580) * 0.26), dur: 0.02 }
    case "page": return { at: 0.47 + order * 0.026, dur: 0.05 }
  }
}

// ─── Tempo ────────────────────────────────────────────────────────────────────
// Scroll isn't mapped to the story 1:1. Everything above (camera keyframes,
// schedule) is in story time; TEMPO says how much scroll each stretch of story
// gets — [scroll, story] knots. Slow where a moment deserves a beat, quicker
// in between:
//   slow    the top of the sidebar landing, through the credits pill (≈0.10)
//   faster  the rest of the sidebar and the camera pulling back
//   slow    the first two project tiles landing (≈0.54–0.63)
//   faster  the remaining tiles
//   slow    the final settle to head-on
// A monotone cubic through the knots keeps the speed changes gradual.
const TEMPO: [number, number][] = [
  [0, 0],
  [0.18, 0.1],
  [0.47, 0.54],
  [0.65, 0.63],
  [0.79, 0.84],
  [1, 1],
]

// Monotone cubic (Fritsch–Carlson) through the knots: smooth, never runs
// backwards. Ends ease in and out.
function monotoneCurve(points: [number, number][], easeEnds = 0.5) {
  const xs = points.map((q) => q[0])
  const ys = points.map((q) => q[1])
  const n = points.length
  const d = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x))
  const m = xs.map((_, i) => (i === 0 ? d[0] * easeEnds : i === n - 1 ? d[n - 2] * easeEnds : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i] }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0]
    if (x >= xs[n - 1]) return ys[n - 1]
    let i = 0
    while (x > xs[i + 1]) i++
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
  }
}

const tempo = monotoneCurve(TEMPO)

const NAV_CLEARANCE = 88

// `story` (optional) receives the build's progress, so the page's ambient
// background can follow the camera.
export default function AssemblyCinematic({ story }: { story?: MotionValue<number> }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageBoxRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] })
  // A little inertia on the scroll makes the camera feel like a dolly, not a scrubber.
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 })
  const storyTime = useTransform(smooth, tempo)
  const still = useMotionValue(1)
  const p = reduce ? still : storyTime
  useMotionValueEvent(p, "change", (v) => story?.set(v))

  const fitMV = useMotionValue(0.8)
  useEffect(() => {
    const el = stageBoxRef.current
    if (!el) return
    const update = () => fitMV.set(Math.min((el.clientWidth - 48) / W, (el.clientHeight - NAV_CLEARANCE - 32) / BOARD_H, 1.15))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fitMV])

  const ease = { ease: easeInOut }
  const rotateX = useTransform(p, T, CAM.tilt, ease)
  const rotateZ = useTransform(p, T, CAM.roll, ease)
  const zoom = useTransform(p, T, CAM.zoom, ease)
  const scale = useTransform([zoom, fitMV], ([z, f]: number[]) => z * f)
  const boardX = useTransform(p, T, CAM.fx.map((v) => -v), ease)
  const boardY = useTransform(p, T, CAM.fy.map((v) => -v), ease)
  // Frame the close-up higher (less empty space above the board's top edge),
  // easing back to centre as the camera pulls out.
  const frameY = useTransform(p, [0, 0.42, 0.64], ["-16vh", "-10vh", "0vh"], ease)

  // Focus falloff at the top and bottom of the frame while the camera is
  // close, lifting as it pulls back.
  // It also fades IN over the first moments: while the section is still
  // scrolling up into view, a solid band at its top edge would show as a line.
  const falloff = useTransform(p, [0, 0.04, 0.42, 0.8], [0, 1, 1, 0])

  // The sidebar collapses to its icon rail as the layers start pressing flush,
  // so the app's real collapse plays out during the flush.
  const boardMotion: BoardMotion = { p, schedule, arrival: "lay", flatStart: FLAT_START, flatEnd: FLAT_END, collapseAt: FLAT_START }

  return (
    <section ref={sectionRef} className="relative h-[900vh]">
      <div className="sticky top-0 h-screen overflow-hidden">

        <div ref={stageBoxRef} className="absolute inset-0 [perspective:2600px]">
          {/* Rig: pivots on the focus point at the centre of the frame. */}
          <motion.div
            className={"absolute left-1/2 h-0 w-0 " + P3}
            style={{ top: `calc(50% + ${NAV_CLEARANCE / 2}px)`, y: frameY, rotateX, rotateZ, scale }}
          >
            <motion.div
              className={"ucelot-app absolute left-0 top-0 text-[color:var(--c-text)] " + P3}
              style={{ width: W, height: BOARD_H, x: boardX, y: boardY }}
            >
              <Board motion={boardMotion} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div aria-hidden style={{ opacity: falloff }} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#05060e_0%,rgba(5,6,14,0)_22%,rgba(5,6,14,0)_72%,#05060e_100%)]" />
          {/* the same grain as the page background, so the faded bands match it */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: GRAIN,
              backgroundSize: "160px 160px",
              maskImage: "linear-gradient(to bottom, #000 0%, transparent 22%, transparent 72%, #000 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 22%, transparent 72%, #000 100%)",
            }}
          />
        </motion.div>
      </div>
    </section>
  )
}
