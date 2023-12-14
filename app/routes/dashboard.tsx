import type { LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { useNavigate } from "@remix-run/react"
import { getServerSB } from "@server-lib/supabase"
import { useEffect } from "react"

import { useSupabase } from "@/root"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [sb] = await getServerSB(request)
  const {
    data: { session }
  } = await sb.auth.getSession()

  if (!session) {
    return redirect("/account")
  }

  return json({})
}
export default function Dashboard() {
  const supabase = useSupabase()
  const navigate = useNavigate()

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((e, s) => {
      if (!s) {
        navigate("/account")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-gray-900">
      <h1 className="animate-pulse text-3xl font-medium tracking-wide text-gray-700">
        Upcoming
      </h1>
      <p className="mb-3 tracking-wide">This feature is not yet coming.</p>
      <button
        onClick={() => {
          supabase.auth.signOut()
        }}
        className="mt-6 rounded-lg bg-gray-900 px-8 py-2 text-sm font-medium tracking-wide text-white"
      >
        Sign out
      </button>
    </div>
  )
}
