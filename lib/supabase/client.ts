import { createBrowserClient as createClient } from "@supabase/ssr"

// Create a single Supabase client for client-side operations (singleton pattern)
let supabaseClient: ReturnType<typeof createClient> | null = null

export const createBrowserClient = () => {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Add these console logs for debugging
  console.log("DEBUG: NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Set" : "Not Set")
  console.log("DEBUG: NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Not Set")
  console.log("DEBUG: Full URL value (first 10 chars):", supabaseUrl ? supabaseUrl.substring(0, 10) : "N/A")
  console.log(
    "DEBUG: Full Anon Key value (first 10 chars):",
    supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : "N/A",
  )

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable in browser client.")
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable in browser client.")
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}
