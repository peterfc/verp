import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params
  const { name, email, type } = await request.json() // Destructure 'type'

  const { data, error } = await supabase.from("profiles").update({ name, email, type }).eq("id", id).select().single() // Include 'type' in update

  if (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found or no changes made" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createServerClient();
  const { id } = params

  // When deleting a profile, you might also want to delete the associated auth.user
  // This requires admin privileges. For now, RLS on profiles table will prevent
  // a user from deleting another user's profile.
  const { error } = await supabase.from("profiles").delete().eq("id", id)

  if (error) {
    console.error("Error deleting profile:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
