"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { RocketLaunchIcon } from "@heroicons/react/24/solid"

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Features", href: "/#features" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/docs/faq" },
]

// Shared state between DeepDiveSection (producer) and Navbar (consumer). When
// the mobile timeline has fully morphed into its pill AND the deep-dive
// section is still on-screen, we ask the mobile nav to collapse to just
// [logo | menu button] and hide the floating "Get started" CTA — this gives
// the centered pill timeline room to breathe and turns the nav row into a
// three-part composition: logo · pill · menu.
export const DeepDiveNavContext = createContext<{
  compact: boolean
  setCompact: (v: boolean) => void
}>({
  compact: false,
  setCompact: () => {},
})

const BobbyMark = () => (
  <svg width={20} height={20} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="white"
      d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"
    />
  </svg>
)

export default function Navbar({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [winH, setWinH] = useState(844)

  const { compact } = useContext(DeepDiveNavContext)

  useEffect(() => {
    const measure = () => setWinH(window.innerHeight)
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const spring = { type: "spring", stiffness: 320, damping: 32 } as const

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 sm:hidden bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP pill ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 0.1, 0.35, 1] }}
        className="fixed top-5 inset-x-0 z-[60] hidden sm:flex sm:justify-center px-4"
      >
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full
                        bg-[#111]/90 backdrop-blur-xl
                        border border-white/[0.08] shadow-xl shadow-black/30">
          <Link href="/" className="flex items-center gap-0.5 px-2 mr-1">
            <div className="w-6 h-6 flex items-center justify-center -mt-0.5">
              <BobbyMark />
            </div>
            <span className="text-white text-sm font-semibold">Bobby</span>
          </Link>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <button
            onClick={onToggle}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs ml-1"
            aria-label="Toggle theme"
          >
            {dark ? "○" : "●"}
          </button>
          <button
            onClick={() => router.push("/account")}
            className="ml-1 px-4 py-1.5 rounded-full text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            style={{ background: "#a3e635" }}
          >
            Get started
          </button>
        </div>
      </motion.div>

      {/* ── MOBILE morphing element ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14, borderRadius: 9999 }}
        animate={{
          opacity: 1,
          y: 0,
          width: menuOpen ? 288 : "auto",
          height: menuOpen ? winH - 32 : "auto",
          borderRadius: menuOpen ? 24 : 100,
          top: menuOpen ? 16 : 20,
        }}
        transition={{
          opacity: { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          y: { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          width: spring,
          height: spring,
          borderRadius: spring,
          top: spring,
        }}
        className="fixed left-4 z-[60] sm:hidden overflow-hidden
                   bg-[#111]/90 backdrop-blur-xl
                   border border-white/[0.08] shadow-xl shadow-black/40"
      >
        {/* Pill content layer */}
        <motion.div
          animate={{ opacity: menuOpen ? 0 : 1 }}
          transition={{ duration: menuOpen ? 0.08 : 0.18, delay: menuOpen ? 0 : 0.22 }}
          className={
            "flex items-center gap-1 py-1.5 " +
            (compact ? "pl-1.5 pr-1" : "pl-2 pr-1")
          }
          style={{ pointerEvents: menuOpen ? "none" : "auto" }}
        >
          <Link
            href="/"
            className={
              "flex items-center gap-0.5 " +
              (compact ? "px-1 mr-0" : "px-2 mr-1")
            }
          >
            <div className="w-6 h-6 flex items-center justify-center ">
              <BobbyMark />
            </div>
            <AnimatePresence initial={false}>
              {!compact && (
                <motion.span
                  key="wordmark"
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: "auto", marginLeft: 0 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="text-white text-sm font-semibold mt-0.5 overflow-hidden whitespace-nowrap"
                >
                  Bobby
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <AnimatePresence initial={false}>
            {!compact && (
              <motion.button
                key="theme"
                onClick={onToggle}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 32 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-xs overflow-hidden"
                aria-label="Toggle theme"
              >
                {dark ? "○" : "●"}
              </motion.button>
            )}
          </AnimatePresence>
          <button
            onClick={() => setMenuOpen(true)}
            className={
              "h-8 flex items-center justify-center rounded-full text-white bg-white/[0.12] hover:bg-white/20 transition-colors " +
              (compact ? "w-8 ml-0 mr-0" : "w-12 ml-0.5 mr-1")
            }
            aria-label="Open menu"
          >
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
              <rect y="0" width="15" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="4.75" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="9.5" width="15" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>
        </motion.div>

        {/* Sidebar content layer */}
        <motion.div
          animate={{ opacity: menuOpen ? 1 : 0 }}
          transition={{ duration: 0.18, delay: menuOpen ? 0.24 : 0 }}
          className="absolute inset-0 flex flex-col"
          style={{ pointerEvents: menuOpen ? "auto" : "none" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <Link href="/" className="flex items-center gap-0.5">
              <div className="w-6 h-6 flex items-center justify-center">
                <BobbyMark />
              </div>
              <span className="text-white text-sm mt-0.5 font-semibold">Bobby</span>
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-sm"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col px-3 py-4 gap-0.5 flex-1">
            {NAV_LINKS.map((l, i) => (
              <motion.div
                key={l.label}
                initial={false}
                animate={{ opacity: menuOpen ? 1 : 0, x: menuOpen ? 0 : -8 }}
                transition={{ delay: menuOpen ? i * 0.05 + 0.3 : 0, duration: 0.2, ease: [0.22, 0.1, 0.35, 1] }}
              >
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors text-left font-medium"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={false}
            animate={{ opacity: menuOpen ? 1 : 0 }}
            transition={{ delay: menuOpen ? 0.36 : 0, duration: 0.18 }}
            className="px-4 pb-8 flex flex-col gap-2"
          >
            <button
              onClick={onToggle}
              className="px-4 py-3 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors text-left flex items-center gap-2.5"
            >
              <span className="text-base leading-none">{dark ? "○" : "●"}</span>
              <span>{dark ? "Light mode" : "Dark mode"}</span>
            </button>
            <button
              onClick={() => {
                router.push("/account")
                setMenuOpen(false)
              }}
              className="w-full py-2.5 rounded-full text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
              style={{ background: "#a3e635" }}
            >
              Get started
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── MOBILE CTA ───────────────────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: -14 }}
        animate={{
          opacity: menuOpen ? 0 : 1,
          y: 0,
          width: compact ? 44 : "auto",
        }}
        transition={{
          opacity: { duration: 0.12 },
          y: { duration: 0.5, ease: [0.22, 0.1, 0.35, 1] },
          width: spring,
        }}
        onClick={() => router.push("/account")}
        className="fixed top-5 right-4 z-[60] sm:hidden h-11 shadow-md rounded-full font-bold text-black flex items-center justify-end overflow-hidden"
        style={{ background: "#a3e635", pointerEvents: menuOpen ? "none" : "auto" }}
        aria-label="Get started"
      >
        <motion.span
          animate={{ opacity: compact ? 0 : 1 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 text-xs whitespace-nowrap"
          aria-hidden={compact}
        >
          Get started
        </motion.span>
        <motion.span
          animate={{
            opacity: compact ? 1 : 0,
            scale: compact ? 1 : 0.6,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute right-0 top-0 h-11 w-11 flex items-center justify-center"
          aria-hidden={!compact}
        >
          <RocketLaunchIcon className="w-5 h-5" />
        </motion.span>
      </motion.button>
    </>
  )
}
