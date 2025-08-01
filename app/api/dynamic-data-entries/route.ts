import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataTypeId = searchParams.get("dataTypeId")

  if (!dataTypeId) {
    return NextResponse.json({ error: "dataTypeId is required" }, { status: 400 })
  }

  const supabase = await createServerClient();

  try {
    // Get current user and check their role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check current user's profile type
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("type")
      .eq("id", user.id)
      .single()

    // If user is not an admin, verify the data type belongs to their current organization
    if (!currentProfile || currentProfile.type !== 'Administrator') {
      const cookieStore = await cookies()
      const currentOrganizationId = cookieStore.get("current-organization")?.value
      
      if (!currentOrganizationId) {
        return NextResponse.json({ error: "No organization selected" }, { status: 403 })
      }
      
      // Verify the data type belongs to the user's organization
      const { data: dataType, error: dataTypeError } = await supabase
        .from("data_types")
        .select("organization_id")
        .eq("id", dataTypeId)
        .single()
      
      if (dataTypeError) {
        console.error("Error fetching data type:", dataTypeError)
        return NextResponse.json({ error: "Data type not found" }, { status: 404 })
      }
      
      if (dataType.organization_id !== currentOrganizationId) {
        return NextResponse.json({ error: "Access denied to this data type" }, { status: 403 })
      }
    }

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
  const supabase = await createServerClient();

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
