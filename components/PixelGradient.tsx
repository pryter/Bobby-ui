"use client"

import { useEffect, useRef } from "react"
import type { MotionValue } from "framer-motion"

// ─────────────────────────────────────────────────────────────────────────────
// PixelGradient
//
// A crisp, cheap "pixelated contour" gradient. Draws onto a tiny canvas that is
// only `cols × rows` big (one source pixel = one visible tile), then stretches
// it to fill its parent with `image-rendering: pixelated` so the browser
// nearest-neighbour-upscales each pixel into a big crisp block. No per-frame
// work — it only redraws on resize (and on theme switch, in themeable mode).
//
// Three ideas drive the look:
//   1. tiny canvas + pixelated upscaling  → cheap & crisp
//   2. the distance metric IS the pattern → diamonds / squares / circles
//   3. single hue, brightness ramp        → distinct tiles, no dither.
//      Make the LAST stop = the page background so the edges blend out.
// ─────────────────────────────────────────────────────────────────────────────

export type RGB = [number, number, number]
export type Stop = { pos: number; c: RGB } // pos 0 = anchor (brightest), 1 = farthest
export type Metric = "diamond" | "square" | "circle"

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

// Stable per-tile pseudo-random in [0,1) — drives the optional noise/dither so
// the same tile always gets the same jitter across redraws.
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function sampleStops(stops: Stop[], t: number): RGB {
  if (t <= stops[0].pos) return stops[0].c
  const last = stops[stops.length - 1]
  if (t >= last.pos) return last.c
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1]
    if (t >= a.pos && t <= b.pos) {
      const k = (t - a.pos) / (b.pos - a.pos)
      return [lerp(a.c[0], b.c[0], k), lerp(a.c[1], b.c[1], k), lerp(a.c[2], b.c[2], k)]
    }
  }
  return last.c
}

// Parse "250 204 21" or "250, 204, 21" → RGB
function parseTriplet(s: string): RGB | null {
  const n = s.trim().split(/[\s,]+/).map(Number).filter((v) => !Number.isNaN(v))
  return n.length >= 3 ? [n[0], n[1], n[2]] : null
}

// Parse "rgb(8, 8, 8)" / "rgba(…)" / "#rrggbb" → RGB
function parseColor(s: string): RGB | null {
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (m) return parseTriplet(m[1])
  const h = s.trim().match(/^#?([0-9a-f]{6})$/i)
  if (h) { const v = parseInt(h[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255] }
  return null
}

const FALLBACK_STOPS: Stop[] = [
  { pos: 0.0, c: [254, 240, 160] },
  { pos: 0.34, c: [250, 204, 21] },
  { pos: 0.72, c: [133, 77, 14] },
  { pos: 1.0, c: [13, 13, 15] },
]

// Build a themeable ramp from the app's `--primary-*` CSS vars plus the page
// background colour (so the corners always blend into the real page bg, in
// either light or dark theme). Falls back to the hard-coded ramp if vars are
// missing (e.g. during SSR / before hydration).
function readPrimaryStops(): Stop[] {
  if (typeof window === "undefined") return FALLBACK_STOPS
  const cs = getComputedStyle(document.documentElement)
  const v = (name: string, fb: RGB): RGB => parseTriplet(cs.getPropertyValue(name)) ?? fb
  const p300 = v("--primary-300", [253, 224, 71])
  const p400 = v("--primary-400", [250, 204, 21])
  const p600 = v("--primary-600", [202, 138, 4])
  const p800 = v("--primary-800", [133, 77, 14])
  const p900 = v("--primary-900", [113, 63, 18])
  const bg = parseColor(cs.backgroundColor) ?? [13, 13, 15]
  // Luminous-but-still-on-hue core: lift the lightest shade toward white.
  const core: RGB = [lerp(p300[0], 255, 0.42), lerp(p300[1], 255, 0.42), lerp(p300[2], 255, 0.2)]
  return [
    { pos: 0.0, c: core },
    { pos: 0.16, c: p300 },
    { pos: 0.34, c: p400 },
    { pos: 0.54, c: p600 },
    { pos: 0.72, c: p800 },
    { pos: 0.86, c: p900 },
    { pos: 1.0, c: bg },
  ]
}

export default function PixelGradient({
  stops,                 // explicit RGB ramp; omit to auto-theme from --primary-* + page bg
  tiltDeg = 18,          // rotate the contour (0 = axis-aligned, ~45 turns a diamond into a square)
  tilePx = 26,           // approx tile width in CSS px (bigger = chunkier)
  tileAspect = 1.35,     // tile height / width (>1 = taller than wide)
  anchorX = 0.5,         // bright centre, 0 = left … 1 = right
  anchorY = 0.5,         // bright centre, 0 = top … 1 = bottom
  metric = "diamond",    // diamond | square | circle
  bloomStart = 0.05,     // smoothstep range: lower bloomEnd = tighter, darker sooner
  bloomEnd = 1.0,
  levels = 0,            // 0 = smooth ramp; N>1 posterises into N hard steps (chunkier)
  wipeProgress,          // MotionValue 0→1: dissolves the bloom outer→inner into the page bg
  wipeSteps = 0,         // 0 = smooth wipe; N>1 advances the front in N hard rings (step-by-step)
  noise = 0,             // per-tile brightness jitter (0–255) → dithered, obviously-pixelated texture
  className = "",
}: {
  stops?: Stop[]
  tiltDeg?: number
  tilePx?: number
  tileAspect?: number
  anchorX?: number
  anchorY?: number
  metric?: Metric
  bloomStart?: number
  bloomEnd?: number
  levels?: number
  wipeProgress?: MotionValue<number>
  wipeSteps?: number
  noise?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas?.parentElement
    if (!canvas || !host) return

    const dist = (rx: number, ry: number) =>
      metric === "circle" ? Math.hypot(rx, ry)
        : metric === "square" ? Math.max(Math.abs(rx), Math.abs(ry))
          : Math.abs(rx) + Math.abs(ry) // diamond (Manhattan)

    const draw = () => {
      const w = host.clientWidth, h = host.clientHeight
      if (!w || !h) return
      const cols = Math.max(8, Math.round(w / tilePx))
      const rows = Math.max(8, Math.round(h / (tilePx * tileAspect)))
      canvas.width = cols
      canvas.height = rows
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const ang = (tiltDeg * Math.PI) / 180
      const cosA = Math.cos(ang), sinA = Math.sin(ang)
      const asp = w / h // aspect-correct so the tilt/shape stays true when wide
      const activeStops = stops ?? readPrimaryStops()

      // Farthest corner from the anchor → normalises the ramp for any anchor/tilt/aspect.
      let maxR = 1e-6
      for (const [cx, cy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        const ox = (cx - anchorX) * asp, oy = cy - anchorY
        const rx = ox * cosA + oy * sinA, ry = -ox * sinA + oy * cosA
        maxR = Math.max(maxR, dist(rx, ry))
      }

      const bg = activeStops[activeStops.length - 1].c
      // Wipe: as wipeProgress goes 0→1, a page-bg "front" sweeps from the outer
      // tiles inward, dissolving the bloom outer→inner (a pixel ripple).
      const pRaw = wipeProgress ? Math.max(0, Math.min(1, wipeProgress.get())) : 0
      // Snap the progress to discrete rings when wipeSteps is set, so tiles drop
      // out ring-by-ring (each step holds, then the next outer ring disappears).
      const p = wipeSteps > 1 ? Math.floor(pRaw * wipeSteps) / wipeSteps : pRaw
      const front = lerp(1.04, -0.04, p)
      const wipeEdge = wipeSteps > 1 ? 0.03 : 0.1 // harder edge → cleaner ring step

      const img = ctx.createImageData(cols, rows)
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const fx = cols === 1 ? 0 : x / (cols - 1)
          const fy = rows === 1 ? 0 : y / (rows - 1)
          const ox = (fx - anchorX) * asp
          const oy = fy - anchorY
          const rx = ox * cosA + oy * sinA // rotate → tilt
          const ry = -ox * sinA + oy * cosA
          const r = dist(rx, ry) / maxR
          let t = smoothstep(bloomStart, bloomEnd, r)
          if (levels > 1) t = Math.round(t * (levels - 1)) / (levels - 1) // posterise → harder steps
          const c = sampleStops(activeStops, t)
          let cr = c[0], cg = c[1], cbl = c[2]
          if (noise > 0) {
            const n = (hash(x, y) - 0.5) * noise // ImageData is clamped, so over/underflow is fine
            cr += n; cg += n; cbl += n
          }
          if (p > 0) {
            const wf = smoothstep(front, front + wipeEdge, r) // 0 = keep tile, 1 = page bg
            if (wf > 0) { cr = lerp(cr, bg[0], wf); cg = lerp(cg, bg[1], wf); cbl = lerp(cbl, bg[2], wf) }
          }
          const i = (y * cols + x) * 4
          img.data[i] = cr; img.data[i + 1] = cg; img.data[i + 2] = cbl; img.data[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(host)
    // In themeable mode, redraw when the theme (html class) flips light/dark.
    let mo: MutationObserver | undefined
    if (!stops) {
      mo = new MutationObserver(draw)
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    }
    // Redraw imperatively as the wipe progress changes (no React re-render).
    const unsubWipe = wipeProgress?.on("change", draw)
    return () => { ro.disconnect(); mo?.disconnect(); unsubWipe?.() }
  }, [stops, tiltDeg, tilePx, tileAspect, anchorX, anchorY, metric, bloomStart, bloomEnd, levels, wipeProgress, wipeSteps, noise])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
        pointerEvents: "none",
      }}
    />
  )
}
