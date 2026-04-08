"use client"

import { useCallback, useEffect, useState } from "react"

// ── Shared theme state ───────────────────────────────────────────────────────
// Source of truth is the `dark` class on <html>. On first paint the inline
// script in app/layout.tsx seeds that class from localStorage (falling back to
// prefers-color-scheme), so every page mounts with the correct value already
// applied — no flash, no disagreement between routes.
//
// useTheme() reads the current class, and any page that toggles it writes back
// to both the class and localStorage so the choice persists across navigation.

export const THEME_STORAGE_KEY = "bobby-theme"

function readInitial(): boolean {
  if (typeof document === "undefined") return true
  return document.documentElement.classList.contains("dark")
}

export function useTheme() {
  const [dark, setDark] = useState<boolean>(readInitial)

  // Keep in sync if another tab/page changes the preference
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setDark(e.newValue === "dark")
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // Apply the current value to the DOM + persist it
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light")
    } catch {
      /* localStorage unavailable — ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", dark ? "#080808" : "#ffffff")
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])

  return { dark, toggle, setDark }
}
