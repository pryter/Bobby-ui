import { cache } from "react"
import { createClient } from "./supabase/server"

/**
 * Returns the current session, deduplicated per request via React cache.
 * The dashboard layout calls this first (as the auth gate), so by the time
 * any page server component calls it, the result is already cached — no
 * extra Supabase round-trip.
 */
export const getServerSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
})

export const getServerUserIdentities = cache(async () => {
  const supabase = await createClient()
  const { data: identities } = await supabase.auth.getUserIdentities()
  return identities
})
