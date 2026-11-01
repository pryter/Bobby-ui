export type MotifMode = "dissolve" | "diagonal" | "rings" | "bars"

// Deterministic per-cell pseudo-random (stable across SSR/CSR — no Math.random).
export function pixHash(x: number, y: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453
  return s - Math.floor(s)
}

// Solid-colour pixel motifs — a nod to the hero's pixel flare. An ordered (Bayer
// 4×4) dither keeps every fade structured rather than noisy. Four geometries, all
// square pixels filling the top-right corner; the cluster carves a gap around the
// (left-aligned) title so the pixels flow around the heading instead of under it:
//   dissolve — dense block at the corner melting into scattered pixels
//   diagonal — 45° pixel ribs
//   rings    — concentric pixel arcs rippling out of the corner
//   bars     — vertical pixel bars rising toward the corner
// Pass an empty title when there is no heading to carve around.
// (the size-"ramp" / shrinking variant is archived in components/PixelRamp.tsx)
export default function PixelMotif({
  color, mode = "dissolve", title = "", index = 0, className = "",
}: {
  color: string
  mode?: MotifMode
  title?: string
  index?: number
  className?: string
}) {
  const COLS = 16, ROWS = 27, GAP = 0.18
  // Carve out the title's box (top-left) so no pixel sits behind the text. Long
  // titles wrap, so they take the full width and ~1.8 cells per extra line.
  const lines = title ? Math.max(1, Math.ceil((title.length * 0.7) / (COLS - 2.8))) : 0
  const TITLE_RIGHT = lines > 1 ? COLS : 1.4 + title.length * 0.7 // left pad + ~0.7 cell per character
  const TITLE_TOP = 1.4, TITLE_BOTTOM = lines ? 4.3 + (lines - 1) * 1.8 : 0
  // Per-card seed (from the card index) so each card differs in size, density,
  // dither phase and scatter — never a twin of a sibling.
  const seed = 100 + index * 137.5
  const REACH = 7 + (pixHash(2, 3, seed) - 0.5) * 2.4 // per-card size  (~5.8–8.2 cells)
  const BIAS = (pixHash(5, 9, seed) - 0.5) * 0.22     // per-card density
  const OX = Math.floor(pixHash(7, 1, seed) * 4)      // per-card Bayer dither phase (x)
  const OY = Math.floor(pixHash(1, 7, seed) * 4)      // per-card Bayer dither phase (y)
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ]
  const cells: [number, number][] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (lines && y >= TITLE_TOP && y <= TITLE_BOTTOM && x <= TITLE_RIGHT) continue // skip the title's box
      const thr = (BAYER[(y + OY) & 3][(x + OX) & 3] + 0.5) / 16
      const d = Math.hypot(COLS - 1 - x, y) // cell-space distance from the top-right corner
      const p = 1 - d / REACH               // presence: 1 at corner → 0 at REACH
      if (p <= 0) continue
      let on = false
      if (mode === "dissolve") on = p >= thr + BIAS + (pixHash(x, y, seed) - 0.5) * 0.3 // per-card density + jitter
      else if (mode === "diagonal") on = ((x + y) & 3) < 2 && p >= thr * 0.4
      else if (mode === "rings") on = (Math.round(d) & 1) === 0 && p >= thr * 0.15
      else if (mode === "bars") on = (x & 1) === 1 && p >= thr
      if (on) cells.push([x, y])
    }
  }
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${COLS} ${ROWS}`}
      preserveAspectRatio="xMaxYMin slice"
      className={"pointer-events-none absolute inset-0 h-full w-full " + className}
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + GAP / 2} y={y + GAP / 2} width={1 - GAP} height={1 - GAP} rx={(1 - GAP) * 0.16} fill={color} />
      ))}
    </svg>
  )
}
