"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-gray-900">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-lg">
        <h1 className="text-2xl font-bold">Link Worker</h1>
        <p className="mt-2 text-sm text-gray-600">
          Claim pairing code{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">{code}</code>{" "}
          to link this worker to your account.
        </p>

        {status === "done" && (
          <p className="mt-4 text-sm font-medium text-green-700">Worker linked! Redirecting…</p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm text-red-600">{errMsg}</p>
        )}

        {status !== "done" && (
          <button
            onClick={handleClaim}
            disabled={status === "loading"}
            className="mt-6 w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === "loading" ? "Linking…" : "Confirm & Link Worker"}
          </button>
        )}
      </div>
    </div>
  )
}
