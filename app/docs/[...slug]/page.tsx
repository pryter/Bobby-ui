import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllDocs, getDoc } from "@/lib/docs"

export function generateStaticParams() {
  return getAllDocs().map((d) => ({ slug: d.slug.split("/") }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const doc = getDoc(slug.join("/"))
  if (!doc) return { title: "Bobby — Docs" }
  return {
    title: `Bobby — ${doc.title}`,
    description: doc.description,
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const joined = slug.join("/")
  const doc = getDoc(joined)
  if (!doc) notFound()

  const docs = getAllDocs()
  const idx = docs.findIndex((d) => d.slug === joined)
  const prev = idx > 0 ? docs[idx - 1] : null
  const next = idx >= 0 && idx < docs.length - 1 ? docs[idx + 1] : null

  return (
    <div className="docs-content">
      <div className="mb-2 text-xs uppercase tracking-wider font-semibold text-bobby-lime">
        Docs
      </div>
      <article
        className="docs-prose"
        dangerouslySetInnerHTML={{ __html: doc.html }}
      />

      <div className="mt-16 pt-8 border-t border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row gap-4 justify-between">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="group flex-1 p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
          >
            <div className="text-xs text-gray-500 mb-1">← Previous</div>
            <div className="font-semibold text-black dark:text-white group-hover:text-bobby-lime transition-colors">
              {prev.title}
            </div>
          </Link>
        ) : <div className="flex-1" />}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="group flex-1 p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors text-right"
          >
            <div className="text-xs text-gray-500 mb-1">Next →</div>
            <div className="font-semibold text-black dark:text-white group-hover:text-bobby-lime transition-colors">
              {next.title}
            </div>
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}
