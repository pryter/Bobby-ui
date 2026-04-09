import { NextResponse } from "next/server"

// Proxy for Docker Hub repository search.
// Docker Hub does not send CORS headers, so the browser cannot call it directly.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim()
  const pageSize = searchParams.get("page_size") ?? "15"

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const url = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=${encodeURIComponent(pageSize)}`

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Docker Hub search failed (${res.status})` },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 502 }
    )
  }
}
