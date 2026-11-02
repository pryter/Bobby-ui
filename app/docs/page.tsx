import Link from "next/link"
import { ArrowRightIcon } from "@heroicons/react/20/solid"
import { getDocTree, getDoc, type DocMeta, type DocNode } from "@/lib/docs"

export const metadata = {
  title: "Bobby — Docs",
  description: "Bobby documentation: our research and our products.",
}

function flattenDocs(nodes: DocNode[]): DocMeta[] {
  return nodes.flatMap((n) => (n.type === "doc" ? [n] : flattenDocs(n.children)))
}

// One card per direct child; a sub-folder (e.g. Bobby CI) collapses into a
// single card that opens its first page.
function groupCards(nodes: DocNode[]): DocMeta[] {
  return nodes.flatMap((n) => {
    if (n.type === "doc") return [n]
    const first = flattenDocs(n.children)[0]
    return first ? [{ ...first, title: n.title }] : []
  })
}

function DocCard({ doc }: { doc: DocMeta }) {
  return (
    <Link
      href={`/docs/${doc.slug}`}
      className="group relative p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
    >
      <div className="pr-6 text-base font-semibold text-black dark:text-white group-hover:text-primary transition-colors">
        {doc.title}
      </div>
      {doc.description && (
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {doc.description}
        </div>
      )}
      <ArrowRightIcon className="absolute top-5 right-5 h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" aria-hidden />
    </Link>
  )
}

export default function DocsIndex() {
  const tree = getDocTree()
  const intro = getDoc("introduction")

  // Top-level docs form a "Start here" group; each top-level folder gets its own group.
  const groups: { title: string; docs: DocMeta[] }[] = []
  const loose = tree.filter((n): n is Extract<DocNode, { type: "doc" }> => n.type === "doc")
  if (loose.length) groups.push({ title: "Start here", docs: loose })
  for (const node of tree) {
    if (node.type === "category") groups.push({ title: node.title, docs: groupCards(node.children) })
  }

  return (
    <div className="docs-content">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-wider font-semibold text-primary mb-3">
          Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Inside the <span className="text-primary">lab</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Our research and our products. Start with the overview, then read the parts you care about.
        </p>
      </div>

      <div className="space-y-10 mb-16">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-4 text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">
              {g.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {g.docs.map((doc) => (
                <DocCard key={doc.slug} doc={doc} />
              ))}
            </div>
          </section>
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
