"use client"

import { useEffect, useState, type RefObject } from "react"

/** Whether an element is on screen or within `margin` of it. Heavy scenes use
 *  it to go `visibility: hidden` while far away, which lets the browser drop
 *  their layers' memory (mobile Safari keeps them otherwise). True until
 *  measured, so nothing is hidden on the server or the first render. */
export function useNearViewport(ref: RefObject<Element | null>, margin = "100% 0px") {
  const [near, setNear] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return near
}
