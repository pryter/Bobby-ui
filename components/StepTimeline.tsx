"use client"

// ─── Step timeline (archived) ─────────────────────────────────────────────────
// The scroll-driven step-by-step section that used to sit on the landing page
// ("How we work"). It is not rendered anywhere right now — kept here so product
// pages can reuse it with their own steps.
//
// Usage:
//   <DeepDiveNavContext.Provider value={{ compact, setCompact }}>
//     <Navbar … />
//     <StepTimeline steps={MY_STEPS} eyebrow="How it works" title="From repo" mutedTitle="to answer." />
//   </DeepDiveNavContext.Provider>
//
// The provider lets the mobile nav collapse while the timeline pill is showing.
// The mobile timeline renders exactly four rows (see MobileTimeline), so pass
// four steps.

import { useRef, useState, useEffect, useLayoutEffect, useContext } from "react"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useMotionTemplate,
  useMotionValue,
  animate,
  MotionValue,
} from "framer-motion"
import {
  LightBulbIcon,
  BeakerIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid"
import { DeepDiveNavContext } from "@/components/Navbar"
import StatusBadge from "@/components/products/StatusBadge"
import { ACTIVE_PRODUCTS } from "@/lib/products"

export type Step = {
  eyebrow: string
  title: string
  desc: string
  bullets: string[]
  Visual: React.ComponentType
}


// Shared shell for the small cards that sit beside each step's copy.
function StepCard({ label, Icon, children }: { label: string; Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div
      className="relative max-w-md overflow-hidden rounded-2xl border
                 border-gray-200 bg-white p-5 md:p-6
                 dark:border-white/[0.08] dark:bg-[#0c0c0c]"
    >
      {/* Ambient yellow glow — matches the accent used elsewhere on the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(closest-side, rgb(var(--primary-400) / 0.35), transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
            {label}
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

function QuestionsVisual() {
  const questions = [
    "How does a machine find the right knowledge?",
    "How do we know an answer is right?",
    "How fast can a reply feel human?",
  ]
  return (
    <StepCard label="Open questions" Icon={LightBulbIcon}>
      <ul className="space-y-2">
        {questions.map((q) => (
          <li key={q} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-primary" />
            {q}
          </li>
        ))}
      </ul>
    </StepCard>
  )
}

function ExperimentsVisual() {
  const runs = [
    { name: "Retrieval experiment", state: "running" },
    { name: "Answer quality check", state: "passed" },
    { name: "Response-time pass",   state: "passed" },
  ]
  return (
    <StepCard label="Experiments" Icon={BeakerIcon}>
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {runs.map((r) => (
          <li key={r.name} className="flex items-center justify-between py-2 text-sm text-gray-700 dark:text-gray-200">
            <span>{r.name}</span>
            {r.state === "running" ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> running
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4" /> passed
              </span>
            )}
          </li>
        ))}
      </ul>
    </StepCard>
  )
}

function ShippedVisual() {
  return (
    <StepCard label="Shipped from the lab" Icon={SparklesIcon}>
      <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {ACTIVE_PRODUCTS.map((p) => (
          <li key={p.slug} className="flex items-center justify-between gap-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-100">
            <span>{p.name}</span>
            <StatusBadge status={p.status} />
          </li>
        ))}
      </ul>
    </StepCard>
  )
}

function LoopVisual() {
  const stages = ["Research", "Prototype", "Ship", "Learn"]
  return (
    <StepCard label="The loop" Icon={ArrowPathIcon}>
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-100">
        {stages.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 dark:border-white/[0.08] dark:bg-white/[0.04]">{s}</span>
            {i < stages.length - 1 && <span className="text-gray-400">→</span>}
          </span>
        ))}
        <ArrowPathIcon className="ml-1 h-4 w-4 text-primary-600 dark:text-primary" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        What we learn from people using our products becomes the next research question.
      </p>
    </StepCard>
  )
}

// The lab story the landing page used — kept as the default/example steps.
export const LAB_STEPS: Step[] = [
  {
    eyebrow: "Step 01",
    title: "Ask a hard question",
    desc:
      "We start with problems we find genuinely hard: how a machine finds the right knowledge, understands it, and answers in a way people can trust — and talk to naturally.",
    bullets: [
      "Intelligence and retrieval-augmented generation (RAG)",
      "Answers grounded in sources you can check",
      "Fast, natural, human-like interaction",
    ],
    Visual: QuestionsVisual,
  },
  {
    eyebrow: "Step 02",
    title: "Build to learn",
    desc:
      "Ideas become working prototypes quickly. We test them on real code, real documents and real conversations — not toy benchmarks — and keep only what holds up.",
    bullets: [
      "Small, fast experiments",
      "Tested on real-world data",
      "Measured, not eyeballed",
    ],
    Visual: ExperimentsVisual,
  },
  {
    eyebrow: "Step 03",
    title: "Ship what works",
    desc:
      "When a prototype proves itself, it becomes a product. Ucelot, Component Zoo and the Conversation Engine all started as questions in the lab.",
    bullets: [
      "Products grow out of research",
      "Early access through public betas",
      "Real users from day one",
    ],
    Visual: ShippedVisual,
  },
  {
    eyebrow: "Step 04",
    title: "Feed it back",
    desc:
      "Every product sends lessons back to the lab. What people ask, where answers fall short and what feels slow shape the next round of research.",
    bullets: [
      "Feedback sets the research agenda",
      "Evaluation on every change",
      "Steady improvement over big launches",
    ],
    Visual: LoopVisual,
  },
]

export default function StepTimeline({
  steps = LAB_STEPS,
  eyebrow = "How we work",
  title = "From question",
  mutedTitle = "to product.",
}: {
  steps?: Step[]
  eyebrow?: string
  title?: string
  mutedTitle?: string
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const detailsColRef = useRef<HTMLDivElement>(null)
  const { setCompact } = useContext(DeepDiveNavContext)
  // Mobile-only scroll-pin buffer. A tall (~120vh) wrapper whose only job is
  // to consume scroll distance while the inline timeline morphs into the
  // pill. The MobileTimeline is rendered sticky inside it, so the user sees
  // the morph unfold without any detail content scrolling past.
  const morphBufferRef = useRef<HTMLDivElement>(null)
  const detailRefs = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)

  // Section progress — now tracked over the details column only, so the
  // mobile morph buffer above doesn't skew the per-step math.
  const { scrollYProgress } = useScroll({
    target: detailsColRef,
    offset: ["start start", "end end"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 80, damping: 22, restDelta: 0.001 })

  // Dedicated scroll tracker for the mobile morph. Goes 0 → 1 as the user
  // scrolls through the buffer, giving the inline→pill transition real
  // scroll distance instead of firing instantly behind the detail content.
  const { scrollYProgress: morphRawProgress } = useScroll({
    target: morphBufferRef,
    offset: ["start start", "end start"],
  })
  const morphProgress = useSpring(morphRawProgress, {
    stiffness: 120, damping: 24, restDelta: 0.001,
  })

  // ── Nav-compact signal ──────────────────────────────────────────────────
  // We want the mobile nav to collapse only while the timeline pill is
  // fully formed AND the deep-dive section is still on-screen. That's the
  // intersection of two independent signals:
  //   1. `morphPastShape` — morph progress has crossed ~0.88 (pill is formed)
  //   2. `sectionInView`  — section is still in viewport (so the pill is
  //      actually visible; once we scroll past, the pill exits with the
  //      sticky parent and the nav should come back in full form).
  const [sectionInView, setSectionInView] = useState(false)
  const [morphPastShape, setMorphPastShape] = useState(false)
  // `pastDeepDive` flips true once the reader has scrolled past the end of
  // step 4's content (the last DeepFeatureDetail's scroll spacer). From that
  // point on — even though the section itself still has pb-72 of trailing
  // padding — the mobile timeline pill should fade out and the nav should
  // return to its full (non-compact) form, since there's nothing more in the
  // timeline for the pill to navigate between.
  const [pastDeepDive, setPastDeepDive] = useState(false)
  const endSentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sectionRef.current) return
    const io = new IntersectionObserver(
      ([entry]) => setSectionInView(entry.isIntersecting),
      { threshold: 0 },
    )
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const el = endSentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // True once the sentinel is in view (we've scrolled down far enough
        // to see it at the bottom of the viewport, which happens right as
        // step 4's 340vh spacer ends) OR we've scrolled past it (top < 0).
        // Staying true in the "above" case matters so the pill doesn't
        // reappear if the user scrolls all the way to the next section.
        const crossed =
          entry.isIntersecting || entry.boundingClientRect.top < 0
        setPastDeepDive(crossed)
      },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useMotionValueEvent(morphProgress, "change", (v) => {
    // Threshold sits just under SHAPE (0.65) so the nav compacts in sync with
    // the pill fully forming.
    setMorphPastShape(v >= 0.63)
  })
  useEffect(() => {
    // Nav goes compact only while the pill is live: section must be in view,
    // morph past the shape threshold, AND we haven't yet scrolled past step
    // 4's end (otherwise the pill is fading out and nav should already be
    // recovering).
    setCompact(sectionInView && morphPastShape && !pastDeepDive)
  }, [sectionInView, morphPastShape, pastDeepDive, setCompact])
  // Safety: if DeepDiveSection unmounts mid-state, make sure the nav isn't
  // left stuck in compact mode.
  useEffect(() => {
    return () => setCompact(false)
  }, [setCompact])

  // Track which detail section is currently on stage. Each slice visually
  // hands off to the next at the lift-off point (local ≈ 0.72 → 1.0), which
  // sits around slice-fraction 0.9. Advancing active at v*total + 0.1 keeps
  // the highlighted step in sync with the content actually showing.
  useMotionValueEvent(progress, "change", (v) => {
    const total = steps.length
    const raw = v * total
    const i = Math.max(0, Math.min(total - 1, Math.floor(raw)))
    setActive(i)
  })

  const scrollTo = (i: number) => {
    const col = detailsColRef.current
    if (!col) return
    // Land the user at the "fully unfolded" moment of this step — after the
    // entry cascade has completed but before the lift-off/exit kicks in.
    // Local progress ≈ 0.55 sits cleanly in the pause plateau.
    const slice = 1 / steps.length
    const targetLocal = 0.55
    // local maps [start - 0.07*slice, end + 0.07*slice] → [0,1], so invert:
    const targetSectionProgress = (i - 0.07) * slice + targetLocal * 1.14 * slice
    const colTop = col.getBoundingClientRect().top + window.scrollY
    const scrollRange = col.offsetHeight - window.innerHeight
    const targetY = colTop + targetSectionProgress * scrollRange
    window.scrollTo({ top: targetY, behavior: "smooth" })
  }

  return (
    <section ref={sectionRef} className="relative px-5 md:px-12 pt-28 md:pt-20 pb-72">
      <div className="max-w-6xl mx-auto">
        {/* Section heading — desktop only. On mobile the heading is
            rendered inside the sticky morph frame below so it stays
            visible, frozen, while the timeline morphs into the pill. */}
        <motion.div
          className="hidden md:block max-w-2xl mb-20"
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 18 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary mb-3"
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 32 },
              shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
          >
            {title}{" "}
            <span className="text-gray-400 dark:text-gray-500">{mutedTitle}</span>
          </motion.h2>
        </motion.div>

        {/* ── Mobile sticky pill wrapper ───────────────────────────────────
            Direct child of `max-w-6xl` so it pins across the whole section
            — through the morph buffer *and* the details column below —
            instead of releasing when the morph finishes.
            The heading is rendered here too and fades/collapses during the
            morph, leaving the pill alone in the pinned row for the rest of
            the section.
            `top` is scroll-animated: starts at 80px (top-20) so the
            full-width list sits safely below the nav during PRE, then
            glides up to 20px (top-5) as the pill forms — landing on the
            nav's Y line by the time the wordmark + theme toggle have
            dropped out of the shrunken left pill, filling the empty
            space between [logo] and [Get started]. */}
        <MobileStickyWrapper
          morphProgress={morphProgress}
          pastDeepDive={pastDeepDive}
        >
          <MobileSectionHeading morphProgress={morphProgress} eyebrow={eyebrow} title={title} mutedTitle={mutedTitle} />
          <MobileTimeline
            features={steps}
            active={active}
            morphProgress={morphProgress}
            morphRawProgress={morphRawProgress}
            onJump={scrollTo}
          />
        </MobileStickyWrapper>

        {/* Morph buffer spacer — empty element that consumes the scroll
            distance used to drive `morphProgress`. Sits immediately after
            the sticky so the morph starts ~1 pill-height after the pill
            first pins. Desktop collapses it to zero. */}
        <div ref={morphBufferRef} className="md:hidden h-[140vh] mb-8" />

        <div className="grid md:grid-cols-12 gap-x-12 gap-y-16">
          {/* ── Left: sticky interactive timeline (desktop only) ──────────── */}
          <div className="hidden md:block md:col-span-4">
            <div className="md:sticky md:top-28">
              <div className="relative pl-8">
                {/* Vertical rail */}
                <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10" />
                {/* Yellow progress fill — height animates with scroll */}
                <motion.div
                  className="absolute left-[9px] top-2 w-px bg-primary origin-top"
                  style={{
                    height: useTransform(progress, [0, 1], ["0%", "100%"]),
                    boxShadow: "0 0 8px rgb(var(--primary-400) / 0.55)",
                  }}
                />
                <motion.ul
                  className="space-y-7"
                  initial="hidden"
                  whileInView="shown"
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ staggerChildren: 0.11, delayChildren: 0.1 }}
                >
                  {steps.map((f, i) => {
                    const isActive = active === i
                    const isDone = active > i
                    return (
                      <motion.li
                        key={i}
                        className="relative"
                        variants={{
                          hidden: { opacity: 0, x: -18 },
                          shown: {
                            opacity: 1,
                            x: 0,
                            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                          },
                        }}
                      >
                        {/* Dot */}
                        <button
                          onClick={() => scrollTo(i)}
                          className="absolute -left-8 top-1 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-colors duration-300"
                          style={{
                            background: isActive || isDone ? "rgb(var(--primary-400))" : "transparent",
                            borderWidth: 2,
                            borderColor: isActive || isDone ? "rgb(var(--primary-400))" : "rgb(229 231 235)",
                            boxShadow: isActive ? "0 0 0 6px rgb(var(--primary-400) / 0.18)" : "none",
                          }}
                          aria-label={`Jump to ${f.title}`}
                        >
                          {isDone && (
                            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 fill-gray-900">
                              <path d="M4.5 8.5 2 6l.9-.9 1.6 1.6L9.1 2 10 2.9z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => scrollTo(i)}
                          className="text-left w-full group"
                        >
                          <p className={
                            "text-[10px] font-bold uppercase tracking-[0.18em] mb-1 transition-colors duration-300 " +
                            (isActive
                              ? "text-primary-600 dark:text-primary"
                              : "text-gray-400 dark:text-gray-600")
                          }>
                            {f.eyebrow}
                          </p>
                          <h3 className={
                            "text-lg font-bold tracking-tight transition-colors duration-300 " +
                            (isActive
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300")
                          }>
                            {f.title}
                          </h3>
                        </button>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              </div>
            </div>
          </div>

          {/* ── Right: scrolling feature details ──────────────────────────── */}
          <div ref={detailsColRef} className="col-span-full md:col-span-8">
            {steps.map((f, i) => (
              <DeepFeatureDetail
                key={i}
                feature={f}
                index={i}
                total={steps.length}
                sectionProgress={progress}
                registerRef={(el) => { detailRefs.current[i] = el }}
              />
            ))}
            {/* End-of-timeline sentinel — IntersectionObserver above watches
                this div. Once it comes into view (i.e., step 4's scroll
                spacer has finished) the pill fades out and the nav exits
                compact mode. */}
            <div ref={endSentinelRef} aria-hidden className="h-0" />
          </div>
        </div>
      </div>
    </section>
  )
}

function DeepFeatureDetail({
  feature, index, total, sectionProgress, registerRef,
}: {
  feature: Step
  index: number
  total: number
  sectionProgress: MotionValue<number>
  registerRef: (el: HTMLDivElement | null) => void
}) {
  // Each detail owns a slice of the section's scroll range (e.g. 25% for 4 items).
  // We convert sectionProgress → localProgress in [0,1] scoped to this slice,
  // then drive a staggered cascade of element reveals within the slice.
  const slice = 1 / total
  const start = index * slice
  const end   = start + slice

  // Local progress: 0 just before the slice, 1 just after.
  // Extended by a small ±7% so enter/exit start slightly before/after the
  // exact slice — enough for a smooth handoff without bleeding far into
  // neighbouring slices (previously ±20% caused the last slice's exit to
  // complete well past the section's bottom, visually overlapping the next
  // page section).
  const local = useTransform(sectionProgress, [start - slice * 0.07, end + slice * 0.07], [0, 1])

  // Outer block fade + lift-off — lift-off pushed all the way to local 0.95
  // so the freeze window owns the bulk of the middle/late slice.
  const outerOpacity = useTransform(local, [0, 0.10, 0.95, 1],    [0, 1, 1, 0])
  const outerY       = useTransform(local, [0, 0.10, 0.95, 1],    [40, 0, 0, -90])

  // Per-element staggered reveals, keyed off localProgress.
  // Reveal cascade is compressed into the first ~30% of the slice so the text
  // lands quickly and the reader can move on to the visual — previously this
  // ran all the way to 0.48, which left the first half of the slice feeling
  // sluggish on slow scrolls. Image enters right after, and the rest of the
  // slice (~0.50 → 0.95) is dedicated to the image's showcase/freeze.
  const eyebrowOp   = useTransform(local, [0.04, 0.10],      [0, 1])
  const eyebrowY    = useTransform(local, [0.04, 0.10],      [20, 0])

  const titleOp     = useTransform(local, [0.06, 0.14],      [0, 1])
  const titleY      = useTransform(local, [0.06, 0.14],      [45, 0])

  const descOp      = useTransform(local, [0.10, 0.20],      [0, 1])
  const descY       = useTransform(local, [0.10, 0.20],      [35, 0])

  const bullet0Op   = useTransform(local, [0.18, 0.24],      [0, 1])
  const bullet0X    = useTransform(local, [0.18, 0.24],      [-24, 0])
  const bullet1Op   = useTransform(local, [0.21, 0.27],      [0, 1])
  const bullet1X    = useTransform(local, [0.21, 0.27],      [-24, 0])
  const bullet2Op   = useTransform(local, [0.24, 0.30],      [0, 1])
  const bullet2X    = useTransform(local, [0.24, 0.30],      [-24, 0])

  // Every step's visual is a small card that sits alongside the copy, so it
  // only fades in — no grow/freeze/centre choreography.
  const imgOp       = useTransform(local, [0.15, 0.30],      [0, 1])
  const imgY        = useTransform(local, [0.15, 0.30],      [40, 0])

  // Accent rail on the left of the text block — grows as you scroll through.
  // Pulled earlier (was [0.10, 0.55]) so it completes alongside the sped-up
  // text cascade instead of lingering long after the copy is done.
  const railScaleY  = useTransform(local, [0.05, 0.32],      [0, 1])

  const bulletOps = [bullet0Op, bullet1Op, bullet2Op]
  const bulletXs  = [bullet0X,  bullet1X,  bullet2X]

  return (
    // Outer scroll spacer — gives the slice enough scroll distance for the
    // entry animation to fully unfold. The actual content inside is pinned to
    // the viewport via `sticky`, so the user stays on the content while the
    // animation plays rather than scrolling past it.
    <div
      ref={registerRef}
      className="relative min-h-[340vh]"
    >
      <motion.div
        style={{ opacity: outerOpacity, y: outerY }}
        // `top-28` matches the left timeline column so STEP 0x and the
        // detail's own eyebrow sit on the same Y line. `justify-start` keeps
        // the content anchored to the top of the viewport instead of
        // centering it (which previously pushed the first detail down).
        className="sticky top-28 h-[calc(100vh-7rem)] flex flex-col justify-start gap-8 pb-12"
      >
        <div className="relative">
          {/* Yellow accent rail — scales in vertically as the section reveals */}
          <motion.div
            aria-hidden
            style={{ scaleY: railScaleY }}
            className="absolute -left-5 top-2 bottom-20 w-[2px] bg-primary origin-top rounded-full"
          />

          {/* Heading block (eyebrow + title) — stays visible while the image
              grows so the viewer always has context for what they're looking at. */}
          <motion.p
            style={{ opacity: eyebrowOp, y: eyebrowY }}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary mb-3"
          >
            {feature.eyebrow}
          </motion.p>
          <motion.h3
            style={{ opacity: titleOp, y: titleY }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            {feature.title}
          </motion.h3>

          {/* Supporting copy (description + bullets) */}
          <div>
            <motion.p
              style={{ opacity: descOp, y: descY }}
              className="text-gray-500 dark:text-gray-400 leading-relaxed text-base md:text-lg max-w-xl mb-6"
            >
              {feature.desc}
            </motion.p>
            <ul className="space-y-2 mb-8 max-w-xl">
              {feature.bullets.map((b, bi) => (
                <motion.li
                  key={b}
                  style={{ opacity: bulletOps[bi], x: bulletXs[bi] }}
                  className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300"
                >
                  <svg viewBox="0 0 16 16" className="w-4 h-4 mt-0.5 flex-none fill-primary">
                    <path d="M6.5 11.5 3 8l1.1-1.1 2.4 2.4L11.9 4 13 5.1z" />
                  </svg>
                  <span>{b}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Visual slot — a small card per step, sitting alongside the copy. */}
        <motion.div style={{ opacity: imgOp, y: imgY }}>
          <feature.Visual />
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── Mobile sticky wrapper ───────────────────────────────────────────────────
// Wraps the heading + timeline in one scroll-pinned container. Its sticky
// `top` is animated over morph progress so the pill migrates from the
// heading-safe 80px drop-down to the nav's 20px Y line — it glides into
// the gap the shrunken nav has just opened up in the middle of the row.
function MobileStickyWrapper({
  morphProgress,
  pastDeepDive,
  children,
}: {
  morphProgress: MotionValue<number>
  /** True once step 4 has been fully scrolled through. Fades the pill out
   *  so the reader isn't staring at a now-useless timeline stub through
   *  the section's trailing padding. */
  pastDeepDive: boolean
  children: React.ReactNode
}) {
  // Phased after the heading finishes collapsing (heading's gridTemplateRows
  // hits 0fr at morphProgress ≈ 0.65 = SHAPE) and after the nav's compact
  // signal fires (~0.63). Doing the climb in the [0.65 → 0.80] window means
  // the pill only migrates up once there's nothing above it to collide with
  // the nav — no fleeting overlap during the transition — and finishes well
  // before the buffer ends so the pill is locked in place by the time the
  // user reaches the first detail section.
  // Pre-morph top is 112 (pt-28) to match the section's mobile top padding
  // so the sticky pin is seamless — no jump from flow position to pinned
  // position — and gives the heading extra breathing room below the nav.
  const top = useTransform(morphProgress, [0.65, 0.80], [112, 20])
  return (
    // zIndex 30 sits below the fixed nav (z-60) so the timeline pill passes
    // under the nav rather than on top of it — the nav's logo and CTA stay
    // the dominant layer even when the pill shares their Y line.
    <motion.div
      style={{ top, position: "sticky", zIndex: 30 }}
      className="md:hidden"
      // Fade + lift out once the reader has finished step 4. pointerEvents
      // disable prevents stray taps on the invisible pill stub.
      animate={{
        opacity: pastDeepDive ? 0 : 1,
        y:       pastDeepDive ? -8 : 0,
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      initial={false}
    >
      <div style={{ pointerEvents: pastDeepDive ? "none" : "auto" }}>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Mobile section heading ──────────────────────────────────────────────────
// Shown inside the mobile sticky pill wrapper. Fades and collapses its own
// height as the morph progresses so once the pill is formed, the heading
// stops taking space in the sticky row — the pill sits alone at top-32 for
// the rest of the Deep Dive section.
function MobileSectionHeading({
  morphProgress, eyebrow, title, mutedTitle,
}: {
  morphProgress: MotionValue<number>
  eyebrow: string
  title: string
  mutedTitle: string
}) {
  // Match the MobileTimeline's PRE/RETRACT/SHAPE beats so the heading fades
  // alongside the list retract and finishes collapsing as the pill takes shape.
  const opacity = useTransform(morphProgress, [0.05, 0.30], [1, 0])
  const rows    = useTransform(morphProgress, [0.30, 0.65], ["1fr", "0fr"])
  return (
    <motion.div style={{ gridTemplateRows: rows }} className="grid">
      <motion.div style={{ opacity }} className="overflow-hidden min-h-0">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary mb-3">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {title}<br/>
            <span className="text-gray-400 dark:text-gray-500">{mutedTitle}</span>
          </h2>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Single timeline row ─────────────────────────────────────────────────────
// One row of the mobile timeline. Used to be inlined inside MobileTimeline's
// features.map(), but pulling it out into its own component (and rendering 4
// explicit instances) gives each row a stable identity, makes the animate
// props obviously bound to local props, and removes the indexed-closure
// edge cases that made the shrink behaviour unpredictable when the active
// step changed mid-morph.
function TimelineRow({
  step,
  feature,
  active,
  pillReady,
  expanded,
  dotSize,
  activeHalo,
  inactiveOpacity,
  inactiveRows,
  chevOpacity,
  onJump,
  onToggleExpand,
}: {
  step: number
  feature: Step
  active: number
  pillReady: boolean
  expanded: boolean
  dotSize: MotionValue<number>
  activeHalo: MotionValue<string>
  inactiveOpacity: MotionValue<number>
  inactiveRows: MotionValue<string>
  chevOpacity: MotionValue<number>
  onJump: (i: number) => void
  onToggleExpand: () => void
}) {
  const isActive = active === step
  const isDone = active > step
  const tween = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }

  // The button content is the same regardless of wrapper. Defining it once
  // here keeps the active/inactive branches identical apart from their
  // wrapper chrome — no chance of the two branches drifting in their
  // animate targets.
  const rowButton = (
    <motion.button
      onClick={() => onJump(step)}
      initial={false}
      animate={{
        paddingTop:    pillReady ? 3 : 14,
        paddingBottom: pillReady ? 3 : 14,
      }}
      transition={tween}
      className="flex w-full items-center gap-3 text-left"
      aria-label={`Jump to ${feature.title}`}
    >
      <motion.span
        className="flex-none rounded-full flex items-center justify-center"
        style={{
          width: dotSize,
          height: dotSize,
          background: isActive || isDone ? "rgb(var(--primary-400))" : "transparent",
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: isActive || isDone ? "rgb(var(--primary-400))" : "rgb(229 231 235)",
          boxShadow: isActive ? activeHalo : "none",
        }}
      >
        {isDone && (
          <motion.svg
            viewBox="0 0 12 12"
            initial={false}
            animate={{
              width:  pillReady ? 7 : 10,
              height: pillReady ? 7 : 10,
            }}
            transition={tween}
            className="fill-gray-900"
          >
            <path d="M4.5 8.5 2 6l.9-.9 1.6 1.6L9.1 2 10 2.9z" />
          </motion.svg>
        )}
      </motion.span>
      <span className="min-w-0 flex-1">
        {/* Eyebrow collapses to zero rows in pill state — grid row hits
            0fr, opacity hits 0, font goes to 0, so it leaves no baseline
            gap and the title sits centered on the dot. */}
        <motion.span
          initial={false}
          style={{gridTemplateRows: "1fr"}}
          transition={tween}
          className="grid"
        >
          <motion.span
            initial={false}
            style={{
              fontSize: pillReady ? 6 : 10,
            }}
            transition={tween}
            className={
              "block font-bold uppercase tracking-[0.18em] leading-none overflow-hidden min-h-0 mb-1 " +
              (isActive
                ? "text-primary-600 dark:text-primary"
                : "text-gray-400 dark:text-gray-600")
            }
          >
            {feature.eyebrow}
          </motion.span>
        </motion.span>
        <motion.span
          initial={false}
          style={{ fontSize: pillReady ? 14 : 18 }}
          transition={tween}
          className={
            "block font-bold tracking-tight truncate leading-tight " +
            (isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400")
          }
        >
          {feature.title}
        </motion.span>
      </span>
    </motion.button>
  )

  // Inactive row, post-pill: hand-off to expand-toggle driven dropdown.
  if (!isActive && pillReady) {
    return (
      <motion.li
        initial={false}
        animate={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="grid"
      >
        <div className="overflow-hidden min-h-0">{rowButton}</div>
      </motion.li>
    )
  }

  // Inactive row, pre-pill: scroll-driven retract.
  if (!isActive) {
    return (
      <motion.li
        style={{ opacity: inactiveOpacity, gridTemplateRows: inactiveRows }}
        className="grid"
      >
        <div className="overflow-hidden min-h-0">{rowButton}</div>
      </motion.li>
    )
  }

  // Active row: always visible. Once the pill is formed the chevron on the
  // right becomes the tap target for expand/collapse.
  return (
    <li className="relative">
      {rowButton}
      <motion.button
        type="button"
        style={{ opacity: chevOpacity }}
        onClick={(e) => {
          e.stopPropagation()
          onToggleExpand()
        }}
        disabled={!pillReady}
        aria-label={expanded ? "Collapse section navigation" : "Expand section navigation"}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg
          viewBox="0 0 12 12"
          className={"h-3 w-3 fill-current transition-transform " + (expanded ? "rotate-180" : "")}
        >
          <path d="M6 8.5 1.5 4l1.1-1.1L6 6.3l3.4-3.4L10.5 4z" />
        </svg>
      </motion.button>
    </li>
  )
}

// ─── Mobile timeline (floating right-edge pill) ──────────────────────────────
// Shown only on small screens. Sits sticky near the top of the Deep Dive
// section, aligned to the right edge. Collapsed state shows the currently
// active step as a compact pill; tapping expands the full list so the user
// can jump between steps without scrolling back up.
function MobileTimeline({
  features,
  active,
  morphProgress,
  morphRawProgress,
  onJump,
}: {
  features: Step[]
  active: number
  /** Spring-smoothed morph progress (0 → 1). Drives the pill chrome — bg,
   *  radius, padding, maxWidth — so those flow in smoothly. */
  morphProgress: MotionValue<number>
  /** Raw, un-smoothed scroll progress (0 → 1). Used to trigger pillReady
   *  without spring lag — the text/dot compaction runs its own time-based
   *  animation and doesn't want to wait for the spring to catch up, which
   *  would fire the trigger way late (user scrolled into step 2 before
   *  the smoothed value crossed the threshold). */
  morphRawProgress: MotionValue<number>
  onJump: (i: number) => void
}) {
  // ── Morph choreography ────────────────────────────────────────────────
  // One continuous in-place transformation — no flying element, no handoff
  // to a separate pill. The whole container collapses like a sidebar nav:
  //
  //   PRE → RETRACT:  inactive rows fade + collapse their row height, so
  //                   the list visually retracts around the active row.
  //   RETRACT → SHAPE: the surviving container shrinks horizontally
  //                   (right-aligned) and its surface morphs into a pill
  //                   (rounded, solid bg, border, shadow, tighter padding).
  //
  // After SHAPE the container IS the pill — same DOM node, same active row
  // content — just wrapped in pill-shaped chrome. Tapping it expands the
  // height back out to reveal all rows as a dropdown.
  // Beats are intentionally biased toward the early/mid portion of the buffer
  // scroll (rather than ending at ~0.90) so the morph visually completes well
  // before the user reaches the first detail section. The remaining ~35% of
  // buffer scroll after SHAPE gives the spring plenty of room to settle —
  // previously the morph finishing at 0.90 left only 14% of buffer for the
  // spring to catch up, so on fast scrolls the pill would still be shrinking
  // as the user entered step 2.
  const PRE     = 0.05
  const RETRACT = 0.30
  const SHAPE   = 0.65

  // Inactive rows collapse + fade first.
  const inactiveOpacity = useTransform(morphProgress, [PRE, RETRACT], [1, 0])
  const inactiveRows    = useTransform(morphProgress, [PRE, RETRACT], ["1fr", "0fr"])
  const railOpacity     = inactiveOpacity

  // Container shrink: parent is `flex justify-end`, so as we lower maxWidth
  // the container pulls in from the LEFT while its right edge stays pinned —
  // which is exactly the "collapse toward a right-side pill" feel.
  //
  // We measure the parent width so we can tween between real pixel values
  // (string-unit tweens like "100%" → "240px" don't interpolate smoothly in
  // framer-motion). The maxWidth transform below reads parentW reactively.
  const wrapperRef = useRef<HTMLDivElement>(null)
  const parentWRef = useRef(0)
  const [, forceRerender] = useState(0)
  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const w = el.offsetWidth
      if (w && w !== parentWRef.current) {
        parentWRef.current = w
        forceRerender((n) => n + 1)
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const PILL_W = 210 // px — final pill width
  const maxWidth = useTransform(morphProgress, (v) => {
    const t = Math.max(0, Math.min(1, (v - RETRACT) / (SHAPE - RETRACT)))
    const start = parentWRef.current || PILL_W
    return start * (1 - t) + PILL_W * t
  })

  // Surface morph: flat timeline → pill chrome. Using a modest 22px target
  // radius (rather than the full 9999 stadium) means the collapsed pill is
  // still fully-round at its compact ~36px height (22 > 18 = half-height),
  // while the taller expanded state reads naturally as a rounded rectangle
  // — no radius animation needed on expand/collapse.
  const radius       = useTransform(morphProgress, [RETRACT, SHAPE], [0, 22])
  const padX         = useTransform(morphProgress, [RETRACT, SHAPE], [0, 12])
  const padY         = useTransform(morphProgress, [RETRACT, SHAPE], [0, 6])
  const bgOpacity    = useTransform(morphProgress, [RETRACT, SHAPE], [0, 1])
  const shadowOp     = useTransform(morphProgress, [RETRACT, SHAPE], [0, 0.18])
  const boxShadow    = useMotionTemplate`0 8px 24px -8px rgba(0,0,0,${shadowOp})`
  // Chevron only appears once the pill is formed enough to read as a tap
  // target; before that it's just distracting.
  const chevOpacity  = useTransform(morphProgress, [RETRACT, SHAPE], [0, 1])

  // ── Row-level compaction ──────────────────────────────────────────────
  // Pre-morph values are tuned to match the DESKTOP timeline's typography +
  // spacing (dot 18px, eyebrow 10px, title 18px/text-lg, ~28px row gap via
  // 14px paddingY on each row). That way the mobile full-size list reads
  // exactly like the desktop one before the morph kicks in. During the
  // morph (RETRACT → SHAPE) each dimension tweens down to its compact pill
  // value so the finished pill is a single tight line.
  // Row-level compaction runs as its OWN time-based animation keyed off
  // `pillReady` rather than off scroll-driven morphProgress. The moment the
  // pill is formed, everything tweens to its compact target over ~0.3s,
  // independent of scroll velocity or spring settle.
  //
  // Two flavours for the two consumer patterns:
  //   • `dotSize` / `haloPx` stay motion values because `railLeft` and
  //     `activeHalo` read them reactively via motion-value computations.
  //     We drive them imperatively with framer's `animate()` in an effect.
  //   • Everything else is consumed once as a style prop, so we skip the
  //     motion-value plumbing and let the JSX use declarative `animate`
  //     props directly — simpler, obviously correct, no motion-value
  //     subscription to debug.
  const dotSize = useMotionValue(18)
  const haloPx  = useMotionValue(6)
  // Halo shadow for the active dot — amplitude shrinks with haloPx so it
  // matches the smaller compact dot.
  const activeHalo     = useMotionTemplate`0 0 0 ${haloPx}px rgb(var(--primary-400) / 0.18)`
  // Rail tracks the dot's horizontal center: padX (pill inner-left) plus half
  // the dot width, which itself shrinks with the compaction above.
  const railLeft       = useTransform(() => padX.get() + dotSize.get() / 2)

  // Expand state (user taps the pill to see all rows as a dropdown).
  const [expanded, setExpanded] = useState(false)
  const [pillReady, setPillReady] = useState(false)
  // Trigger off RAW progress, not the spring. The spring lags by hundreds of
  // ms on fast scrolls, which would push pillReady's flip well past the
  // buffer and into detail step 1/2 — so the text animation would kick off
  // after the user is already deep in the content, feeling like a late pop.
  // Raw progress fires the instant scroll crosses the threshold, so the
  // 0.3s shrink animation runs in sync with the pill chrome filling in.
  useMotionValueEvent(morphRawProgress, "change", (v) => {
    setPillReady(v >= SHAPE - 0.05)
  })
  // Auto-collapse if we scroll back out of the pill state, so the dropdown
  // doesn't reappear half-open next time.
  useEffect(() => {
    console.log(pillReady)
    if (!pillReady) setExpanded(false)
  }, [pillReady])

  // Wrap the external onJump so every row tap also collapses the dropdown
  // back to the single-line pill. Without this, tapping a step in the
  // expanded dropdown would scroll the viewport but leave the dropdown
  // covering the detail the user just jumped to.
  const handleJump = (i: number) => {
    setExpanded(false)
    onJump(i)
  }

  // Drive the two motion values (dotSize, haloPx) imperatively — they're the
  // ones consumed reactively by railLeft/activeHalo so they can't be plain
  // animate-prop targets. The rest are consumed declaratively in the JSX
  // below via `animate={{ ... }}` bound to `pillReady`.
  useEffect(() => {
    const tween = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }
    const a1 = animate(dotSize, pillReady ? 10 : 18, tween)
    const a2 = animate(haloPx,  pillReady ? 3  : 6,  tween)
    return () => { a1.stop(); a2.stop() }
  }, [pillReady, dotSize, haloPx])


  return (
    // Outer row: centers the morphing container horizontally. As the maxWidth
    // tween drops from the parent's full width down to PILL_W the container
    // pulls in symmetrically from both sides, landing the finished pill in
    // the middle of the nav row — flanked by the compacted [logo] on the
    // left and [menu] on the right.
    <div
      ref={wrapperRef}
      className="md:hidden flex justify-center"
    >
      <motion.div
        style={{
          maxWidth,
          borderRadius: radius,
          paddingLeft: padX,
          paddingRight: padX,
          paddingTop: padY,
          paddingBottom: padY,
          boxShadow,
        }}
        className="w-full relative"
      >
        {/* Pill surface layer — bg + border fade in during the SHAPE window.
            Kept as its own layer so we can fade opacity cleanly without
            fighting the padding/radius of the outer motion wrapper. */}
        <motion.div
          aria-hidden
          style={{ opacity: bgOpacity, borderRadius: radius }}
          className="pointer-events-none absolute inset-0
                     border border-gray-200 bg-white
                     dark:border-white/[0.12] dark:bg-[#141414]"
        />

        {/* Vertical rail — tracks the dot column; fades with inactive rows. */}
        <motion.div
          style={{ opacity: railOpacity, left: railLeft }}
          className="absolute top-2 bottom-2 w-px bg-gray-200 dark:bg-white/10 pointer-events-none"
        />

        <ul className="relative flex flex-col">
          {/* Rows are unrolled — one explicit <TimelineRow /> per step —
              rather than rendered via features.map(). The static layout makes
              each row a stable, predictable element across renders: no key
              reconciliation, no conditional early returns inside a loop
              scope, no indexed closures over `i`. Each instance gets fresh
              dedicated props for its step index.
              `handleJump` wraps the parent `onJump` with an auto-collapse:
              tapping any row to navigate should always close the dropdown
              back to the single-line pill — leaving it open after a jump
              would obscure the detail view the user is jumping to. */}
          <TimelineRow step={0} feature={features[0]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={1} feature={features[1]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={2} feature={features[2]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
          <TimelineRow step={3} feature={features[3]} active={active} pillReady={pillReady} expanded={expanded}
            dotSize={dotSize} activeHalo={activeHalo}
            inactiveOpacity={inactiveOpacity} inactiveRows={inactiveRows}
            chevOpacity={chevOpacity} onJump={handleJump} onToggleExpand={() => setExpanded((v) => !v)} />
        </ul>
      </motion.div>
    </div>
  )
}

