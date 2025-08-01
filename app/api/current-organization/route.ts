import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current organization from cookies
    const cookieStore = await cookies()
    const currentOrganizationId = cookieStore.get("current-organization")?.value

    if (!currentOrganizationId) {
      return NextResponse.json({ error: "No current organization set" }, { status: 400 })
    }

    // Fetch the organization details
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", currentOrganizationId)
      .single()

    if (error) {
      console.error("Error fetching current organization:", error)
      return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Error in current-organization API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
