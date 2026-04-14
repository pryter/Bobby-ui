"use client"

import { useEffect, useRef, useState } from "react"

// ── Brand marks ──────────────────────────────────────────────────────────────
// Each brand maps to a simple-icons CDN slug so we get the real platform logo
// instead of a two-letter placeholder. The tile background flips to the brand
// colour; the logo itself is always pulled white from the CDN for contrast.
type Brand = {
  name: string
  slug: string | null    // simple-icons slug, or null to render a letter badge
  letter?: string        // fallback glyph when no slug
  bg: string             // tile background — brand colour
  fg?: string            // letter colour (only for slug=null tiles)
  ring?: string          // optional accent ring (Bobby tile only)
}

const BRANDS: Brand[] = [
  { name: "GitHub",      slug: "github",          bg: "#0d1117" },
  { name: "GitLab",      slug: "gitlab",          bg: "#fc6d26" },
  { name: "Bitbucket",   slug: "bitbucket",       bg: "#2684ff" },
  { name: "Docker",      slug: "docker",          bg: "#0db7ed" },
  { name: "Kubernetes",  slug: "kubernetes",      bg: "#326ce5" },
  { name: "AWS",         slug: "amazonwebservices", bg: "#232f3e" },
  { name: "GCP",         slug: "googlecloud",     bg: "#1a73e8" },
  { name: "Terraform",   slug: "terraform",       bg: "#7b42bc" },
  { name: "Postgres",    slug: "postgresql",      bg: "#336791" },
  { name: "Slack",       slug: "slack",           bg: "#4a154b" },
  { name: "Discord",     slug: "discord",         bg: "#5865f2" },
  { name: "npm",         slug: "npm",             bg: "#cb3837" },
  { name: "Bobby",       slug: null, letter: "B", bg: "#a3e635", fg: "#111111", ring: "#ffffff" },
]

// ── Fibonacci sphere layout ──────────────────────────────────────────────────
// Even distribution of N points on a sphere. Using the golden-angle spiral so
// no cluster looks denser than another as the orb rotates.
function sphereLayout(
  n: number,
  rx: number,
  ry: number,
  rz: number,
) {
  const pts: { x: number; y: number; z: number }[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2            // y from 1 to -1
    const r = Math.sqrt(1 - y * y)             // ring radius at this height
    const theta = golden * i
    pts.push({
      x: Math.cos(theta) * r * rx,
      y: y * ry,
      z: Math.sin(theta) * r * rz,
    })
  }
  return pts
}

// ── IntegrationsOrb ──────────────────────────────────────────────────────────
//
// CSS-3D rotating sphere of brand tiles. Rendered "in the wild" — no card
// frame around it — so it feels like a living graphic on the page rather
// than a screenshot.
export default function IntegrationsOrb() {
  const [angle, setAngle] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    // ~28s per full rotation feels unhurried but clearly alive.
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

  // Ellipsoid — stretched horizontally so the orb reads as a wide band of
  // icons rather than a tight ball. Y is kept short; Z matches Y so depth
  // cues (scale + opacity) still feel volumetric.
  const rx = 260
  const ry = 110
  const rz = 110
  const points = sphereLayout(BRANDS.length, rx, ry, rz)

  return (
    <div
      className="relative h-full w-full"
      style={{ perspective: "900px" }}
    >
      {/* Soft center highlight — the one bit of ambience we keep now that the
          outer card frame is gone. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2
                   rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(163,230,53,0.30), transparent 70%)" }}
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
              const depth = (p.z + rz) / (2 * rz) // 0 (back) → 1 (front)
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
        viewBox="-320 -160 640 320"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[640px] -translate-x-1/2 -translate-y-1/2 opacity-50"
      >
        <ellipse cx="0" cy="0" rx="290" ry="55"
          fill="none" stroke="rgba(163,230,53,0.35)" strokeDasharray="2 5" />
        <ellipse cx="0" cy="0" rx="265" ry="40"
          fill="none" stroke="rgba(163,230,53,0.22)" strokeDasharray="1 4"
          transform="rotate(10)" />
        <ellipse cx="0" cy="0" rx="300" ry="70"
          fill="none" stroke="rgba(163,230,53,0.18)" strokeDasharray="1 6"
          transform="rotate(-8)" />
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
        transform: "translate(-50%, -50%)",
        boxShadow: brand.ring
          ? `0 0 0 2px ${brand.ring}, 0 6px 18px -6px rgba(0,0,0,0.45), 0 0 24px -6px rgba(163,230,53,0.55)`
          : "0 6px 18px -6px rgba(0,0,0,0.45)",
      }}
    >
      {brand.slug ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`https://cdn.simpleicons.org/${brand.slug}/ffffff`}
          alt={brand.name}
          width={32}
          height={32}
          loading="lazy"
          style={{ width: 32, height: 32 }}
        />
      ) : (
        <span
          className="font-bold text-2xl tracking-tight"
          style={{ color: brand.fg ?? "#ffffff" }}
        >
          {brand.letter}
        </span>
      )}
    </div>
  )
}
