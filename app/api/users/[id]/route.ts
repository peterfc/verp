import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { id } = params
  const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { id } = params
  const { name, email } = await request.json()

  const { data, error } = await supabase.from("users").update({ name, email }).eq("id", id).select().single()

  if (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "User not found or no changes made" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { id } = params

  const { error } = await supabase.from("users").delete().eq("id", id)

  if (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
