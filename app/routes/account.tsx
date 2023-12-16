import type { LoaderFunctionArgs } from "@remix-run/node"
import { json, redirect } from "@remix-run/node"
import { Outlet } from "@remix-run/react"
import { getServerSB } from "@server-lib/supabase"
import { useState } from "react"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const [sb] = await getServerSB(request)
  const {
    data: { session }
  } = await sb.auth.getSession()

  if (session) {
    return redirect("/dashboard")
  }

  return json({})
}

export default function Account() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center text-gray-800">
      {loading && <div className="curtain" />}
      <div className="relative flex w-full max-w-[360px] rounded-2xl border border-gray-900 bg-white">
        <Outlet context={{ setLoading }} />
      </div>
    </div>
  )
}
