import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataTypeId = searchParams.get("dataTypeId")

  if (!dataTypeId) {
    return NextResponse.json({ error: "dataTypeId is required" }, { status: 400 })
  }

  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data, error } = await supabase
      .from("dynamic_data_entries")
      .select("*")
      .eq("data_type_id", dataTypeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching dynamic data entries:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Unexpected error fetching dynamic data entries:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const body = await request.json()
    const { data_type_id, organization_id, data } = body

    if (!data_type_id || !organization_id || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: newEntry, error } = await supabase
      .from("dynamic_data_entries")
      .insert({ data_type_id, organization_id, data })
      .select()
      .single()

    if (error) {
      console.error("Error creating dynamic data entry:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(newEntry, { status: 201 })
  } catch (error: any) {
    console.error("Unexpected error creating dynamic data entry:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
