import { createServerClient as createClient } from "@supabase/ssr"
import type { cookies } from "next/headers"

export const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable in server client.")
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable in server client.")
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        // Mark as async
        return (await cookieStore.get(name))?.value // Await the get call
      },
      async set(name: string, value: string, options: any) {
        // Mark as async
        try {
          await cookieStore.set({ name, value, ...options }) // Await the set call
        } catch (error) {
          // The `cookies().set()` method can only be called from a Server Component or Server Action.
          // This error is typically ignored if you're using Next.js with Supabase.
          // For more details: https://supabase.com/docs/guides/auth/server-side/nextjs
        }
      },
      async remove(name: string, options: any) {
        // Mark as async
        try {
          await cookieStore.set({ name, value: "", ...options }) // Await the set call (for removal)
        } catch (error) {
          // The `cookies().set()` method can only be called from a Server Component or Server Action.
          // This error is typically ignored if you're using Next.js with Supabase.
        }
      },
    },
  })
}
