import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  // Fetch organizations and their associated profiles
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*, organization_profiles(profile_id, profiles(id, name, email))") // Select organization_profiles and then join profiles
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching organizations:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the data structure for easier consumption on the frontend
  const formattedOrganizations = organizations.map((organization) => ({
    ...organization,
    profiles: organization.organization_profiles.map((op: any) => op.profiles), // Extract the nested profile object
  }))

  return NextResponse.json(formattedOrganizations)
}

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)
  const { name, contact, industry, profile_ids } = await request.json()

  // Start a transaction (conceptual, as Supabase client doesn't have explicit transactions for multiple calls)
  // In a real-world scenario, for atomicity, you might use a stored procedure or a single RPC call.
  const { data: newOrganization, error: organizationError } = await supabase
    .from("organizations")
    .insert([{ name, contact, industry }])
    .select()
    .single()

  if (organizationError) {
    console.error("Error creating organization:", organizationError)
    return NextResponse.json({ error: organizationError.message }, { status: 500 })
  }

  if (profile_ids && profile_ids.length > 0) {
    const organizationProfilesData = profile_ids.map((profile_id: string) => ({
      organization_id: newOrganization.id,
      profile_id: profile_id,
    }))

    const { error: opError } = await supabase.from("organization_profiles").insert(organizationProfilesData)

    if (opError) {
      console.error("Error associating profiles with new organization:", opError)
      // Optionally, roll back the organization creation here if opError is critical
      return NextResponse.json({ error: opError.message }, { status: 500 })
    }
  }

  return NextResponse.json(newOrganization, { status: 201 })
}
