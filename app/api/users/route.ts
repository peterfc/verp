import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createServerClient()
  const { data: users, error } = await supabase.from("users").select("*")

  if (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const supabase = createServerClient()
  const { name, email } = await request.json()

  const { data, error } = await supabase.from("users").insert([{ name, email }]).select().single()

  if (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
