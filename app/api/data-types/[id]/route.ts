import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = await params
  const { data: dataType, error } = await supabase.from("data_types").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching data type:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!dataType) {
    return NextResponse.json({ error: "Data Type not found" }, { status: 404 })
  }

  return NextResponse.json(dataType)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = params
  const { name, fields, organization_id } = await request.json()

  let data, error
  try {
    ;({ data, error } = await supabase
      .from("data_types")
      .update({ name, fields, organization_id, updated_at: new Date().toISOString() }) // Set updated_at here
      .eq("id", id)
      .select()
      .single()
      .throwOnError())
  } catch (err: any) {
    console.error("Error updating data type:", err)
    const status = err?.code === "42501" ? 403 : 500
    return NextResponse.json({ error: err?.message || "Unable to update data type." }, { status })
  }

  if (!data) {
    return NextResponse.json({ error: "Data Type not found or no changes made" }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = params

  const { error } = await supabase.from("data_types").delete().eq("id", id)
  if (error) {
    console.error("Error deleting data type:", error)
    const status = error.code === "42501" ? 403 : 500
    return NextResponse.json({ error: error.message }, { status })
  }

  return new Response(null, { status: 204 })
}
