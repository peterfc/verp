import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

let client: ReturnType<typeof createSupabaseBrowserClient<Database>> | null = null

export function createBrowserClient() {
  if (client) {
    return client
  }

  client = createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return client
}

// Export as default and named export for compatibility
export default createBrowserClient
export const createClient = createBrowserClient
