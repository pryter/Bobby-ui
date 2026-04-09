import { NextResponse } from "next/server"

// Proxy for Docker Hub tag listing.
// Docker Hub does not send CORS headers, so the browser cannot call it directly.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repo = searchParams.get("repo")?.trim()
  const pageSize = searchParams.get("page_size") ?? "100"
  const page = searchParams.get("page") ?? "1"
  // Optional: when set, look up a single specific tag instead of listing.
  // This is much faster than scanning pages and is used to verify a saved
  // `repo:tag` value when the configuration page reopens.
  const tag = searchParams.get("tag")?.trim()

  if (!repo) {
    return NextResponse.json({ error: "Missing repo parameter" }, { status: 400 })
  }

  // Docker Hub requires namespace/name; official images use the "library" namespace.
  const parts = repo.split("/")
  const ns = parts.length === 1 ? "library" : parts[0]
  const name = parts.length === 1 ? parts[0] : parts.slice(1).join("/")

  // ── Single-tag verification branch ────────────────────────────────────────
  if (tag) {
    const tagUrl = `https://hub.docker.com/v2/repositories/${encodeURIComponent(ns)}/${encodeURIComponent(name)}/tags/${encodeURIComponent(tag)}/`
    try {
      const res = await fetch(tagUrl, {
        headers: { Accept: "application/json" },
        // Cache verified-tag lookups for 5 minutes — tags rarely move and
        // this is what reopens the configuration page hits first.
        next: { revalidate: 300 },
      })
      if (res.status === 404) {
        return NextResponse.json({ found: false })
      }
      if (!res.ok) {
        return NextResponse.json({ error: `Tag lookup failed (${res.status})` }, { status: res.status })
      }
      const data = await res.json()
      return NextResponse.json({ found: true, tag: data })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Tag lookup failed" },
        { status: 502 }
      )
    }
  }

  const url = `https://hub.docker.com/v2/repositories/${encodeURIComponent(ns)}/${encodeURIComponent(name)}/tags/?page_size=${encodeURIComponent(pageSize)}&page=${encodeURIComponent(page)}&ordering=last_updated`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Listings are large; cache 5 minutes so reopens are instant.
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not load tags (${res.status})` },
        { status: res.status }
      )
    }
    const data = await res.json()
    // Docker Hub returns { count, next, previous, results }. Forward the
    // results plus a simple hasMore flag derived from `next`.
    return NextResponse.json({
      results: Array.isArray(data.results) ? data.results : [],
      count: typeof data.count === "number" ? data.count : undefined,
      hasMore: Boolean(data.next),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load tags" },
      { status: 502 }
    )
  }
}
