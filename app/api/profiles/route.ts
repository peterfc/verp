import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const { data: profiles, error } = await supabase.from("profiles").select("*")

  if (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(profiles)
}

// POST is typically handled by Supabase Auth signup and a trigger/function
// For an admin to create profiles, a separate admin-level API would be needed.
// Keeping this route for consistency, but it won't be used by the current UI's "Add Profile"
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const { name, email, type } = await request.json() // Destructure 'type'

  // In a real app, you'd likely link this to auth.users or have an admin role
  // For now, this assumes an authenticated user is creating a profile for another user
  // which might require specific RLS policies or admin privileges.
  const { data, error } = await supabase.from("profiles").insert([{ name, email, type }]).select().single() // Include 'type' in insert

  if (error) {
    console.error("Error creating profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
