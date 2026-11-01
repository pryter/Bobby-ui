"use client"

import { motion } from "framer-motion"
import PixelMotif, { type MotifMode } from "@/components/PixelMotif"

// ─── Research ─────────────────────────────────────────────────────────────────
// Home-page research block: three solid tiles (yellow, black, warm grey), each
// framed as the question the area tries to answer, with the site's pixel motif
// in the corner.

const AREAS: {
  slug: string
  n: string
  title: string
  question: string
  line: string
  bg: string
  text: string
  sub: string
  motif: string
  mode: MotifMode
}[] = [
  {
    slug: "intelligence",
    n: "01",
    title: "Intelligence",
    question: "Does it understand what you meant?",
    line: "Working out what you're asking, even when you phrase it loosely.",
    bg: "bg-primary",
    text: "text-black",
    sub: "text-black/65",
    motif: "rgba(0,0,0,0.88)",
    mode: "dissolve",
  },
  {
    slug: "rag",
    n: "02",
    title: "RAG",
    question: "Can every answer show its source?",
    line: "Answers from your own code and documents, with the file, line or page they came from.",
    bg: "bg-[#111113] dark:bg-[#1a1a1d]",
    text: "text-white",
    sub: "text-white/55",
    motif: "rgb(var(--primary-400))",
    mode: "rings",
  },
  {
    slug: "integration",
    n: "03",
    title: "Integration",
    question: "Does it fit into how you work?",
    line: "It plugs into the tools you already use, from your repos to your coding agent, so you keep working without switching.",
    bg: "bg-[#efeee9] dark:bg-[#f3f1ea]",
    text: "text-gray-900",
    sub: "text-gray-900/55",
    motif: "rgb(var(--primary-600))",
    mode: "bars",
  },
]

const EASE = [0.22, 1, 0.36, 1] as const
const rise = (y: number) => ({
  hidden: { opacity: 0, y },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
})

export default function Research() {
  return (
    <section id="research" className="scroll-mt-24 px-5 pb-32 pt-8 md:px-12">
      <motion.div
        className="mx-auto max-w-6xl"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
        transition={{ staggerChildren: 0.08, delayChildren: 0.05 }}
      >
        <motion.div variants={rise(32)} className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
              Research
            </p>
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">More than search.</h2>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-gray-500 dark:text-gray-400">
              Search finds the words you typed. We build systems that read what&apos;s there and work out what you meant.
            </p>
          </div>
          <a
            href="/docs/research/intelligence"
            className="text-sm font-semibold text-gray-900 underline decoration-primary decoration-2 underline-offset-4 dark:text-white"
          >
            Read the research notes
          </a>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {AREAS.map((a, i) => (
            <motion.a
              key={a.slug}
              href={`/docs/research/${a.slug}`}
              variants={rise(40)}
              className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[28px] p-7 md:p-8 ${a.bg}`}
            >
              {/* inset so the corner pixels clear the card's rounded corner */}
              <div aria-hidden className="absolute bottom-0 left-0 right-4 top-4">
                <PixelMotif
                  color={a.motif}
                  mode={a.mode}
                  title={`${a.n} ${a.title}`}
                  index={i}
                  className="transition-transform duration-700 ease-out group-hover:scale-[1.04] [transform-origin:top_right]"
                />
              </div>
              <span className={`absolute left-7 top-7 font-mono text-xs md:left-8 md:top-8 ${a.sub}`}>
                {a.n}&nbsp;&nbsp;<span className={`font-sans text-sm font-semibold ${a.text}`}>{a.title}</span>
              </span>
              <h3 className={`relative text-[1.75rem] font-bold leading-[1.08] tracking-tight md:text-[2rem] ${a.text}`}>
                {a.question}
              </h3>
              <p className={`relative mt-4 max-w-[30ch] text-[15px] leading-relaxed ${a.sub}`}>{a.line}</p>
              <span className={`relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${a.text}`}>
                Read more
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
