import Link from "next/link"
import { getAllDocs, getDoc } from "@/lib/docs"

export const metadata = {
  title: "Bobby — Docs",
  description: "Bobby documentation",
}

export default function DocsIndex() {
  const docs = getAllDocs()
  const intro = getDoc("introduction")

  return (
    <div className="docs-content">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-wider font-semibold text-bobby-lime mb-3">
          Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Build with <span className="text-gradient">Bobby</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Everything you need to go from a fresh repo to a shipping pipeline. Start with the basics, then dig into the bits you care about.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-16">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/docs/${doc.slug}`}
            className="group relative p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
          >
            <div className="text-base font-semibold text-black dark:text-white group-hover:text-bobby-lime transition-colors">
              {doc.title}
            </div>
            {doc.description && (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {doc.description}
              </div>
            )}
            <span className="absolute top-5 right-5 text-gray-400 group-hover:text-bobby-lime transition-colors">→</span>
          </Link>
        ))}
      </div>

      {intro && (
        <article
          className="docs-prose"
          dangerouslySetInnerHTML={{ __html: intro.html }}
        />
      )}
    </div>
  )
}
