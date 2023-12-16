import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { getServerSB } from "@server-lib/supabase"

export const getCallbackURL = (): string => {
  const base = window.location.origin
  return new URL("/auth/callback", base).toString()
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (!code) return redirect("/")

  const [client, h] = await getServerSB(request)

  await client.auth.exchangeCodeForSession(code)
  return redirect("/dashboard", {
    headers: h
  })
}
