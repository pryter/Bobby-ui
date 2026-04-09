"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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

  const containerRef = useRef<HTMLDivElement>(null)
  const searchAbort = useRef<AbortController | null>(null)
  const tagsAbort = useRef<AbortController | null>(null)

  // Keep query in sync if parent value changes externally (e.g. initial load)
  useEffect(() => {
    const { repo, tag } = splitImage(value)
    setQuery(repo)
    setSelectedRepo(repo)
    setSelectedTag(tag)
  }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }
    // Don't research if query matches the currently selected repo exactly
    if (q === selectedRepo || q === displayName(selectedRepo)) return

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
  }, [query, selectedRepo])

  // Fetch tags for the selected repo
  const fetchTags = useCallback(async (repoName: string) => {
    tagsAbort.current?.abort()
    const ctrl = new AbortController()
    tagsAbort.current = ctrl
    setLoadingTags(true)
    setTagsError(null)
    setTags([])
    try {
      const url = `/api/dockerhub/tags?repo=${encodeURIComponent(repoName)}&page_size=50`
      const res = await fetch(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(`Could not load tags (${res.status})`)
      const data = await res.json()
      setTags(Array.isArray(data.results) ? data.results : [])
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return
      setTagsError(err instanceof Error ? err.message : "Could not load tags")
    } finally {
      setLoadingTags(false)
    }
  }, [])

  function pickImage(r: HubSearchResult) {
    const repo = r.repo_name
    setSelectedRepo(repo)
    setSelectedTag("")
    setQuery(displayName(repo))
    setOpen(false)
    onChange(displayName(repo)) // no tag yet — parent value updated
    fetchTags(repo)
  }

  function pickTag(tagName: string) {
    setSelectedTag(tagName)
    const out = `${displayName(selectedRepo)}:${tagName}`
    onChange(out)
  }

  function clearSelection() {
    setSelectedRepo("")
    setSelectedTag("")
    setQuery("")
    setTags([])
    onChange("")
  }

  // When user edits the text freely, update parent immediately (free-form fallback)
  function handleQueryChange(v: string) {
    setQuery(v)
    setOpen(true)
    onChange(v)
    // If they clear the input, clear selection
    if (!v.trim()) {
      setSelectedRepo("")
      setSelectedTag("")
      setTags([])
    }
  }

  // Load tags on mount if we already have a selection
  useEffect(() => {
    if (initialRepo && !tags.length && !loadingTags) {
      fetchTags(initialRepo)
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
          {!loadingTags && !tagsError && tags.length > 0 && (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-white/[0.08]">
              {tags.map((t) => {
                const active = t.name === selectedTag
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => pickTag(t.name)}
                    title={`${formatBytes(t.full_size)} · ${formatRelativeTime(t.last_updated)}`}
                    className={`rounded-md border px-2 py-0.5 font-mono text-xs transition ${
                      active
                        ? "border-bobby-lime bg-bobby-lime/10 text-bobby-lime"
                        : "border-gray-200 bg-white text-gray-700 hover:border-bobby-lime/50 dark:border-white/[0.10] dark:bg-white/[0.03] dark:text-gray-200"
                    }`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
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
