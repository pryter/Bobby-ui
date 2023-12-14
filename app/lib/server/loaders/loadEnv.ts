export interface SBEnv {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

export const loadEnv = (): SBEnv => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  };
  return env
}