"use client"

import { useTransform, type MotionValue } from "framer-motion"
import PixelGradient, { type Stop } from "@/components/PixelGradient"

// The page ground — a step darker than Ucelot's midnight (#090c1c) so the
// window and the ember light carry the scene.
export const PAGE_BG = "#05060e"

// Ember → midnight, matching ucelot.com's pixel field. Last stop = page ground.
export const EMBER_FIELD: Stop[] = [
  { pos: 0.0,  c: [255, 192, 104] },
  { pos: 0.18, c: [232, 148, 64] },
  { pos: 0.38, c: [150, 82, 40] },
  { pos: 0.6,  c: [38, 26, 46] },
  { pos: 0.8,  c: [11, 13, 30] },
  { pos: 1.0,  c: [5, 6, 14] }, // = PAGE_BG
]

// Fine monochrome grain, pre-rendered once as a small tiling SVG. Large dark
// gradients band visibly on many screens; a whisper of noise breaks that up.
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

// ─── Ambient background ───────────────────────────────────────────────────────
// One fixed layer behind the whole page (the page root isolates it, so it sits
// above the page colour and below every section). Because it's a single layer
// fixed to the screen, the hero's ember pixel field carries straight on into
// the dashboard build with no seam between sections; as the camera pulls back
// it dissolves outer → inner in the pixel ripple. `story` is the build's
// progress (0 during the hero).
export default function AmbientBackground({ story }: { story: MotionValue<number> }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <EmberField story={story} />
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }} />
    </div>
  )
}

function EmberField({ story }: { story: MotionValue<number> }) {
  const wipe = useTransform(story, [0.1, 0.5], [0, 1])
  return (
    <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-[0.55]">
      <PixelGradient
        stops={EMBER_FIELD}
        metric="circle"
        tiltDeg={0}
        anchorX={0.5}
        anchorY={1.05}
        tilePx={34}
        tileAspect={1.1}
        bloomStart={0}
        bloomEnd={0.8}
        wipeProgress={wipe}
        wipeSteps={24}
      />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#05060e] to-transparent" />
    </div>
  )
}
