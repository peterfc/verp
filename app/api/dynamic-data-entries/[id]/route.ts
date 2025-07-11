import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { data, error } = await supabase.from("dynamic_data_entries").select("*").eq("id", id).single()

    if (error) {
      console.error(`Error fetching dynamic data entry with ID ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Dynamic data entry not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Unexpected error fetching dynamic data entry with ID ${id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const body = await request.json()
    const { data } = body // Only 'data' field is expected for update

    if (!data) {
      return NextResponse.json({ error: "Missing 'data' field for update" }, { status: 400 })
    }

    const { data: updatedEntry, error } = await supabase
      .from("dynamic_data_entries")
      .update({ data, updated_at: new Date().toISOString() }) // Update data and timestamp
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating dynamic data entry with ID ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updatedEntry) {
      return NextResponse.json({ error: "Dynamic data entry not found or not authorized to update" }, { status: 404 })
    }

    return NextResponse.json(updatedEntry)
  } catch (error: any) {
    console.error(`Unexpected error updating dynamic data entry with ID ${id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  try {
    const { error } = await supabase.from("dynamic_data_entries").delete().eq("id", id)

    if (error) {
      console.error(`Error deleting dynamic data entry with ID ${id}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Dynamic data entry deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error(`Unexpected error deleting dynamic data entry with ID ${id}:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
