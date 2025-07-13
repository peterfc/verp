/**
 * Server-side Supabase helpers
 *
 * All server code (Route Handlers, Server Components, Server Actions, middleware)
 * should import one of the exports below instead of creating a new Supabase
 * client each time.
 *
 *  • createServerClient(cookieStore?)
 *  • createClient            – alias of createServerClient
 *  • createSupabaseClient    – alias of createServerClient
 *
 * Why the cookie store?
 * Supabase authentication is cookie-based.  By wiring the cookie helpers
 * into the Supabase client we:
 *   1. forward the user’s auth cookies on every request
 *   2. automatically persist any “set-cookie” headers Supabase returns
 *
 * This pattern mirrors the one recommended by the @supabase/ssr package.
 */

import { cookies as defaultCookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createServerClient as createSSRClient } from "@supabase/ssr"

/**
 * Returns a fully configured server-side Supabase client.
 *
 * @param cookieStore  – `cookies()` from next/headers (optional)
 */
export function createServerClient(cookieStore: ReturnType<typeof defaultCookies> = defaultCookies()): SupabaseClient {
  const supabase = createSSRClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })

  return supabase
}

/* ────────────────────────────────────────────────────────────────────
 * Aliases – so other files can import whichever name they expect
 * ------------------------------------------------------------------*/

export const createClient = createServerClient // legacy alias
export const createSupabaseClient = createServerClient // stylistic alias

export default createServerClient
