"use client"

import { useEffect, useRef, useState } from "react"

// ── Brand marks ──────────────────────────────────────────────────────────────
// Simple, recognizable per-brand pills. Kept minimal on purpose: we want the
// orb to feel coherent, not like a pile of clashing logos. Each entry provides
// its own background + text color so brands read at a glance.
type Brand = {
  name: string
  short: string          // letters inside the tile
  bg: string             // CSS color
  fg: string             // CSS color
  ring?: string          // optional inner ring color
}

const BRANDS: Brand[] = [
  { name: "GitHub",      short: "GH",   bg: "#0d1117", fg: "#ffffff" },
  { name: "GitLab",      short: "GL",   bg: "#fc6d26", fg: "#ffffff" },
  { name: "Bitbucket",   short: "BB",   bg: "#2684ff", fg: "#ffffff" },
  { name: "Docker",      short: "DK",   bg: "#0db7ed", fg: "#ffffff" },
  { name: "Kubernetes",  short: "K8s",  bg: "#326ce5", fg: "#ffffff" },
  { name: "AWS",         short: "AWS",  bg: "#232f3e", fg: "#ff9900" },
  { name: "GCP",         short: "GCP",  bg: "#1a73e8", fg: "#ffffff" },
  { name: "Terraform",   short: "TF",   bg: "#7b42bc", fg: "#ffffff" },
  { name: "Postgres",    short: "PG",   bg: "#336791", fg: "#ffffff" },
  { name: "Slack",       short: "Sl",   bg: "#4a154b", fg: "#ecb22e" },
  { name: "Discord",     short: "Dc",   bg: "#5865f2", fg: "#ffffff" },
  { name: "npm",         short: "npm",  bg: "#cb3837", fg: "#ffffff" },
  { name: "Bobby",       short: "B",    bg: "#a3e635", fg: "#111111", ring: "#ffffff" },
]

// ── Fibonacci sphere layout ──────────────────────────────────────────────────
// Even distribution of N points on a sphere. Using the golden-angle spiral so
// no cluster looks denser than another as the orb rotates.
function sphereLayout(n: number, radius: number) {
  const pts: { x: number; y: number; z: number }[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2            // y from 1 to -1
    const r = Math.sqrt(1 - y * y)             // ring radius at this height
    const theta = golden * i
    pts.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    })
  }
  return pts
}

// ── IntegrationsOrb ──────────────────────────────────────────────────────────
//
// CSS-3D rotating sphere of brand tiles. The outer wrapper sets the perspective
// and a light tilt; an inner group rotates continuously around Y (driven by
// requestAnimationFrame so we can also billboard each tile to face the camera).
export default function IntegrationsOrb() {
  const [angle, setAngle] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    // ~20s per full rotation feels unhurried but clearly alive.
    const period = 28000
    const tick = (t: number) => {
      if (!startRef.current) startRef.current = t
      const elapsed = t - startRef.current
      setAngle((elapsed / period) * 360)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const radius = 150
  const points = sphereLayout(BRANDS.length, radius)

  return (
    <div
      className="relative h-full w-full rounded-2xl border border-gray-200
                 bg-white dark:border-white/[0.08] dark:bg-[#0c0c0c] overflow-hidden"
      style={{ perspective: "900px" }}
    >
      {/* Ambient lime glow behind the orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(163,230,53,0.10) 0%, transparent 60%)",
        }}
      />

      {/* Soft center highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2
                   rounded-full opacity-50 blur-2xl"
        style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.35), transparent 70%)" }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {/* Tilted stage — gives the orb a slight off-axis look */}
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(-14deg)",
          }}
        >
          {/* Rotating group */}
          <div
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateY(${angle}deg)`,
              width: 0,
              height: 0,
            }}
          >
            {BRANDS.map((b, i) => {
              const p = points[i]
              // Each tile is placed at its sphere coord then counter-rotated
              // around Y so it always faces the viewer (billboarding). Depth-
              // based opacity + scale fakes fog for a sense of volume.
              const depth = (p.z + radius) / (2 * radius) // 0 (back) → 1 (front)
              const scale = 0.75 + depth * 0.35
              const opacity = 0.35 + depth * 0.65
              return (
                <div
                  key={b.name}
                  className="absolute"
                  style={{
                    left: 0,
                    top: 0,
                    transform:
                      `translate3d(${p.x}px, ${p.y}px, ${p.z}px) ` +
                      `rotateY(${-angle}deg) rotateX(14deg) ` +
                      `scale(${scale})`,
                    opacity,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <BrandTile brand={b} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Orbit rings — flat SVG decoration behind the orb */}
      <svg
        aria-hidden
        viewBox="-200 -200 400 400"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 opacity-50"
      >
        <ellipse cx="0" cy="0" rx="170" ry="45"
          fill="none" stroke="rgba(163,230,53,0.35)" strokeDasharray="2 5" />
        <ellipse cx="0" cy="0" rx="155" ry="35"
          fill="none" stroke="rgba(163,230,53,0.22)" strokeDasharray="1 4"
          transform="rotate(20)" />
        <ellipse cx="0" cy="0" rx="180" ry="55"
          fill="none" stroke="rgba(163,230,53,0.18)" strokeDasharray="1 6"
          transform="rotate(-15)" />
      </svg>
    </div>
  )
}

function BrandTile({ brand }: { brand: Brand }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl shadow-lg"
      style={{
        width: 64,
        height: 64,
        background: brand.bg,
        color: brand.fg,
        transform: "translate(-50%, -50%)",
        boxShadow: brand.ring
          ? `0 0 0 2px ${brand.ring}, 0 6px 18px -6px rgba(0,0,0,0.45), 0 0 24px -6px rgba(163,230,53,0.55)`
          : "0 6px 18px -6px rgba(0,0,0,0.45)",
      }}
    >
      <span
        className="font-bold tracking-tight"
        style={{
          fontSize: brand.short.length >= 3 ? 13 : 18,
          letterSpacing: brand.short.length >= 3 ? "0.02em" : "-0.02em",
        }}
      >
        {brand.short}
      </span>
    </div>
  )
}
