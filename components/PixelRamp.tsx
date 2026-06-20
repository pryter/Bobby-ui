// PixelRamp (archived) — the "shrinking squares" pixel motif: a grid of solid
// squares that swell toward the bottom-right corner and shrink to nothing inward.
//
// NOTE: ARCHIVED / currently unused. The dissolve, diagonal and rings motifs are
// live behind the "Why Bobby" cards (PixelMotif in app/page.tsx); this size-ramp
// variant was pulled as not quite on-theme but kept here in case we want it back.
// To use: render inside a `relative overflow-hidden` parent with `relative z-10`
// content, e.g. <PixelRamp color="#f5a623" />.

import type { ReactNode } from "react"

export default function PixelRamp({ color }: { color: string }) {
  const COLS = 16, ROWS = 27, REACH = 0.52, GAP = 0.18
  const nodes: ReactNode[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const fx = x / (COLS - 1)
      const fy = y / (ROWS - 1)
      const p = 1 - Math.hypot(fx - 1, fy - 1) / REACH // presence: 1 at bottom-right corner → 0 at REACH
      if (p <= 0) continue
      const size = (1 - GAP) * Math.min(1, p * 1.3) // squares swell toward the corner
      if (size <= 0.12) continue
      const inset = (1 - size) / 2
      nodes.push(
        <rect key={`${x}-${y}`} x={x + inset} y={y + inset} width={size} height={size} rx={size * 0.16} fill={color} />,
      )
    }
  }
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${COLS} ${ROWS}`}
      preserveAspectRatio="xMaxYMax slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {nodes}
    </svg>
  )
}
