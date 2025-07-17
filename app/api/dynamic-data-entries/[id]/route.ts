import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * GET /api/dynamic-data-entries/[id]
 * Fetch a single dynamic_data_entries row.
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("dynamic_data_entries").select("*").eq("id", id).maybeSingle()

  if (error) {
    console.error("GET dynamic_data_entries:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Dynamic data entry not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}

/**
 * PUT /api/dynamic-data-entries/[id]
 * Body: { data: Record<string, unknown> }
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServerClient();

  try {
    const { data: requestBody, error: bodyError } = await request.json()
    if (bodyError) {
      console.error("[SERVER] Error parsing request body:", bodyError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    console.log("[SERVER] PUT request body:", requestBody)
    console.log("[SERVER] Updating entry ID:", id)

    // Ensure 'data' field is present and is an object
    if (!requestBody || typeof requestBody !== "object") {
      return NextResponse.json({ error: "Missing or invalid 'data' field in request body" }, { status: 400 })
    }

    // Add updated_at timestamp
    const updatePayload = {
      data: requestBody,
      updated_at: new Date().toISOString(),
    }
    console.log("[SERVER] Update data:", updatePayload)

    const { error: updateError } = await supabase.from("dynamic_data_entries").update(updatePayload).eq("id", id)

    console.log("[SERVER] Update result - error:", updateError)

    if (updateError) {
      console.error("[SERVER] Supabase update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Verification fetch: Fetch the updated row to confirm the changes
    const { data: verifiedData, error: verificationError } = await supabase
      .from("dynamic_data_entries")
      .select("id, data, created_at, updated_at, data_type_id, organization_id")
      .eq("id", id)
      .single()

    console.log("[SERVER] Verification fetch - error:", verificationError, "data:", verifiedData)

    if (verificationError) {
      console.error("[SERVER] Verification fetch error:", verificationError)
      return NextResponse.json({ error: "Failed to verify update" }, { status: 500 })
    }

    if (!verifiedData) {
      return NextResponse.json({ error: "Dynamic data entry not found after update" }, { status: 404 })
    }

    // Log the actual data from the database after update
    console.log("[SERVER] Successfully updated entry. New data:", verifiedData.data)

    return NextResponse.json({ message: "Dynamic data entry updated", data: verifiedData.data }, { status: 200 })
  } catch (error: any) {
    console.error("[SERVER] Unexpected error in PUT handler:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

/**
 * DELETE /api/dynamic-data-entries/[id]
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createServerClient();

  try {
    const { error } = await supabase.from("dynamic_data_entries").delete().eq("id", id)

    if (error) {
      console.error("Error deleting dynamic data entry:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Dynamic data entry deleted successfully" }, { status: 200 })
  } catch (error: any) {
    console.error("Unexpected error in DELETE handler:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
