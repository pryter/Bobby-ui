import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { marked } from "marked"

const DOCS_DIR = path.join(process.cwd(), "content", "docs")

export type DocMeta = {
  slug: string
  title: string
  description: string
  order: number
}

export type Doc = DocMeta & {
  html: string
}

export type DocCategory = {
  type: "category"
  slug: string
  title: string
  order: number
  children: DocNode[]
}

export type DocLeaf = DocMeta & { type: "doc" }

export type DocNode = DocCategory | DocLeaf

type CategoryConfig = {
  title?: string
  order?: number
}

function readCategoryConfig(dir: string): CategoryConfig {
  const file = path.join(dir, "_category.json")
  if (!fs.existsSync(file)) return {}
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as CategoryConfig
  } catch {
    return {}
  }
}

function readDocMeta(absFile: string, slug: string): DocMeta {
  const raw = fs.readFileSync(absFile, "utf-8")
  const { data } = matter(raw)
  return {
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    order: (data.order as number) ?? 999,
  }
}

function buildTree(dir: string, prefix = ""): DocNode[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const nodes: DocNode[] = []

  for (const entry of entries) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const config = readCategoryConfig(abs)
      const folderSlug = prefix ? `${prefix}/${entry.name}` : entry.name
      const children = buildTree(abs, folderSlug)
      if (children.length === 0) continue
      nodes.push({
        type: "category",
        slug: folderSlug,
        title: config.title ?? prettyName(entry.name),
        order: config.order ?? 999,
        children,
      })
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const baseName = entry.name.replace(/\.md$/, "")
      const slug = prefix ? `${prefix}/${baseName}` : baseName
      nodes.push({ type: "doc", ...readDocMeta(abs, slug) })
    }
  }

  return nodes.sort((a, b) => a.order - b.order)
}

function prettyName(name: string): string {
  return name
    .split(/[-_]/)
    .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ")
}

function flatten(nodes: DocNode[]): DocMeta[] {
  const out: DocMeta[] = []
  for (const n of nodes) {
    if (n.type === "doc") out.push(n)
    else out.push(...flatten(n.children))
  }
  return out
}

export function getDocTree(): DocNode[] {
  return buildTree(DOCS_DIR)
}

export function getAllDocs(): DocMeta[] {
  return flatten(buildTree(DOCS_DIR))
}

export function getDoc(slug: string): Doc | null {
  const file = path.join(DOCS_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, "utf-8")
  const { data, content } = matter(raw)
  marked.setOptions({ gfm: true, breaks: false })
  const html = marked.parse(content) as string
  return {
    slug,
    title: (data.title as string) ?? slug,
    description: (data.description as string) ?? "",
    order: (data.order as number) ?? 999,
    html,
  }
}
