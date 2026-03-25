"use client"

import { useRef, useState, useEffect } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useAnimation,
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

// ─── Tile config ──────────────────────────────────────────────────────────────

const TILE_CONFIGS = [
  { id: 0, color: "#1db954", Icon: CodeBracketIcon,  shape: "roundedSq" },
  { id: 1, color: "#f5a623", Icon: Cog6ToothIcon,    shape: "roundedSq" },
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
  const swapControls = useAnimation()

  // Phase 2 — staggered rise (left → right)
  const riseStart = 0.28 + displayIndex * 0.04
  const riseEnd   = riseStart + 0.22
  const tileY = useTransform(scrollYProgress, [riseStart, riseEnd], [0, -riseAmount])

  // Phase 3 — staggered pop out (left → right)
  const popStart   = 0.62 + displayIndex * 0.05
  const popEnd     = popStart + 0.07
  const popScale   = useTransform(scrollYProgress, [popStart, popEnd], [1, 0])
  const popOpacity = useTransform(scrollYProgress, [popStart, popEnd + 0.01], [1, 0])

  // Random swap animation
  useEffect(() => {
    if (isShrinking) {
      swapControls.start({ scale: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } })
    } else {
      swapControls.start({ scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } })
    }
  }, [isShrinking]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      style={{ y: tileY, scale: popScale, opacity: popOpacity }}
      className="flex-shrink-0"
    >
      <motion.div
        animate={swapControls}
        initial={{ scale: 1 }}
        className="w-[80px] h-[80px] sm:w-[104px] sm:h-[104px] md:w-[138px] md:h-[138px] lg:w-[180px] lg:h-[180px]
                   flex items-center justify-center"
        style={{ backgroundColor: tile.color, ...SHAPE_STYLE[tile.shape] }}
      >
        <tile.Icon className="w-10 h-10 sm:w-[48px] sm:h-[48px] md:w-[62px] md:h-[62px] lg:w-[80px] lg:h-[80px] text-black/80" />
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

  // Stop swaps during the pop phase
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      pausedRef.current = v > 0.56
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

function Navbar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.1, 0.35, 1] }}
        className="flex items-center gap-1 px-2 py-1.5 rounded-full
                   bg-[#111]/90 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/30"
      >
        <div className="flex items-center gap-1.5 px-2 mr-1">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}
          >
            <span className="text-white text-[10px] font-bold leading-none">B</span>
          </div>
          <span className="text-white text-sm font-semibold tracking-tight">Bobby</span>
        </div>

        {/* Nav links — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {["Features", "Docs", "Pricing", "FAQ"].map((l) => (
            <button
              key={l}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-full
                         hover:bg-white/[0.06] transition-colors"
            >
              {l}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-full
                     text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs ml-1"
          aria-label="Toggle theme"
        >
          {dark ? "○" : "●"}
        </button>

        {/* CTA */}
        <button
          onClick={() => router.push("/account")}
          className="ml-1 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-black
                     transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          style={{ background: "#a3e635" }}
        >
          Get started
        </button>
      </motion.div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: "⚡", title: "Zero Config",       desc: "Bobby reads your codebase and sets up the entire pipeline. Not a single YAML file." },
  { icon: "🚫", title: "Zero Code",         desc: "No Dockerfiles. No CI scripts. Push to git and your app ships itself." },
  { icon: "🚀", title: "Instant Deploy",    desc: "From commit to live in seconds. Built for speed at every step." },
  { icon: "🔒", title: "Secure by Default", desc: "Isolated build envs, encrypted secrets, signed artifacts — always on." },
  { icon: "📡", title: "Live Streaming",    desc: "Watch every build happen in real time. No polling, no mystery." },
  { icon: "🔗", title: "Git Native",        desc: "Connect any GitHub, GitLab, or Bitbucket repo in one click." },
]

function FeatureCard({ icon, title, desc, index }: { icon: string; title: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl p-6 border border-gray-200/80 dark:border-white/[0.07]
                 bg-white/60 dark:bg-white/[0.02]
                 hover:border-indigo-200 dark:hover:border-indigo-500/25
                 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/[0.04]
                 transition-all duration-300"
    >
      <div className="text-2xl mb-3 select-none">{icon}</div>
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
  const [riseAmount, setRiseAmount] = useState(140)
  const [tileCount, setTileCount]   = useState(5)   // 3 on mobile, 5 on sm+

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth
      setTileCount(vw < 640 ? 3 : 5)
      if (!tilesWrapRef.current) return
      const rect = tilesWrapRef.current.getBoundingClientRect()
      const vh = window.innerHeight
      setRiseAmount(Math.max(30, rect.top + rect.height / 2 - vh / 2))
    }
    // Delay initial measurement until after entrance animations settle
    const t = setTimeout(measure, 1200)
    window.addEventListener("resize", measure)
    return () => { clearTimeout(t); window.removeEventListener("resize", measure) }
  }, [])

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  })

  // ── Phase 1a: title fades first ────────────────────────────────────────────
  const titleOpacity = useTransform(scrollYProgress, [0.10, 0.26], [1, 0])
  const titleY       = useTransform(scrollYProgress, [0.10, 0.26], [0, -65])
  const titleScale   = useTransform(scrollYProgress, [0.10, 0.26], [1, 0.88])

  // ── Phase 1b: subtext fades after title ────────────────────────────────────
  const subtextOpacity = useTransform(scrollYProgress, [0.18, 0.34], [1, 0])
  const subtextY       = useTransform(scrollYProgress, [0.18, 0.34], [0, -50])
  const subtextScale   = useTransform(scrollYProgress, [0.18, 0.34], [1, 0.92])

  // ── Background parallax ────────────────────────────────────────────────────
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setDark(mq.matches)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="bg-white dark:bg-[#080808] text-gray-900 dark:text-white">
      <Navbar dark={dark} onToggle={() => setDark((d) => !d)} />

      {/*
        ── Hero ──────────────────────────────────────────────────────────────
        Height = 100vh + 1800px  →  sticky scroll range is always 1800px,
        consistent across viewport sizes. offset "end end" maps progress
        0→1 exactly over that 1800px sticky window.

          0.10 – 0.32  │ Phase 1: text fades up + scales down     (~396px)
          0.28 – 0.62  │ Phase 2: tiles rise to center, L→R       (~612px)
          0.62 – 0.88  │ Phase 3: tiles pop out,        L→R       (~468px)
        ─────────────────────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ height: "calc(100vh + 1800px)" }}>
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
          <div className="relative h-full flex flex-col justify-center sm:justify-start items-start sm:items-center px-5 md:px-12 pt-[88px] sm:pt-[128px]"
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
                className="mt-8 sm:mt-10"
              >
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 0.1, 0.35, 1], delay: 0.30 }}
                  className="text-sm md:text-base text-gray-400 dark:text-gray-500
                             max-w-sm leading-relaxed"
                >
                  Zero config. Zero code.<br />
                  Bobby ships your projects the moment you push.
                </motion.p>
              </motion.div>

            </div>

            {/* Spacer: sm+ only — pushes tiles to bottom on desktop */}
            <div className="hidden sm:block flex-1" />

            {/* Phase 2 & 3 – Tiles */}
            <motion.div
              ref={tilesWrapRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.42 }}
              className="mt-8 sm:mt-0"
            >
              <TileRow scrollYProgress={scrollYProgress} riseAmount={riseAmount} count={tileCount} />
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="px-5 md:px-12 pb-32 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
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
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <section className="px-5 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }} />
            <span className="text-sm font-semibold">Bobby</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">© 2025 Bobby. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
