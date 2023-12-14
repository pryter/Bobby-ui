import type { SBEnv } from "@server-lib/loaders/loadEnv"
import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@typings/Database"

export const getClientSB = (env: SBEnv) => {
  return createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
}
