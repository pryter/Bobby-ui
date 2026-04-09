"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { MagnifyingGlassIcon, StarIcon, CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/outline"

// ── Docker Hub public search API types ──────────────────────────────────────
interface HubSearchResult {
  repo_name: string          // e.g. "library/node" or "bitnami/node"
  short_description?: string
  star_count?: number
  is_official?: boolean
  is_automated?: boolean
}

interface HubTagResult {
  name: string               // e.g. "20-alpine"
  last_updated?: string
  full_size?: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function splitImage(raw: string): { repo: string; tag: string } {
  const trimmed = raw.trim()
  const colonIdx = trimmed.lastIndexOf(":")
  // Avoid mistaking "host:port/name" for a tag — require tag has no "/"
  if (colonIdx > 0 && !trimmed.slice(colonIdx).includes("/")) {
    return { repo: trimmed.slice(0, colonIdx), tag: trimmed.slice(colonIdx + 1) }
  }
  return { repo: trimmed, tag: "" }
}

function displayName(repoName: string): string {
  // Docker Hub returns official images as "library/name" — strip the prefix for display
  return repoName.startsWith("library/") ? repoName.slice("library/".length) : repoName
}

function formatBytes(n?: number): string {
  if (!n || n <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

// Sentinel used in dropdowns when a tag has no version or no variant component.
const NONE = "__none__"
// Variants we recommend by default — `alpine` is small, secure, and the most
// common pick for build environments, so we badge it as "suggested".
const SUGGESTED_VARIANTS = new Set(["alpine"])

// Render `text` with the first occurrence of `query` highlighted. Used in the
// version/distribution popovers so users can see which substring matched their
// filter input.
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-bobby-lime/25 px-0.5 text-inherit">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}
const PSEUDO_VERSIONS = /^(latest|lts|current|stable|edge|nightly|main|master)$/i

// Parse a Docker tag into a (version, variant) pair using the common
// "<version>-<variant>" convention. Examples:
//   "20-alpine"        → { version: "20",        variant: "alpine" }
//   "1.21.5-bookworm"  → { version: "1.21.5",    variant: "bookworm" }
//   "20"               → { version: "20",        variant: null }
//   "alpine"           → { version: null,        variant: "alpine" }
//   "latest"           → { version: "latest",    variant: null }
function parseTag(tag: string): { version: string | null; variant: string | null } {
  if (PSEUDO_VERSIONS.test(tag)) return { version: tag.toLowerCase(), variant: null }
  const dash = tag.indexOf("-")
  if (dash === -1) {
    if (/^\d/.test(tag)) return { version: tag, variant: null }
    return { version: null, variant: tag }
  }
  const left = tag.slice(0, dash)
  const right = tag.slice(dash + 1)
  if (/^\d/.test(left) || PSEUDO_VERSIONS.test(left)) {
    return { version: left, variant: right }
  }
  return { version: null, variant: tag }
}

// Compare two version strings so the dropdown sorts newest-first.
// Pseudo-versions (latest, lts, …) bubble to the top; numerics descend.
function compareVersions(a: string, b: string): number {
  const aPseudo = PSEUDO_VERSIONS.test(a)
  const bPseudo = PSEUDO_VERSIONS.test(b)
  if (aPseudo !== bPseudo) return aPseudo ? -1 : 1
  if (aPseudo && bPseudo) return a.localeCompare(b)
  const ap = a.split(/[.\-+]/)
  const bp = b.split(/[.\-+]/)
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    const an = parseInt(ap[i] ?? "", 10)
    const bn = parseInt(bp[i] ?? "", 10)
    if (!isNaN(an) && !isNaN(bn)) {
      if (an !== bn) return bn - an
    } else {
      const cmp = (bp[i] ?? "").localeCompare(ap[i] ?? "")
      if (cmp !== 0) return cmp
    }
  }
  return 0
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return ""
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const sec = Math.max(0, (Date.now() - then) / 1000)
  if (sec < 60) return "just now"
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`
  if (sec < 86400 * 30) return `${Math.floor(sec / 86400)}d ago`
  if (sec < 86400 * 365) return `${Math.floor(sec / 86400 / 30)}mo ago`
  return `${Math.floor(sec / 86400 / 365)}y ago`
}

// ── Component ───────────────────────────────────────────────────────────────
interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function ImagePicker({ value, onChange, placeholder, className }: Props) {
  const { repo: initialRepo, tag: initialTag } = splitImage(value)

  const [query, setQuery] = useState(initialRepo)
  const [results, setResults] = useState<HubSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const [selectedRepo, setSelectedRepo] = useState<string>(initialRepo)
  const [tags, setTags] = useState<HubTagResult[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [tagsError, setTagsError] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>(initialTag)
  // Structured tag picker — version (e.g. "20", "1.21.5") and variant
  // (e.g. "alpine", "bookworm-slim"). Either may be NONE meaning "any".
  const [pickedVersion, setPickedVersion] = useState<string>(NONE)
  const [pickedVariant, setPickedVariant] = useState<string>(NONE)
  // Pagination state for the tags list — Docker Hub returns at most 100
  // tags per page, but `node`/`golang` etc. have hundreds of historical
  // versions, so we lazy-load more pages as the user scrolls the version
  // dropdown.
  const [tagsPage, setTagsPage] = useState<number>(0)
  const [hasMoreTags, setHasMoreTags] = useState<boolean>(false)
  const [loadingMoreTags, setLoadingMoreTags] = useState<boolean>(false)
  // Tags we have positively verified to exist on Docker Hub — populated by
  // the single-tag lookup endpoint and by every page of the listing as it
  // arrives. This lets us short-circuit the slow listing scan when the
  // configuration page reopens with a known-good `repo:tag`.
  const [verifiedTags, setVerifiedTags] = useState<Set<string>>(new Set())
  const [verifyingTag, setVerifyingTag] = useState<boolean>(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const [versionFilter, setVersionFilter] = useState("")
  const versionBtnRef = useRef<HTMLButtonElement>(null)
  const versionPanelRef = useRef<HTMLDivElement>(null)
  const versionSentinelRef = useRef<HTMLDivElement>(null)
  const [variantOpen, setVariantOpen] = useState(false)
  const [variantFilter, setVariantFilter] = useState("")
  const variantBtnRef = useRef<HTMLButtonElement>(null)
  const variantPanelRef = useRef<HTMLDivElement>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchAbort = useRef<AbortController | null>(null)
  const tagsAbort = useRef<AbortController | null>(null)
  // Track the last value we emitted via onChange so we can ignore the
  // resulting parent re-render (otherwise typing "node:" would be split
  // back into repo="node" and the colon would vanish from the input).
  const lastEmitted = useRef<string>(value)

  // Keep query in sync if parent value changes externally (e.g. initial load)
  useEffect(() => {
    if (value === lastEmitted.current) return
    lastEmitted.current = value
    const { repo, tag } = splitImage(value)
    setQuery(repo)
    setSelectedRepo(repo)
    setSelectedTag(tag)
  }, [value])

  const emit = useCallback((v: string) => {
    lastEmitted.current = v
    onChange(v)
  }, [onChange])

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Close the version popover when clicking outside it (it lives inside
  // containerRef so the global outside-click handler can't catch this case).
  useEffect(() => {
    if (!versionOpen) return
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (versionPanelRef.current?.contains(target)) return
      if (versionBtnRef.current?.contains(target)) return
      setVersionOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [versionOpen])

  // Same outside-click handling for the distribution popover.
  useEffect(() => {
    if (!variantOpen) return
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (variantPanelRef.current?.contains(target)) return
      if (variantBtnRef.current?.contains(target)) return
      setVariantOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [variantOpen])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }
    const timer = setTimeout(async () => {
      searchAbort.current?.abort()
      const ctrl = new AbortController()
      searchAbort.current = ctrl
      setSearching(true)
      setSearchError(null)
      try {
        const url = `/api/dockerhub/search?query=${encodeURIComponent(q)}&page_size=15`
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        const data = await res.json()
        setResults(Array.isArray(data.results) ? data.results : [])
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return
        setSearchError(err instanceof Error ? err.message : "Search failed")
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Fetch the first page of tags for the selected repo. Resets pagination
  // state — subsequent pages are appended via loadMoreTags().
  const fetchTags = useCallback(async (repoName: string) => {
    tagsAbort.current?.abort()
    const ctrl = new AbortController()
    tagsAbort.current = ctrl
    setLoadingTags(true)
    setTagsError(null)
    setTags([])
    setTagsPage(0)
    setHasMoreTags(false)
    try {
      const url = `/api/dockerhub/tags?repo=${encodeURIComponent(repoName)}&page_size=100&page=1`
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`Could not load tags (${res.status})`)
      const data = await res.json()
      const incoming: HubTagResult[] = Array.isArray(data.results) ? data.results : []
      setTags(incoming)
      setTagsPage(1)
      setHasMoreTags(Boolean(data.hasMore))
      setVerifiedTags(prev => {
        const next = new Set(prev)
        for (const t of incoming) next.add(t.name)
        return next
      })
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return
      setTagsError(err instanceof Error ? err.message : "Could not load tags")
    } finally {
      setLoadingTags(false)
    }
  }, [])

  // Verify a single tag exists for the given repo via Docker Hub's per-tag
  // endpoint. Used on mount/reopen so we don't have to scan the listing.
  const verifyTag = useCallback(async (repoName: string, tagName: string) => {
    if (!repoName || !tagName) return
    setVerifyingTag(true)
    try {
      const url = `/api/dockerhub/tags?repo=${encodeURIComponent(repoName)}&tag=${encodeURIComponent(tagName)}`
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      if (data?.found) {
        setVerifiedTags(prev => {
          if (prev.has(tagName)) return prev
          const next = new Set(prev)
          next.add(tagName)
          return next
        })
      }
    } catch {
      // Non-fatal — the listing fetch will eventually settle validation.
    } finally {
      setVerifyingTag(false)
    }
  }, [])

  // Load the next page of tags and append (deduped by name).
  const loadMoreTags = useCallback(async () => {
    if (!selectedRepo || !hasMoreTags || loadingMoreTags || loadingTags) return
    const nextPage = tagsPage + 1
    setLoadingMoreTags(true)
    try {
      const url = `/api/dockerhub/tags?repo=${encodeURIComponent(selectedRepo)}&page_size=100&page=${nextPage}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Could not load tags (${res.status})`)
      const data = await res.json()
      const incoming: HubTagResult[] = Array.isArray(data.results) ? data.results : []
      setTags(prev => {
        const seen = new Set(prev.map(t => t.name))
        return [...prev, ...incoming.filter(t => !seen.has(t.name))]
      })
      setVerifiedTags(prev => {
        const next = new Set(prev)
        for (const t of incoming) next.add(t.name)
        return next
      })
      setTagsPage(nextPage)
      setHasMoreTags(Boolean(data.hasMore))
    } catch (err: unknown) {
      // Non-fatal — leave existing tags in place.
      setTagsError(err instanceof Error ? err.message : "Could not load more tags")
    } finally {
      setLoadingMoreTags(false)
    }
  }, [selectedRepo, hasMoreTags, loadingMoreTags, loadingTags, tagsPage])

  // Lazy-load more tag pages when the user scrolls near the bottom of
  // the version popover. Re-binds when the popover opens, when more pages
  // become available, or when the rendered list grows.
  useEffect(() => {
    if (!versionOpen || !hasMoreTags) return
    const sentinel = versionSentinelRef.current
    const root = versionPanelRef.current
    if (!sentinel || !root) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreTags()
      },
      { root, rootMargin: "150px" }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [versionOpen, hasMoreTags, loadMoreTags, tags.length])

  // Build a structured index of the loaded tags so the picker can offer
  // separate Version and Variant dropdowns. byKey lets us go from
  // (version, variant) → the actual tag name to send to Docker.
  const tagIndex = useMemo(() => {
    const versions = new Set<string>()
    const variants = new Set<string>()
    const byKey = new Map<string, string>()
    const parsed: Array<{ version: string; variant: string; raw: string }> = []
    for (const t of tags) {
      const { version, variant } = parseTag(t.name)
      const v = version ?? NONE
      const d = variant ?? NONE
      versions.add(v)
      variants.add(d)
      // Prefer the first occurrence (Docker Hub returns newest first).
      if (!byKey.has(`${v}|${d}`)) byKey.set(`${v}|${d}`, t.name)
      parsed.push({ version: v, variant: d, raw: t.name })
    }
    return {
      versions: [...versions].sort((a, b) => {
        if (a === NONE) return 1
        if (b === NONE) return -1
        return compareVersions(a, b)
      }),
      variants: [...variants].sort((a, b) => {
        if (a === NONE) return -1 // "(default)" first
        if (b === NONE) return 1
        return a.localeCompare(b)
      }),
      byKey,
      parsed,
    }
  }, [tags])

  // Variants available given the currently picked version (or all of them
  // if the user hasn't narrowed by version yet). Same idea for versions.
  const availableVariants = useMemo(() => {
    if (pickedVersion === NONE) return tagIndex.variants
    const out = new Set<string>()
    for (const p of tagIndex.parsed) if (p.version === pickedVersion) out.add(p.variant)
    return [...out].sort((a, b) => {
      if (a === NONE) return -1
      if (b === NONE) return 1
      return a.localeCompare(b)
    })
  }, [tagIndex, pickedVersion])

  const availableVersions = useMemo(() => {
    if (pickedVariant === NONE) return tagIndex.versions
    const out = new Set<string>()
    for (const p of tagIndex.parsed) if (p.variant === pickedVariant) out.add(p.version)
    return [...out].sort((a, b) => {
      if (a === NONE) return 1
      if (b === NONE) return -1
      return compareVersions(a, b)
    })
  }, [tagIndex, pickedVariant])

  // Apply the filter input + sort: exact matches first, then prefix matches,
  // then substring matches. This way typing "20" surfaces the bare "20" tag
  // before "20.1.0", "10.20.0", etc.
  const filteredVersions = useMemo(() => {
    const q = versionFilter.trim().toLowerCase()
    const list = availableVersions.filter(v => v !== NONE)
    if (!q) return list
    const matches = list.filter(v => v.toLowerCase().includes(q))
    matches.sort((a, b) => {
      const al = a.toLowerCase()
      const bl = b.toLowerCase()
      const ar = al === q ? 0 : al.startsWith(q) ? 1 : 2
      const br = bl === q ? 0 : bl.startsWith(q) ? 1 : 2
      if (ar !== br) return ar - br
      return compareVersions(a, b)
    })
    return matches
  }, [availableVersions, versionFilter])

  const filteredVariants = useMemo(() => {
    const q = variantFilter.trim().toLowerCase()
    const list = availableVariants.filter(v => v !== NONE)
    if (!q) return list
    const matches = list.filter(v => v.toLowerCase().includes(q))
    matches.sort((a, b) => {
      const al = a.toLowerCase()
      const bl = b.toLowerCase()
      const ar = al === q ? 0 : al.startsWith(q) ? 1 : 2
      const br = bl === q ? 0 : bl.startsWith(q) ? 1 : 2
      if (ar !== br) return ar - br
      return a.localeCompare(b)
    })
    return matches
  }, [availableVariants, variantFilter])

  // Validation for free-form `repo:tag` typed in the search box. We can only
  // confidently say a tag is missing once the full tag list is loaded — until
  // then the user might just need to scroll/load more pages.
  const tagValidation: "matched" | "missing" | "pending" | null = useMemo(() => {
    if (!selectedTag || !selectedRepo) return null
    // Fast path — single-tag verify or any prior listing page already
    // confirmed this tag exists.
    if (verifiedTags.has(selectedTag)) return "matched"
    if (verifyingTag || loadingTags) return "pending"
    if (hasMoreTags || loadingMoreTags) return "pending"
    return "missing"
  }, [selectedTag, selectedRepo, verifiedTags, verifyingTag, loadingTags, loadingMoreTags, hasMoreTags])

  // Sync the structured pickers when selectedTag changes from outside
  // (e.g. initial load, or the free-form text input).
  useEffect(() => {
    if (!selectedTag) {
      setPickedVersion(NONE)
      setPickedVariant(NONE)
      return
    }
    const { version, variant } = parseTag(selectedTag)
    setPickedVersion(version ?? NONE)
    setPickedVariant(variant ?? NONE)
  }, [selectedTag])

  // Resolve the (version, variant) pair back to a real tag name and emit it.
  function applyStructured(version: string, variant: string) {
    setPickedVersion(version)
    setPickedVariant(variant)
    if (version === NONE && variant === NONE) return
    // Exact match first.
    const exact = tagIndex.byKey.get(`${version}|${variant}`)
    if (exact) { pickTag(exact); return }
    // If only one axis is chosen, pick the first tag matching that axis.
    const fallback = tagIndex.parsed.find(p =>
      (version === NONE || p.version === version) &&
      (variant === NONE || p.variant === variant)
    )
    if (fallback) pickTag(fallback.raw)
  }

  function pickImage(r: HubSearchResult) {
    const repo = r.repo_name
    setSelectedRepo(repo)
    setSelectedTag("")
    setQuery(displayName(repo))
    setOpen(false)
    emit(displayName(repo)) // no tag yet — parent value updated
    fetchTags(repo)
  }

  function pickTag(tagName: string) {
    setSelectedTag(tagName)
    const out = `${displayName(selectedRepo)}:${tagName}`
    emit(out)
  }

  function clearSelection() {
    setSelectedRepo("")
    setSelectedTag("")
    setQuery("")
    setTags([])
    emit("")
  }

  // When user edits the text freely, update parent immediately (free-form fallback)
  function handleQueryChange(v: string) {
    setQuery(v)
    setOpen(true)
    emit(v)
    // If they clear the input, clear selection
    if (!v.trim()) {
      setSelectedRepo("")
      setSelectedTag("")
      setTags([])
      return
    }
    // If the user typed a full `repo:tag` reference, parse it and try to
    // resolve it against the loaded tag list. The structured pickers sync
    // off `selectedTag` automatically (see effect below). When the repo
    // portion changes from what's currently loaded we kick off a tag fetch
    // so the validation notice can resolve.
    if (v.includes(":")) {
      const { repo, tag } = splitImage(v)
      if (repo && repo !== selectedRepo) {
        setSelectedRepo(repo)
        fetchTags(repo)
      }
      setSelectedTag(tag)
      // Direct verify so the validation banner doesn't have to wait for
      // the listing scan to confirm a freshly typed tag.
      if (repo && tag && !verifiedTags.has(tag)) verifyTag(repo, tag)
    } else {
      // No colon — the user is in repo-search mode; clear any tag-level state
      // so the structured pickers reset.
      if (selectedTag) setSelectedTag("")
    }
  }

  // Load tags on mount if we already have a selection. We also fire a
  // direct single-tag verify in parallel — it usually returns before the
  // listing scan and means the validation banner flips to "matched"
  // almost instantly when the user reopens a saved configuration.
  useEffect(() => {
    if (initialRepo && !tags.length && !loadingTags) {
      fetchTags(initialRepo)
      if (initialTag) verifyTag(initialRepo, initialTag)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Styles (match ProjectConfiguration conventions) ──────────────────────
  const inputBase = "rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 border-gray-200 bg-white text-gray-900 focus:ring-bobby-lime dark:border-white/[0.10] dark:bg-white/[0.04] dark:text-white dark:focus:ring-bobby-lime/60"
  const panel = "rounded-lg border border-gray-200 bg-white shadow-lg dark:border-white/[0.10] dark:bg-[#1a1a1a]"

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Search input with icon */}
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={placeholder ?? "Search Docker Hub… e.g. node, golang, postgres"}
          className={`w-full pl-9 pr-9 font-mono ${inputBase}`}
        />
        {query && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
            aria-label="Clear"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {open && query.trim() && (results.length > 0 || searching || searchError) && (
        <div className={`absolute z-20 mt-1 max-h-80 w-full overflow-y-auto ${panel}`}>
          {searching && (
            <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">Searching Docker Hub…</div>
          )}
          {searchError && (
            <div className="px-3 py-2 text-xs text-red-500">{searchError}</div>
          )}
          {!searching && !searchError && results.map((r) => (
            <button
              key={r.repo_name}
              type="button"
              onClick={() => pickImage(r)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-mono text-sm text-gray-900 dark:text-white">
                    {displayName(r.repo_name)}
                  </span>
                  {r.is_official && (
                    <span title="Official image" className="inline-flex items-center text-bobby-lime">
                      <CheckBadgeIcon className="h-4 w-4" />
                    </span>
                  )}
                </div>
                {r.short_description && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.short_description}</p>
                )}
              </div>
              {typeof r.star_count === "number" && (
                <div className="flex shrink-0 items-center gap-0.5 text-xs text-gray-400">
                  <StarIcon className="h-3.5 w-3.5" />
                  {r.star_count.toLocaleString()}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tag selector — only when a repo is selected */}
      {selectedRepo && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Tag {selectedTag && <span className="ml-1 font-mono text-gray-400">({selectedTag})</span>}
            </label>
            {loadingTags && (
              <span className="text-xs text-gray-400 dark:text-gray-500">Loading tags…</span>
            )}
          </div>
          {tagsError && <p className="text-xs text-red-500">{tagsError}</p>}
          {/* Inline validation for `repo:tag` typed directly into the search box. */}
          {tagValidation === "matched" && (
            <p className="mb-2 text-xs text-bobby-lime">
              ✓ Tag <span className="font-mono">{selectedTag}</span> found on Docker Hub.
            </p>
          )}
          {tagValidation === "pending" && (
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
              Checking <span className="font-mono">{selectedTag}</span>… loading more tags from Docker Hub.
            </p>
          )}
          {tagValidation === "missing" && (
            <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
              ⚠ Tag <span className="font-mono">{selectedTag}</span> was not found for{" "}
              <span className="font-mono">{displayName(selectedRepo)}</span>. Pick one from the dropdowns below or fix the typo.
            </p>
          )}
          {!loadingTags && !tagsError && tags.length > 0 && (
            <>
              {/* Structured pickers: version + variant (distribution). */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Version</label>
                  <button
                    ref={versionBtnRef}
                    type="button"
                    onClick={() => setVersionOpen(o => !o)}
                    className={`flex w-full items-center justify-between font-mono ${inputBase}`}
                  >
                    <span className={pickedVersion === NONE ? "text-gray-400" : ""}>
                      {pickedVersion === NONE ? "Any" : pickedVersion}
                    </span>
                    <span className="ml-2 text-gray-400">▾</span>
                  </button>
                  {versionOpen && (
                    <div
                      ref={versionPanelRef}
                      className={`absolute z-30 mt-1 max-h-64 w-full overflow-y-auto ${panel}`}
                    >
                      {/* Filter input for power users */}
                      <div className="sticky top-0 border-b border-gray-100 bg-white p-1.5 dark:border-white/[0.08] dark:bg-[#1a1a1a]">
                        <input
                          type="text"
                          autoFocus
                          value={versionFilter}
                          onChange={(e) => setVersionFilter(e.target.value)}
                          placeholder="Filter versions…"
                          className={`w-full px-2 py-1 text-xs font-mono ${inputBase}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { applyStructured(NONE, pickedVariant); setVersionOpen(false) }}
                        className="block w-full px-3 py-1.5 text-left font-mono text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                      >
                        Any
                      </button>
                      {filteredVersions.map((v) => {
                        const active = v === pickedVersion
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => { applyStructured(v, pickedVariant); setVersionOpen(false) }}
                            className={`block w-full px-3 py-1.5 text-left font-mono text-xs transition ${
                              active
                                ? "bg-bobby-lime/10 text-bobby-lime"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                            }`}
                          >
                            <Highlight text={v} query={versionFilter} />
                          </button>
                        )
                      })}
                      {filteredVersions.length === 0 && versionFilter && (
                        <div className="px-3 py-2 text-center text-[10px] text-gray-400">
                          No version matches "{versionFilter}"{hasMoreTags ? " in loaded pages — keep scrolling" : ""}
                        </div>
                      )}
                      {/* Sentinel — when scrolled into view, fetch the next page */}
                      {hasMoreTags && (
                        <div ref={versionSentinelRef} className="px-3 py-2 text-center text-[10px] text-gray-400">
                          {loadingMoreTags ? "Loading more…" : "Scroll for more"}
                        </div>
                      )}
                      {!hasMoreTags && availableVersions.length > 1 && (
                        <div className="px-3 py-1 text-center text-[10px] text-gray-400">End of list</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Distribution</label>
                  <button
                    ref={variantBtnRef}
                    type="button"
                    onClick={() => setVariantOpen(o => !o)}
                    className={`flex w-full items-center justify-between font-mono ${inputBase}`}
                  >
                    <span className={pickedVariant === NONE ? "text-gray-400" : ""}>
                      {pickedVariant === NONE ? "(default)" : pickedVariant}
                    </span>
                    <span className="ml-2 text-gray-400">▾</span>
                  </button>
                  {variantOpen && (
                    <div
                      ref={variantPanelRef}
                      className={`absolute z-30 mt-1 max-h-64 w-full overflow-y-auto ${panel}`}
                    >
                      <div className="sticky top-0 border-b border-gray-100 bg-white p-1.5 dark:border-white/[0.08] dark:bg-[#1a1a1a]">
                        <input
                          type="text"
                          autoFocus
                          value={variantFilter}
                          onChange={(e) => setVariantFilter(e.target.value)}
                          placeholder="Filter distributions…"
                          className={`w-full px-2 py-1 text-xs font-mono ${inputBase}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { applyStructured(pickedVersion, NONE); setVariantOpen(false) }}
                        className="block w-full px-3 py-1.5 text-left font-mono text-xs text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/[0.04]"
                      >
                        (default)
                      </button>
                      {filteredVariants.map((v) => {
                        const active = v === pickedVariant
                        const suggested = SUGGESTED_VARIANTS.has(v.toLowerCase())
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => { applyStructured(pickedVersion, v); setVariantOpen(false) }}
                            className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left font-mono text-xs transition ${
                              active
                                ? "bg-bobby-lime/10 text-bobby-lime"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                            }`}
                          >
                            <span><Highlight text={v} query={variantFilter} /></span>
                            {suggested && (
                              <span
                                title="Recommended — small image, fast builds"
                                className="rounded border border-bobby-lime/40 bg-bobby-lime/10 px-1.5 py-0 text-[9px] uppercase tracking-wide text-bobby-lime"
                              >
                                suggested
                              </span>
                            )}
                          </button>
                        )
                      })}
                      {filteredVariants.length === 0 && variantFilter && (
                        <div className="px-3 py-2 text-center text-[10px] text-gray-400">
                          No distribution matches "{variantFilter}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Filtered preview list — shows tags matching the current
                  Version/Distribution choices, so users can see exactly
                  what gets selected and pick a more specific tag if needed. */}
              <div className="mt-2">
                <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Matching tags
                </label>
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-white/[0.08]">
                  {tagIndex.parsed
                    .filter(p =>
                      (pickedVersion === NONE || p.version === pickedVersion) &&
                      (pickedVariant === NONE || p.variant === pickedVariant)
                    )
                    .map((p) => {
                      const active = p.raw === selectedTag
                      const meta = tags.find(t => t.name === p.raw)
                      return (
                        <button
                          key={p.raw}
                          type="button"
                          onClick={() => pickTag(p.raw)}
                          title={`${formatBytes(meta?.full_size)} · ${formatRelativeTime(meta?.last_updated)}`}
                          className={`rounded-md border px-2 py-0.5 font-mono text-xs transition ${
                            active
                              ? "border-bobby-lime bg-bobby-lime/10 text-bobby-lime"
                              : "border-gray-200 bg-white text-gray-700 hover:border-bobby-lime/50 dark:border-white/[0.10] dark:bg-white/[0.03] dark:text-gray-200"
                          }`}
                        >
                          {p.raw}
                        </button>
                      )
                    })}
                </div>
              </div>
            </>
          )}
          {!loadingTags && !tagsError && tags.length === 0 && selectedRepo && (
            <p className="text-xs text-gray-400 dark:text-gray-500">No tags found — you can type a tag manually in the field above (e.g. <span className="font-mono">{displayName(selectedRepo)}:latest</span>).</p>
          )}
        </div>
      )}

      {/* Current value preview */}
      {value && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Using image <span className="font-mono text-gray-900 dark:text-white">{value}</span>
        </p>
      )}
    </div>
  )
}
