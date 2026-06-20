"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { LinkIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid"
import { createClient } from "@/lib/supabase/client"
import { claimPairingCode } from "@/lib/api"

export default function PairPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [errMsg, setErrMsg] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const handleClaim = async () => {
    setStatus("loading")
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/account")
        return
      }
      await claimPairingCode(code, session.access_token)
      setStatus("done")
      setTimeout(() => router.push("/dashboard/workers"), 1500)
    } catch (e) {
      setErrMsg((e as Error).message)
      setStatus("error")
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-white dark:bg-[#0d0d0f] text-gray-900 dark:text-white px-5 transition-colors">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-0 dark:opacity-100"
        style={{ background: "radial-gradient(ellipse at 50% 30%,rgb(var(--primary-400) / 0.04) 0%,transparent 60%)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 0.1, 0.35, 1] }}
        className="relative w-full max-w-sm rounded-3xl border border-gray-200/80 dark:border-white/[0.07]
                   bg-gray-50/60 dark:bg-white/[0.02] px-8 py-10"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
            <LinkIcon className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Link Worker</h1>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Claim pairing code{" "}
          <code className="rounded-lg bg-gray-100 dark:bg-white/[0.08] px-2 py-0.5 font-mono text-gray-800 dark:text-gray-200 text-xs">
            {code}
          </code>{" "}
          to link this worker to your account.
        </p>

        <AnimatePresence mode="wait">
          {status === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-5 flex items-center gap-2 text-sm font-medium text-[#1db954]"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Worker linked! Redirecting…
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-5 flex items-center gap-2 text-sm text-red-500 dark:text-red-400"
            >
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
              {errMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {status !== "done" && (
          <motion.button
            onClick={handleClaim}
            disabled={status === "loading"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-7 w-full py-3 rounded-full text-sm font-bold text-black
                       disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "rgb(var(--primary-400))" }}
          >
            {status === "loading" ? "Linking…" : "Confirm & Link Worker"}
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}
