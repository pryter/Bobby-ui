"use client"

import { useCallback, useSyncExternalStore } from "react"

// ── Shared theme state ───────────────────────────────────────────────────────
// Source of truth is the `dark` class on <html>. On first paint the inline
// script in app/layout.tsx seeds that class from localStorage (falling back to
// prefers-color-scheme), so every page mounts with the correct value already
// applied — no flash, no disagreement between routes.
//
// useTheme() subscribes to that class. The server can't see it, so server
// render and hydration both use SERVER_DEFAULT; React then re-renders straight
// away with the real value, without a hydration mismatch. Toggling writes back
// to both the class and localStorage so the choice persists across navigation.

export const THEME_STORAGE_KEY = "bobby-theme"
const SERVER_DEFAULT = true

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light")
  } catch {
    /* localStorage unavailable — ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", dark ? "#080808" : "#ffffff")
}

function subscribe(onChange: () => void) {
  // Any class change on <html> (our toggle, or another hook instance's)
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  // Keep in sync if another tab/page changes the preference
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY && e.newValue) apply(e.newValue === "dark")
  }
  window.addEventListener("storage", onStorage)
  return () => {
    mo.disconnect()
    window.removeEventListener("storage", onStorage)
  }
}

const getSnapshot = () => document.documentElement.classList.contains("dark")
const getServerSnapshot = () => SERVER_DEFAULT

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const toggle = useCallback(() => apply(!getSnapshot()), [])
  const setDark = useCallback((d: boolean) => apply(d), [])
  return { dark, toggle, setDark }
}
