"use client"

// ─── Pre-baked scroll animations ──────────────────────────────────────────────
// A section's scroll-linked styles, sampled into keyframes once (and again on
// resize), then played by the browser against the scroll position:
//
//   • with scroll timelines (ViewTimeline) the compositor runs them — no
//     JavaScript at all while scrolling, so a busy main thread can't make them
//     stutter;
//   • elsewhere the same animations sit paused and one passive scroll listener
//     moves their playhead — a single assignment per frame.
//
// Positions are in px of scroll since the section's top reached the top of the
// viewport (negative before), matching framer's ["start start", "end start"].

export type ScrubTrack = {
  el: HTMLElement
  /** The element's styles at a scroll position. */
  at: (px: number) => Keyframe
  /** Where the styles change; they hold their end values outside it. */
  from: number
  to: number
  samples: number
  /** Positions where the styles jump (a wrapping pattern): `at` is sampled
   *  just before and just after each, at the same keyframe offset. */
  jumps?: number[]
}

type ViewTimelineCtor = new (options: { subject: Element; axis: "block" | "inline" }) => AnimationTimeline

/** `H`: the section's height; `viewport`: the viewport's height (both px). */
export function bakeScrub(section: HTMLElement, tracks: ScrubTrack[], geo: { H: number; viewport: number }): () => void {
  // A view timeline's "cover" range runs from the section's top at the
  // viewport's bottom (px = −viewport) to its bottom at the viewport's top (px = H).
  const span = geo.H + geo.viewport
  const offset = (px: number) => Math.min(1, Math.max(0, (px + geo.viewport) / span))
  const VT = (window as unknown as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline
  const timeline = VT ? new VT({ subject: section, axis: "block" }) : null

  const anims = tracks.map((t) => {
    const pts: { px: number; kf: Keyframe }[] = []
    for (let k = 0; k <= t.samples; k++) {
      const px = t.from + ((t.to - t.from) * k) / t.samples
      pts.push({ px, kf: t.at(px) })
    }
    const eps = 1e-3
    for (const j of t.jumps ?? []) pts.push({ px: j, kf: t.at(j - eps) }, { px: j, kf: t.at(j + eps) })
    pts.sort((a, b) => a.px - b.px) // stable: a jump's before stays ahead of its after
    const frames: Keyframe[] = [{ ...t.at(t.from), offset: 0 }]
    for (const p of pts) frames.push({ ...p.kf, offset: offset(p.px) })
    frames.push({ ...t.at(t.to), offset: 1 })
    return timeline
      ? t.el.animate(frames, { timeline, fill: "both", easing: "linear" })
      : t.el.animate(frames, { duration: 1000, fill: "both", easing: "linear" })
  })
  if (timeline) return () => anims.forEach((a) => a.cancel())

  // Fallback: scrub the playhead.
  anims.forEach((a) => a.pause())
  let raf = 0
  const sync = () => {
    raf = 0
    const c = Math.min(1, Math.max(0, (geo.viewport - section.getBoundingClientRect().top) / span))
    for (const a of anims) a.currentTime = c * 1000
  }
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(sync)
  }
  sync()
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onScroll)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("resize", onScroll)
    anims.forEach((a) => a.cancel())
  }
}
