"use client"

import { useEffect, useRef, useState } from "react"
import { easeInOut, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"
import { BOARD_H, Board, FRAME_H, P3, W, type BoardMotion, type PieceMeta } from "./BoardPieces"
import { GRAIN } from "./AmbientBackground"
import { useLiteGraphics } from "@/lib/useLiteGraphics"
import { useNearViewport } from "@/lib/useNearViewport"

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
//   brisk   the project tiles (≈0.54 on): the sidebar is the highlight, so
//           the page fills in at about its pace, then quicker
//   slow    the final settle to head-on
// A monotone cubic through the knots keeps the speed changes gradual.
// STRETCHES are the scroll (vh) each stretch gets — to the credits pill, the
// sidebar, the first tiles, the rest of the tiles, the settle — and add up
// to the section's pinned length, so change the section's height with them.
// Phones get a shorter run (a thumb covers a screen or two per swipe; at the
// desktop's length the slow stretches invited flinging past them, and the
// rest then flushed through): the same story, evenly paced, in ~60% of it.
const STORY_KNOTS = [0.1, 0.54, 0.63, 0.84, 1]
const STRETCHES_WIDE = [144, 232, 56, 64, 164] // 660vh pinned: h-[760vh]
const STRETCHES_PHONE = [80, 150, 40, 46, 94] // 410vh pinned: h-[510vh]
function tempoFor(stretches: number[]): [number, number][] {
  const total = stretches.reduce((a, b) => a + b, 0)
  let at = 0
  return [[0, 0], ...stretches.map((s, i): [number, number] => [(at += s) / total, STORY_KNOTS[i]])]
}

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

const tempoWide = monotoneCurve(tempoFor(STRETCHES_WIDE))
const tempoPhone = monotoneCurve(tempoFor(STRETCHES_PHONE))

const NAV_CLEARANCE = 88
// As the board settles head-on (END_FROM → END_TO of the story) a caption
// fades in above it and the board makes room: smaller if the screen is short
// (desktop), lower on a tall one (phones), the two centred as a group.
const END_FROM = 0.9
const END_TO = 0.98
// The caption's gap to the board: clearly more than the heading's to its
// line, so heading and line read as one block and the board as the next.
const captionGap = (w: number) => (w < 768 ? 44 : 36)

// `story` (optional) receives the build's progress, so the page's ambient
// background can follow the camera.
export default function AssemblyCinematic({ story }: { story?: MotionValue<number> }) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageBoxRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] })
  // A little inertia on the scroll makes the camera feel like a dolly, not a
  // scrubber. On phones it's tighter, so a quick swipe doesn't build up lag
  // that then surges on after the finger stops.
  const smoothWide = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 })
  const smoothPhone = useSpring(scrollYProgress, { stiffness: 190, damping: 34, restDelta: 0.0005 })
  // Phones (below md) get their own tempo, matching the section's shorter
  // height; one story clock either way.
  const phone = useRef(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => (phone.current = mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  const storyTime = useTransform([smoothWide, smoothPhone], ([w, ph]: number[]) => (phone.current ? tempoPhone(ph) : tempoWide(w)))
  const still = useMotionValue(1)
  const p = reduce ? still : storyTime
  useMotionValueEvent(p, "change", (v) => story?.set(v))

  const fitMV = useMotionValue(0.8)
  const vhMV = useMotionValue(8)
  // The settled board: its scale relative to the fit, and how far it moves
  // down to leave room for the caption; the caption's top edge (px).
  const endRatio = useMotionValue(1)
  const endShift = useMotionValue(0)
  const captionRef = useRef<HTMLDivElement>(null)
  const [captionTop, setCaptionTop] = useState(0)
  useEffect(() => {
    const el = stageBoxRef.current
    const cap = captionRef.current
    if (!el || !cap) return
    const update = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      const fit = Math.min((w - 48) / W, (h - NAV_CLEARANCE - 32) / BOARD_H, 1.15)
      fitMV.set(fit)
      vhMV.set(h / 100)
      const textH = cap.offsetHeight
      const gap = captionGap(w)
      const endFit = Math.min(fit, (h - NAV_CLEARANCE - 32 - textH - gap) / BOARD_H)
      endRatio.set(endFit / fit)
      endShift.set((textH + gap) / 2)
      const centre = NAV_CLEARANCE / 2 + h / 2
      setCaptionTop(centre - (textH + gap + BOARD_H * endFit) / 2)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    ro.observe(cap)
    return () => ro.disconnect()
  }, [fitMV, vhMV, endRatio, endShift])

  const ease = { ease: easeInOut }
  const rotateX = useTransform(p, T, CAM.tilt, ease)
  const rotateZ = useTransform(p, T, CAM.roll, ease)
  const zoom = useTransform(p, T, CAM.zoom, ease)
  const endP = useTransform(p, [END_FROM, END_TO], [0, 1], ease)
  const scale = useTransform([zoom, fitMV, endP, endRatio], ([z, f, e, r]: number[]) => z * f * (1 + (r - 1) * e))
  const boardX = useTransform(p, T, CAM.fx.map((v) => -v), ease)
  const boardY = useTransform(p, T, CAM.fy.map((v) => -v), ease)
  // Frame the close-up higher (less empty space above the board's top edge),
  // easing back to centre as the camera pulls out.
  const frameVh = useTransform(p, [0, 0.42, 0.64], [-16, -10, 0], ease)
  const frameY = useTransform([frameVh, vhMV, endP, endShift], ([a, v, e, s]: number[]) => a * v + e * s)
  const captionY = useTransform(endP, [0, 1], [14, 0])

  // Focus falloff at the top and bottom of the frame while the camera is
  // close, lifting as it pulls back.
  // It also fades IN over the first moments: while the section is still
  // scrolling up into view, a solid band at its top edge would show as a line.
  const falloff = useTransform(p, [0, 0.04, 0.42, 0.8], [0, 1, 1, 0])

  // The sidebar collapses to its icon rail as the layers start pressing flush,
  // so the app's real collapse plays out during the flush.
  // Phones and low-memory devices get the lighter build: no slab layers, and
  // no sidebar collapse — it re-lays out and repaints the whole board at the
  // very moment every piece is on screen and pressing flat, the peak that got
  // the tab killed on low-end phones.
  const lite = useLiteGraphics()
  // Far off screen (the page has moved on) the board's layers are dropped.
  const near = useNearViewport(sectionRef)
  const boardMotion: BoardMotion = {
    p, schedule, arrival: "lay", flatStart: FLAT_START, flatEnd: FLAT_END,
    collapseAt: lite ? undefined : FLAT_START,
    lite,
  }

  return (
    <section ref={sectionRef} className="relative h-[510vh] md:h-[760vh]">
      <div className="sticky top-0 h-screen overflow-hidden" style={{ visibility: near ? undefined : "hidden" }}>

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
          {/* the same grain as the page background, so the faded bands match it
              (left out on the lite build: a full-screen masked layer) */}
          {!lite && <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: GRAIN,
              backgroundSize: "160px 160px",
              maskImage: "linear-gradient(to bottom, #000 0%, transparent 22%, transparent 72%, #000 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, transparent 22%, transparent 72%, #000 100%)",
            }}
          />}
        </motion.div>

        {/* What it all adds up to, once the board is all there. */}
        <motion.div
          ref={captionRef}
          style={{ top: captionTop, opacity: endP, y: captionY }}
          className="pointer-events-none absolute inset-x-0 px-6 text-left md:text-center"
        >
          <h2 className="max-w-4xl text-balance text-[clamp(2.4rem,5.6vw,4.5rem)] font-bold leading-[1.02] tracking-tight text-[#f6f7fb] md:mx-auto">
            Everything in one place.
          </h2>
          <p className="mt-3 max-w-[34ch] text-pretty text-[15px] leading-[1.45] text-[#9ba4c4] md:mx-auto md:mt-4 md:max-w-xl md:text-balance md:text-lg md:leading-relaxed">
            Ideas, issues, docs and the code behind them live together, and Ucelot keeps track of how they connect.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
