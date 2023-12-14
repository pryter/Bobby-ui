import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { getServerSB } from "@server-lib/supabase"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  let header = new Headers()

  if (code) {
    const [client, h] = await getServerSB(request)
    header = h
    await client.auth.exchangeCodeForSession(code)
  }

  return redirect("/dashboard", {
    headers: header
  })
}
