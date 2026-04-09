import { NextResponse } from "next/server"

// Proxy for Docker Hub tag listing.
// Docker Hub does not send CORS headers, so the browser cannot call it directly.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")?.trim()
  const pageSize = searchParams.get("page_size") ?? "50"

  if (!repo) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 })
  }

  // Docker Hub requires namespace/name; official images use the "library" namespace.
  const parts = repo.split("/")
  const ns = parts.length === 1 ? "library" : parts[0]
  const name = parts.length === 1 ? parts[0] : parts.slice(1).join("/")

  const url = `https://hub.docker.com/v2/repositories/${encodeURIComponent(ns)}/${encodeURIComponent(name)}/tags/?page_size=${encodeURIComponent(pageSize)}&ordering=last_updated`

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not load tags (${res.status})` },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load tags" },
      { status: 502 }
    )
  }
}
