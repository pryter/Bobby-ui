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

  // Use the legacy v1 search endpoint — it remains anonymous-accessible.
  // The newer /v2/search/repositories/ endpoint now requires authentication and
  // returns 401/403 for unauthenticated requests, which silently breaks the UI.
  const url = `https://index.docker.io/v1/search?q=${encodeURIComponent(query)}&n=${encodeURIComponent(pageSize)}`

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // Cache search results for 5 minutes — Docker Hub's index is slow
      // and the same queries get re-issued whenever the picker remounts.
      next: { revalidate: 300 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Docker Hub search failed (${res.status})` },
        { status: res.status }
      )
    }
    const data = await res.json()
    // Normalize v1 result shape → the shape ImagePicker expects (repo_name, short_description, …)
    const results = Array.isArray(data.results)
      ? data.results.map((r: { name: string; description?: string; star_count?: number; is_official?: boolean; is_automated?: boolean }) => ({
          repo_name: r.name,
          short_description: r.description,
          star_count: r.star_count,
          is_official: r.is_official,
          is_automated: r.is_automated,
        }))
      : []
    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 502 }
    )
  }
}
