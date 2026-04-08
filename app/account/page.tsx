"use client"
import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/useTheme"
import { TextInput } from "@/components/Forms/TextInput"

type OAuthProvider = "github" | "google"

// Bobby mark — same path as the landing hero tile
const BobbyMark = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 106 102" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M 95.59375 67.023438 L 95.609375 17.179688 C 95.610001 12.229996 91.550003 8.239998 86.589996 8.339996 C 81.720001 8.43 77.919998 12.610001 77.919998 17.470001 L 77.921875 32.132813 C 77.919998 36.360001 74.559998 39.91 70.330002 39.950001 L 68.539063 39.84375 C 64.690002 39.32 61.84 35.979996 61.84 32.089996 L 61.84375 18.078125 C 61.84 14.139999 59.560001 10.470001 55.919998 8.959999 C 52.259998 7.440002 49.66 9.010002 47.189999 10.520004 C 44.529999 12.129997 36.509998 16.379997 36.509998 16.379997 L 36.03125 16.640625 L 35.546875 16.382813 C 35.549999 16.379997 27.440001 12.099998 25.32 10.770004 C 22.82 9.199997 20.280001 7.440002 16.540001 8.870003 C 12.78 10.309998 10.39 14.050003 10.39 18.089996 L 10.390625 67.023438 C 10.84 79.970001 21.459999 90.339996 34.509998 90.339996 L 71.492188 90.34375 C 84.540001 90.339996 95.160004 79.970001 95.59375 67.023438 Z M 23.25 40.460938 C 21.219999 39.689999 19.780001 37.729996 19.780001 35.419998 C 19.780001 33.110001 21.219999 31.150002 23.25 30.370003 C 23.860001 30.129997 24.52 30 25.200001 30 C 26.26 30 27.24 30.309998 28.08 30.839996 C 29.6 31.800003 30.610001 33.490005 30.610001 35.419998 C 30.610001 37.349998 29.6 39.049999 28.08 40 C 27.24 40.529999 26.26 40.830002 25.200001 40.830002 C 24.52 40.830002 23.860001 40.700001 23.25 40.460938 Z M 44.15625 39.609375 C 42.939999 38.619999 42.169998 37.110001 42.169998 35.419998 C 42.169998 33.729996 42.939999 32.220001 44.16 31.229996 C 45.09 30.459999 46.279999 30 47.580002 30 C 49.07 30 50.41 30.599998 51.389999 31.57 C 52.389999 32.559998 53 33.919998 53 35.419998 C 53 36.93 52.389999 38.279999 51.389999 39.259998 C 50.41 40.240002 49.07 40.830002 47.580002 40.830002 C 46.279999 40.830002 45.09 40.369999 44.15625 39.609375 Z M 34.507813 81.492188 C 26.360001 81.489998 19.68 75.07 19.26 67.019997 L 29.6875 67.023438 L 29.6875 60.148438 C 29.690001 58.169998 31.290001 56.57 33.27 56.57 L 42.1875 56.570313 C 44.169998 56.57 45.77 58.169998 45.77 60.150002 L 45.773438 67.023438 L 58.632813 67.023438 L 58.632813 60.148438 C 58.630001 58.169998 60.23 56.57 62.209999 56.57 L 71.132813 56.570313 C 73.110001 56.57 74.709999 58.169998 74.709999 60.150002 L 74.710938 67.023438 L 86.742188 67.023438 C 86.32 75.07 79.639999 81.489998 71.489998 81.489998 Z"
    />
  </svg>
)

export default function AccountPage() {
  const [signingIn, setSigningIn] = useState<OAuthProvider | null>(null)
  // Consume shared theme so navigating here preserves the user's choice made
  // on the landing page (instead of snapping back to system preference).
  useTheme()

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    if (signingIn) return
    setSigningIn(provider)
    const supabase = createClient()

    const getUrl = () => {
      const base =
        window.location.hostname === "localhost"
          ? "http://localhost:3000"
          : "https://bobby.host"
      return new URL("/auth/callback", base).href
    }

    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getUrl() },
    })

    setTimeout(() => setSigningIn(null), 20 * 1000)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden
                    bg-white dark:bg-bobby-bg
                    text-gray-900 dark:text-white transition-colors">
      {/* ── Background (mirrors the landing hero) ─────────────────────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Dotted grid */}
        <div
          className="dark:hidden absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle,rgba(0,0,0,0.055) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          className="hidden dark:block absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Center indigo glow */}
        <div
          className="hidden dark:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]"
          style={{
            background:
              "radial-gradient(circle,rgba(99,102,241,0.14) 0%,rgba(124,77,255,0.05) 45%,transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Drifting orbs using tile palette */}
        <div
          className="hidden dark:block absolute top-[18%] left-[14%] w-96 h-96 animate-orb-1 opacity-20"
          style={{
            background:
              "radial-gradient(circle,rgba(37,99,235,0.7) 0%,transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="hidden dark:block absolute bottom-[10%] right-[10%] w-80 h-80 animate-orb-2 opacity-15"
          style={{
            background:
              "radial-gradient(circle,rgba(240,78,48,0.6) 0%,transparent 70%)",
            filter: "blur(70px)",
          }}
        />
      </div>

      {/* ── Card ──────────────────────────────────────────────────────── */}
      <div className="relative flex min-h-screen w-full items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.1, 0.35, 1] }}
          className="relative w-full max-w-[400px] rounded-3xl overflow-hidden
                     border border-gray-200/80 dark:border-white/[0.08]
                     bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl
                     shadow-xl shadow-black/5 dark:shadow-black/40"
        >
          {/* Top accent gradient — same lime glow used on landing CTA */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%,rgba(163,230,53,0.12) 0%,transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center px-8 pb-8 pt-10">
            {/* Bobby tile — monochrome: black in light mode, white in dark mode */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="relative flex h-16 w-16 items-center justify-center mb-5
                         bg-gray-900 dark:bg-white
                         shadow-[0_8px_24px_2px_rgba(0,0,0,0.25)]
                         dark:shadow-[0_8px_24px_2px_rgba(255,255,255,0.12)]"
              style={{ borderRadius: "clamp(12px, 22%, 20px)" }}
            >
              <BobbyMark className="h-10 w-10 text-white dark:text-gray-900" />
            </motion.div>

            <h1 className="text-center text-3xl font-black tracking-tight
                           text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 mb-6 text-center text-sm leading-relaxed
                          text-gray-500 dark:text-gray-400">
              {signingIn
                ? `Redirecting to ${signingIn}…`
                : "Sign in to keep shipping with Bobby."}
            </p>

            {/* OAuth row */}
            <div className="flex w-full gap-3">
              <button
                onClick={() => handleOAuthLogin("google")}
                disabled={signingIn !== null && signingIn !== "google"}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl
                           border border-gray-200 bg-white text-sm font-semibold text-gray-800
                           dark:border-white/10 dark:bg-white/[0.04] dark:text-white
                           hover:bg-gray-50 dark:hover:bg-white/[0.08]
                           transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingIn === "google" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Google</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleOAuthLogin("github")}
                disabled={signingIn !== null && signingIn !== "github"}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl
                           border border-gray-200 bg-white text-sm font-semibold text-gray-800
                           dark:border-white/10 dark:bg-white/[0.04] dark:text-white
                           hover:bg-gray-50 dark:hover:bg-white/[0.08]
                           transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingIn === "github" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <GithubIcon />
                    <span>GitHub</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]
                               text-gray-400 dark:text-gray-500">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.08]" />
            </div>

            {/* Email / password */}
            <div className="w-full space-y-5">
              <TextInput placeholder="you@domain.com" title="Email" type="email" />
              <TextInput placeholder="••••••••" title="Password" type="password" />
            </div>

            {/* Primary CTA — lime, matches landing "Get started" */}
            <button
              onClick={() => {}}
              className="mt-6 w-full rounded-full py-3 text-sm font-bold text-black
                         bg-bobby-lime shadow-lg shadow-bobby-lime/20
                         transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in
            </button>

            <Link
              href="/account/forgot"
              className="mt-4 text-xs font-semibold tracking-wide
                         text-gray-500 hover:text-gray-900
                         dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ── Inline provider icons (smaller variants for the new pill buttons) ────────
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 98 96" className="text-gray-900 dark:text-white">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      fill="currentColor"
    />
  </svg>
)
