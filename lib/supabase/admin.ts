import { createClient } from "@supabase/supabase-js"

/**
 * Admin client for Supabase operations that require service role key
 * Use only for server-side admin operations like:
 * - auth.admin.listUsers()
 * - auth.admin.inviteUserByEmail()
 * - auth.admin.deleteUser()
 * - Bypassing RLS for admin operations
 */
export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined")
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not defined")
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
