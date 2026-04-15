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

export function getAllDocs(): DocMeta[] {
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"))
  const docs = files.map((file) => {
    const slug = file.replace(/\.md$/, "")
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), "utf-8")
    const { data } = matter(raw)
    return {
      slug,
      title: (data.title as string) ?? slug,
      description: (data.description as string) ?? "",
      order: (data.order as number) ?? 999,
    }
  })
  return docs.sort((a, b) => a.order - b.order)
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
