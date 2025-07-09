import { createBrowserClient as createClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// Keep a singleton.
let supabaseClient: SupabaseClient | null = null

export const createBrowserClient = (): SupabaseClient | null => {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. " +
        "Supabase client will not be initialized. Please ensure these are set in your Vercel project settings.",
    )
    return null // Return null if environment variables are missing
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
