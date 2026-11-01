"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import Navbar from "@/components/Navbar"
import SiteFooter from "@/components/SiteFooter"
import StatusBadge from "@/components/products/StatusBadge"
import ProductVisual from "@/components/products/ProductVisual"
import { useTheme } from "@/lib/useTheme"
import { ACTIVE_PRODUCTS, getProduct, type ProductLink } from "@/lib/products"

const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
})

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10% 0px -10% 0px" },
  transition: { duration: 0.6, ease: EASE, delay },
})

const pad = (n: number) => String(n).padStart(2, "0")

function CTA({ link, primary }: { link: ProductLink; primary?: boolean }) {
  const ext = link.external ? { target: "_blank", rel: "noopener noreferrer" } : {}
  return (
    <a
      href={link.href}
      {...ext}
      className={
        primary
          ? "rounded-full px-6 py-3 text-sm font-bold text-black shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98]"
          : "rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/[0.12] dark:text-gray-200 dark:hover:bg-white/[0.05]"
      }
      style={primary ? { background: "rgb(var(--primary-400))" } : undefined}
    >
      {link.label} {link.external ? "↗" : "→"}
    </a>
  )
}

export default function ProductView({ slug }: { slug: string }) {
  const { dark, toggle } = useTheme()
  const product = getProduct(slug)
  if (!product) return null
  const others = ACTIVE_PRODUCTS.filter((p) => p.slug !== slug)

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-[#0d0d0f] dark:text-white">
      <Navbar dark={dark} onToggle={toggle} />

      <main className="px-5 pb-32 pt-32 md:px-12 md:pt-40">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp(0)}>
            <Link
              href="/#products"
              className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              ← All products
            </Link>
          </motion.div>

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <div className="mt-10 grid items-center gap-12 md:grid-cols-12">
            <div className="md:col-span-6">
              <motion.div {...fadeUp(0.05)} className="flex items-center gap-3">
                <StatusBadge status={product.status} />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Bobby Lab
                </span>
              </motion.div>
              <motion.h1
                {...fadeUp(0.1)}
                className="mt-6 text-[clamp(2.5rem,5.5vw,4.25rem)] font-black leading-[1.03] tracking-tight"
              >
                {product.name}
              </motion.h1>
              <motion.p {...fadeUp(0.18)} className="mt-6 max-w-lg text-xl leading-snug text-gray-700 dark:text-gray-200">
                {product.tagline}
              </motion.p>
              <motion.p {...fadeUp(0.24)} className="mt-4 max-w-lg text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {product.summary}
              </motion.p>
              <motion.div {...fadeUp(0.3)} className="mt-9 flex flex-wrap items-center gap-3">
                {product.primary && <CTA link={product.primary} primary />}
                {product.secondary && <CTA link={product.secondary} />}
                {!product.primary && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">In beta — more to share soon.</p>
                )}
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="md:col-span-6"
            >
              <ProductVisual
                product={product}
                zoom={1.9}
                sizes="(min-width: 768px) 560px, 100vw"
                priority
                className="aspect-[5/4] rounded-[32px] border border-gray-200/70 dark:border-white/[0.07]"
              />
            </motion.div>
          </div>

          {/* ── What it does ─────────────────────────────────────────────── */}
          <section className="mt-32">
            <motion.div {...inView()}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
                What it does
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                {product.shortName}{" "}
                <span className="text-gray-400 dark:text-gray-500">at a glance.</span>
              </h2>
            </motion.div>
            <div
              className={
                "mt-10 grid gap-px overflow-hidden rounded-3xl border border-gray-200/80 bg-gray-200/80 dark:border-white/[0.07] dark:bg-white/[0.07] " +
                (product.features.length % 2 ? "sm:grid-cols-3" : "sm:grid-cols-2")
              }
            >
              {product.features.map((f, i) => (
                <motion.div key={f.title} {...inView(i * 0.06)} className="bg-white p-8 dark:bg-[#0d0d0f]">
                  <span className="font-mono text-xs tabular-nums" style={{ color: product.accent }}>
                    {pad(i + 1)}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ── How it works ─────────────────────────────────────────────── */}
          {product.steps && (
            <section className="mt-32">
              <motion.div {...inView()}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
                  How it works
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {product.steps.length} steps{" "}
                  <span className="text-gray-400 dark:text-gray-500">to get going.</span>
                </h2>
              </motion.div>
              <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
                {/* Rail joining the step markers (desktop) */}
                <div aria-hidden className="absolute left-0 right-0 top-[15px] hidden h-px bg-gray-200 md:block dark:bg-white/[0.08]" />
                {product.steps.map((st, i) => (
                  <motion.li key={st.title} {...inView(i * 0.08)} className="relative">
                    <span
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border bg-white font-mono text-xs font-semibold tabular-nums dark:bg-[#0d0d0f]"
                      style={{ borderColor: product.accent, color: product.accent }}
                    >
                      {i + 1}
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{st.title}</h3>
                    <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">{st.desc}</p>
                  </motion.li>
                ))}
              </ol>
            </section>
          )}

          {/* ── Gallery ──────────────────────────────────────────────────── */}
          {product.gallery && product.gallery.length > 0 && (
            <section className="mt-32">
              <motion.div {...inView()}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
                  Gallery
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {product.shortName}{" "}
                  <span className="text-gray-400 dark:text-gray-500">in use.</span>
                </h2>
              </motion.div>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {product.gallery.map((img, i) => (
                  <motion.div key={img.src} {...inView(i * 0.06)} className={i === 0 && product.gallery!.length % 2 ? "md:col-span-2" : ""}>
                    <ProductVisual
                      product={product}
                      image={img}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="aspect-[16/10] rounded-3xl border border-gray-200/70 dark:border-white/[0.07]"
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ── More from the lab ────────────────────────────────────────── */}
          <section className="mt-32">
            <motion.div {...inView()}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary">
                More from the lab
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Other products{" "}
                <span className="text-gray-400 dark:text-gray-500">we&apos;re building.</span>
              </h2>
            </motion.div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {others.map((p, i) => (
                <motion.div key={p.slug} {...inView(i * 0.06)}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-4 transition-colors
                               hover:border-gray-300 dark:border-white/[0.07] dark:bg-white/[0.02] dark:hover:border-white/[0.14]"
                  >
                    <ProductVisual product={p} sizes="(min-width: 768px) 360px, 100vw" className="h-44 rounded-2xl" />
                    <div className="flex flex-1 flex-col px-2 pb-2 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-tight tracking-tight">{p.name}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{p.tagline}</p>
                      <span className="mt-auto pt-4 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary">
                        Explore →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
