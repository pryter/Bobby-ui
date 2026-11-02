"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

// A short, silent, pre-rendered loop. It only loads and plays while it's on
// screen, and under reduced motion it stays on its poster (the loop's first
// frame, so the hand-off from poster to video is seamless).
export default function LoopVideo({
  src, poster, label, className = "", focus,
}: {
  src: string
  poster: string
  label: string
  className?: string
  focus?: string // object-position when the slot crops it
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const v = ref.current
    if (!v || reduce) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [reduce])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      aria-label={label}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      className={className}
      style={focus ? { objectPosition: focus } : undefined}
    />
  )
}
