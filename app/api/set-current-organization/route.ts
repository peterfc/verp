import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify that the user has access to this organization
    const { data: organizationProfile, error } = await supabase
      .from("organization_profiles")
      .select("organization_id")
      .eq("organization_id", organizationId)
      .eq("profile_id", user.id)
      .single()

    if (error || !organizationProfile) {
      return NextResponse.json({ error: "Access denied to this organization" }, { status: 403 })
    }

    // Set the organization cookie
    const cookieStore = await cookies()
    
    cookieStore.set("current-organization", organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting current organization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
