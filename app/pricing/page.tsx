"use client"

import { useRef } from "react"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import {
  RocketLaunchIcon,
  ShieldCheckIcon,
  ServerStackIcon,
  BoltIcon,
  CloudIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  CircleStackIcon,
  WrenchScrewdriverIcon,
  CodeBracketSquareIcon,
  CubeTransparentIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid"
import { useTheme } from "@/lib/useTheme"
import Navbar from "@/components/Navbar"

const CHECK = (
  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const FREE_FEATURES = [
  { icon: CubeTransparentIcon,     text: "Unlimited projects" },
  { icon: WrenchScrewdriverIcon,   text: "Unlimited pipelines" },
  { icon: CodeBracketSquareIcon,   text: "Full visual pipeline editor" },
  { icon: CircleStackIcon,         text: "Docker & Git integrations" },
  { icon: ChatBubbleLeftRightIcon, text: "Community support" },
  { icon: LockClosedIcon,          text: "Your infrastructure, your data" },
]

const CLOUD_FEATURES = [
  { icon: ShieldCheckIcon,         text: "Everything in Self-Hosted" },
  { icon: CloudIcon,               text: "Managed cloud workers" },
  { icon: BoltIcon,                text: "Zero-maintenance builds" },
  { icon: CpuChipIcon,             text: "Auto-scaling compute" },
  { icon: ChatBubbleLeftRightIcon, text: "Priority support" },
  { icon: ServerStackIcon,         text: "No servers to manage" },
]

export default function PricingPage() {
  const { dark, toggle } = useTheme()

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start 10%"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 45, damping: 10, restDelta: 0.001 })

  const headingOpacity = useTransform(progress, [0, 0.3], [0, 1])
  const headingY       = useTransform(progress, [0, 0.3], [80, 0])
  const card1Opacity   = useTransform(progress, [0.1, 0.5], [0, 1])
  const card1Y         = useTransform(progress, [0.1, 0.5], [50, 0])
  const card2Opacity   = useTransform(progress, [0.2, 0.6], [0, 1])
  const card2Y         = useTransform(progress, [0.2, 0.6], [50, 0])

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] text-gray-900 dark:text-white transition-colors">
      <Navbar dark={dark} onToggle={toggle} />

      {/* Hero */}
      <section className="pt-36 sm:pt-44 pb-6 px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.1, 0.35, 1] }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary mb-3">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5">
            Start free.{" "}
            <span className="text-gray-400 dark:text-gray-500">Scale when ready.</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Self-host Bobby with unlimited everything at no cost.
            Cloud workers are on the way for when you want us to handle the infra.
          </p>
        </motion.div>
      </section>

      {/* Cards */}
      <section ref={sectionRef} className="px-5 md:px-12 pb-32 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* ── Self-Hosted (Free) ──────────────────────────────────────── */}
          <motion.div
            style={{ opacity: card1Opacity, y: card1Y }}
            className="relative rounded-3xl p-8 flex flex-col
                       border border-gray-200/80 dark:border-white/[0.07]
                       bg-gray-50/60 dark:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1db954]/10">
                <ServerStackIcon className="w-5 h-5 text-[#1db954]" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Self-Hosted</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">On-premise deployment</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-extrabold tracking-tight">Free</span>
              <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">forever</span>
            </div>

            <ul className="flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-300 mb-10 flex-1">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-[#1db954] shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <button
              onClick={() => { window.location.href = "/account" }}
              className="w-full py-3.5 rounded-full text-sm font-bold
                         border border-gray-300 dark:border-white/[0.12]
                         text-gray-900 dark:text-white
                         hover:bg-gray-100 dark:hover:bg-white/[0.06]
                         transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started
            </button>
          </motion.div>

          {/* ── Cloud Workers (Coming Soon) ─────────────────────────────── */}
          <motion.div
            style={{ opacity: card2Opacity, y: card2Y }}
            className="relative rounded-3xl p-8 flex flex-col
                       border border-primary/30
                       bg-gray-50/60 dark:bg-white/[0.02]
                       overflow-hidden"
          >
            {/* Top glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100"
              style={{ background: "radial-gradient(ellipse at 50% 0%,rgb(var(--primary-400) / 0.06) 0%,transparent 60%)" }}
            />

            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                <RocketLaunchIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Cloud Workers</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Managed infrastructure</p>
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full
                               bg-primary/10 text-primary border border-primary/20">
                Coming soon
              </span>
            </div>

            <div className="relative mb-8">
              <span className="text-5xl font-extrabold tracking-tight text-gray-300 dark:text-gray-500">TBD</span>
              <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">/ month</span>
            </div>

            <ul className="relative flex flex-col gap-4 text-sm text-gray-600 dark:text-gray-300 mb-10 flex-1">
              {CLOUD_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-[18px] h-[18px] mt-0.5 text-primary shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="relative w-full py-3.5 rounded-full text-sm font-bold text-black
                         transition-all cursor-not-allowed opacity-60"
              style={{ background: "rgb(var(--primary-400))" }}
            >
              Notify me
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 md:px-12 py-8 border-t border-gray-200/50 dark:border-white/[0.05]">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-0.5 px-2 mr-1">
            <div className="w-6 h-6 flex items-center justify-center -mt-0.5">
              <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Bobby</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">&copy; 2025 Bobby. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
