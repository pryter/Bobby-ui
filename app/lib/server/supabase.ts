import { createServerClient, parse, serialize } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export const getServerSB = async (
  request: Request
): Promise<[SupabaseClient, Headers]> => {
  const cookies = parse(request.headers.get("Cookie") ?? "")
  const headers = new Headers()
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!
  }

  const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      get(key) {
        return cookies[key]
      },
      set(key, value, options) {
        headers.append("Set-Cookie", serialize(key, value, options))
      },
      remove(key, options) {
        headers.append("Set-Cookie", serialize(key, "", options))
      }
    }
  })

  return [supabase, headers]
}
