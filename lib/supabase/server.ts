/**
 * Server-side Supabase helper
 *
 * Usage (Server Components, Route Handlers, Server Actions, middleware):
 *
 *   import { createServerClient } from "@/lib/supabase/server";
 *   const supabase = createServerClient();
 *
 * You can also pass an existing cookie store:
 *
 *   const supabase = createServerClient(cookies());
 */

import { createServerClient as createSSRClient } from "@supabase/ssr"
import { cookies as getCookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Returns a ready-to-use server-side Supabase client.
 *
 * @param cookieStore - optional cookie store from `next/headers`
 */
export function createServerClient(cookieStore: ReturnType<typeof getCookies> = getCookies()): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSSRClient(supabaseUrl, supabaseAnon, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: any) => cookieStore.set({ name, value, ...options }),
      remove: (name: string, options: any) => cookieStore.set({ name, value: "", ...options }),
    },
  })
}

/* ───────────── Aliases for backward compatibility ───────────── */
export const createClient = createServerClient
export const createSupabaseClient = createServerClient

export default createServerClient
