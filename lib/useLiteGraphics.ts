"use client"

import { useEffect, useState } from "react"

// Phones, touch tablets and low-memory devices get a lighter build of the
// heaviest 3D scenes: fewer composited layers, no mid-scene re-layouts. Their
// GPUs have far less memory, and a scene that's merely heavy on a laptop can
// get the tab killed there. False on the server and the first client render,
// so hydration matches; it settles straight after mount.
export function useLiteGraphics() {
  const [lite, setLite] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px), (pointer: coarse)")
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const update = () => setLite(mq.matches || (mem != null && mem <= 4))
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])
  return lite
}
