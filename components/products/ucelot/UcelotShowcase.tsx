"use client"

import { Fragment, useRef } from "react"
import Image from "next/image"
import { ArrowPathIcon, CommandLineIcon, ShieldCheckIcon } from "@heroicons/react/24/outline"
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion"
import Navbar from "@/components/Navbar"
import SiteFooter from "@/components/SiteFooter"
import PixelGradient from "@/components/PixelGradient"
import { useTheme } from "@/lib/useTheme"
import { UCELOT_URL } from "@/lib/products"
import AssemblyCinematic from "./AssemblyCinematic"
import TimelineSection from "./TimelineSection"
import AmbientBackground, { EMBER_FIELD } from "./AmbientBackground"

// ─── Ucelot — product showcase ────────────────────────────────────────────────
// An Apple-style product page in Ucelot's own palette (midnight + ember). It is
// always dark, whatever the site theme. It opens with a scroll-pinned camera
// glide over the real dashboard (./AssemblyCinematic), then shows the timeline planner building
// its plan (./TimelineSection). Screens are faithful recreations of the real UI
// (./app/screens).

const DOCS_URL = `${UCELOT_URL}/docs`
const EASE = [0.22, 1, 0.36, 1] as const

const inView = (delay = 0, y = 32) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px -12% 0px" },
  transition: { duration: 0.8, ease: EASE, delay },
})

function Ember({ children }: { children: React.ReactNode }) {
  return <span className="text-[#f59a42]">{children}</span>
}

function PrimaryCTA({ children = "Open Ucelot" }: { children?: React.ReactNode }) {
  return (
    <a
      href={UCELOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-[#e9730f] px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#ff8a24]"
    >
      {children}
    </a>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[15px] font-semibold text-[#ffc068] hover:underline">
      {children} ›
    </a>
  )
}

// ─── Hero (headline; the dashboard build follows below) ──────────────────────

// The ember field behind the hero lives in the shared AmbientBackground, so it
// runs on into the dashboard build without a seam.
function Hero() {
  return (
    <section className="relative flex min-h-[86vh] items-center justify-center overflow-hidden px-5 pb-16 pt-32 md:px-12">
      <div className="relative max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-6 flex items-center justify-center gap-3"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b2444] p-2 ring-1 ring-white/10">
            <Image src="/products/ucelot/mark.svg" alt="" width={24} height={23} />
          </span>
          <span className="text-lg font-bold tracking-tight">Ucelot</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.08 }}
          className="text-[clamp(2.6rem,7vw,5.75rem)] font-bold leading-[1.0] tracking-tight"
        >
          The issue tracker
          <br />
          that <Ember>reads your code.</Ember>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#9ba4c4] md:text-xl"
        >
          Ucelot knows how your codebase fits together. Every issue arrives with the files and lines behind it, and why they matter.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          <PrimaryCTA />
          <TextLink href={DOCS_URL}>Read the docs</TextLink>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Statement (scroll-revealed) ──────────────────────────────────────────────
// The words light up one by one as you scroll, and glow as they do — as if the
// text were lit from within against the black. Each word carries a fixed white
// glow and only its opacity animates, so the glow switches on with the word
// without repainting anything per frame. A faint white halo behind the block
// brightens as the sentence fills in.

// Bright white core → soft bloom → wide, faint bloom.
const GLOW = "0 0 1px rgba(255,255,255,0.6), 0 0 16px rgba(255,255,255,0.35), 0 0 42px rgba(255,255,255,0.18), 0 0 90px rgba(255,255,255,0.08)"

function Word({ children, progress, range, glow }: { children: string; progress: MotionValue<number>; range: [number, number]; glow: boolean }) {
  const opacity = useTransform(progress, range, [0.1, 1])
  return <motion.span style={{ opacity, textShadow: glow ? GLOW : undefined }}>{children} </motion.span>
}

function Statement() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] })
  // Only the second sentence glows: the calls are yours.
  const [plain, lit] = ["Ucelot reads the code.", "You make the calls."]
  const words = `${plain} ${lit}`.split(" ")
  const litFrom = plain.split(" ").length
  const span = 0.75 / words.length
  const halo = useTransform(scrollYProgress, [0.05, 0.85], reduce ? [1, 1] : [0, 1])

  return (
    <section ref={ref} className="relative h-[170vh] px-5 md:px-12">
      <div className="sticky top-0 flex h-screen items-center">
        <motion.div
          aria-hidden
          style={{ opacity: halo }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_38%_at_50%_52%,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_45%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-8 text-[clamp(1.1rem,2vw,1.4rem)] font-semibold text-[#ffb067]">Great products still need you.</p>
          <p className="text-[clamp(2.4rem,6vw,5rem)] font-bold leading-[1.08] tracking-tight text-[#f6f7fb]">
            {reduce ? (
              <>
                {plain}
                <br />
                <span style={{ textShadow: GLOW }}>{lit}</span>
              </>
            ) : (
              words.map((w, i) => (
                <Fragment key={i}>
                  <Word progress={scrollYProgress} range={[0.08 + i * span, 0.08 + (i + 1) * span]} glow={i >= litFrom}>
                    {w}
                  </Word>
                  {/* each sentence on its own line */}
                  {w.endsWith(".") && i < words.length - 1 && <br />}
                </Fragment>
              ))
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Features: what else you get ──────────────────────────────────────────────
// Apple-style card grid: each card says one thing, with a line icon, a big
// statement or a real product shot. Grey text with the key phrase lifted in
// white. Shots are real Ucelot UI, captured at 3× from bobby-tracker's preview
// pages (/preview/showcase, /preview/note-findings) into
// /public/products/ucelot/features.

type Feature = {
  text: React.ReactNode
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
  stat?: { above: string; big: string; below: string }
  shot?: Shot
}

type Shot = {
  src: string
  alt: string
  width: number // natural size (CSS px at 1×)
  height: number
  radius: number // the captured panel's corner radius at 1×, clipped off cleanly
  // bleed: wide, anchored left and running off the card's right edge;
  // drop: centred, running off the card's bottom edge
  layout: "bleed" | "drop"
}

const Hi = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-[#f6f7fb]">{children}</span>

const FEATURES: Feature[] = [
  {
    text: <>Issues written from <Hi>your actual code</Hi>, with the files to prove it.</>,
    shot: {
      src: "/products/ucelot/features/issue-places.png",
      alt: "Ucelot's suggested places to look: total.ts line 42, applyDiscount(), high confidence, with the reason the discount never reaches the cart total",
      width: 658, height: 325, radius: 14, layout: "bleed",
    },
  },
  {
    text: <>Every repository is read in <Hi>its own isolated workspace</Hi>.</>,
    icon: ShieldCheckIcon,
  },
  {
    text: <>Works with <Hi>your coding agent</Hi> over MCP.</>,
    icon: CommandLineIcon,
  },
  {
    text: <><Hi>Re-read on every push</Hi>, so answers never go stale.</>,
    icon: ArrowPathIcon,
  },
  {
    text: <>Notes that <Hi>check themselves</Hi> against your sources.</>,
    shot: {
      src: "/products/ucelot/features/note-signals.png",
      alt: "Ucelot's document signals for a note: a conflict between the deck and the finance plan, a task with no owner, an incomplete rule, and a supported decision",
      width: 310, height: 642, radius: 32, layout: "drop",
    },
  },
  {
    text: null,
    stat: { above: "Nothing to", big: "install.", below: "No agent on your machines." },
  },
]

// The shot sits in the card's lower part and is cut by the card's own edge.
// Its width is a share of the card (the card is a size container, so cqw is
// card width) and its corner radius scales with it.
function ShotImage({ shot }: { shot: Shot }) {
  const bleed = shot.layout === "bleed"
  const share = bleed ? 1.5 : 0.7 // shot width ÷ card width
  return (
    <div className="relative mt-7 w-full flex-1">
      <div
        className={"absolute top-0 overflow-hidden shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] " + (bleed ? "left-[9%]" : "left-1/2 -translate-x-1/2")}
        style={{ width: `${share * 100}%`, aspectRatio: `${shot.width} / ${shot.height}`, borderRadius: `${((shot.radius / shot.width) * share * 100).toFixed(3)}cqw` }}
      >
        <Image src={shot.src} alt={shot.alt} fill sizes={`(min-width: 1024px) ${Math.round(share * 380)}px, ${Math.round(share * 90)}vw`} className="object-cover" />
      </div>
    </div>
  )
}

// Static on purpose: the cards are already on screen when the timeline's stage
// lets go, so an entry animation would only read as lag.
function FeatureCard({ f }: { f: Feature }) {
  const Icon = f.icon
  return (
    <div
      className="relative flex aspect-[1.12] flex-col [container-type:inline-size] items-center overflow-hidden rounded-[28px] bg-[#05060e] text-center text-[clamp(1.15rem,1.55vw,1.4rem)] font-medium leading-[1.36] text-[#8a93b5]"
    >
      {f.stat ? (
        <div className="m-auto px-8">
          <p>{f.stat.above}</p>
          <p className="my-1 text-[clamp(3rem,5vw,4.25rem)] font-bold leading-[1.1] tracking-tight text-[#f6f7fb]">{f.stat.big}</p>
          <p>{f.stat.below}</p>
        </div>
      ) : f.shot ? (
        <>
          <p className="max-w-[22ch] px-8 pt-9">{f.text}</p>
          <ShotImage shot={f.shot} />
        </>
      ) : (
        <div className="m-auto flex flex-col items-center px-9">
          {Icon && <Icon aria-hidden strokeWidth={1.1} className="mb-7 h-16 w-16 text-[#f6f7fb]" />}
          <p className="max-w-[24ch]">{f.text}</p>
        </div>
      )}
    </div>
  )
}

function Features() {
  return (
    // Like the reference: a lifted panel holds the grid and the cards sit back
    // in it, a step darker than the page, so they read as cut-outs.
    // Stacks above the timeline's stage, which it meets as that one lets go.
    <section className="relative z-10 px-3 py-24 sm:px-5 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px] rounded-[32px] bg-[#121527] px-4 py-14 ring-1 ring-white/[0.04] sm:px-8 md:rounded-[44px] md:px-[6%] md:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.h2 {...inView()} className="mb-12 text-[clamp(2.2rem,4.4vw,3.6rem)] font-semibold leading-[1.08] tracking-tight md:mb-16">
            <span className="text-[#8a93b5]">Here&apos;s what else you get</span>
            <br />
            <span className="text-[#f6f7fb]" style={{ textShadow: GLOW }}>with Ucelot.</span>
          </motion.h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} f={f} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Closing ──────────────────────────────────────────────────────────────────

function Closing() {
  return (
    <section className="relative overflow-hidden px-5 pb-40 pt-32 md:px-12 md:pt-44">
      <div className="pointer-events-none absolute inset-0">
        <PixelGradient stops={EMBER_FIELD} metric="circle" tiltDeg={0} anchorX={0.5} anchorY={1.15} tilePx={34} tileAspect={1.1} bloomStart={0} bloomEnd={0.7} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#05060e] to-transparent" />
      <motion.div {...inView()} className="relative mx-auto max-w-3xl text-center">
        <span className="mx-auto mb-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1b2444] p-3 ring-1 ring-white/10">
          <Image src="/products/ucelot/mark.svg" alt="" width={40} height={38} />
        </span>
        <h2 className="text-[clamp(2.6rem,7vw,5.5rem)] font-bold leading-[1.0] tracking-tight">
          Let Ucelot do <Ember>the reading.</Ember>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#dfe3f2]">
          Made for teams who&apos;d rather read code than guess.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <PrimaryCTA />
          <TextLink href={DOCS_URL}>Read the docs</TextLink>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UcelotShowcase() {
  const { dark, toggle } = useTheme()
  // The dashboard build's progress, for the shared background to follow.
  const story = useMotionValue(0)
  return (
    // `dark` scopes the shared navbar/footer to their dark styling on this page;
    // `isolate` keeps the fixed ambient background above the page colour and
    // below every section.
    <div className="dark relative isolate min-h-screen bg-[#05060e] text-[#eceff8] [color-scheme:dark]">
      <AmbientBackground story={story} />
      <Navbar dark={dark} onToggle={toggle} />
      <main>
        <Hero />
        <AssemblyCinematic story={story} />
        <Statement />
        <TimelineSection />
        <Features />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  )
}
