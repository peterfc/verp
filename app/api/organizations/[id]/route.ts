import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = params
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*, organization_profiles(profile_id, profiles(id, name, email))")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching organization:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  // Flatten the data structure
  const formattedOrganization = {
    ...organization,
    profiles: organization.organization_profiles.map((op: any) => op.profiles),
  }

  return NextResponse.json(formattedOrganization)
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = params
  const { name, contact, industry, profile_ids } = await request.json()

  // Update organization details
  const { data: updatedOrganization, error: organizationError } = await supabase
    .from("organizations")
    .update({ name, contact, industry })
    .eq("id", id)
    .select()
    .single()

  if (organizationError) {
    console.error("Error updating organization:", organizationError)
    return NextResponse.json({ error: organizationError.message }, { status: 500 })
  }

  if (!updatedOrganization) {
    return NextResponse.json({ error: "Organization not found or no changes made" }, { status: 404 })
  }

  // Update organization_profiles associations
  // 1. Delete existing associations for this organization
  const { error: deleteError } = await supabase.from("organization_profiles").delete().eq("organization_id", id)

  if (deleteError) {
    console.error("Error deleting old organization profiles:", deleteError)
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // 2. Insert new associations
  if (profile_ids && profile_ids.length > 0) {
    const organizationProfilesData = profile_ids.map((profile_id: string) => ({
      organization_id: id,
      profile_id: profile_id,
    }))

    const { error: insertError } = await supabase.from("organization_profiles").insert(organizationProfilesData)

    if (insertError) {
      console.error("Error inserting new organization profiles:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Re-fetch the updated organization with its new profiles for the response
  const { data: finalOrganization, error: fetchError } = await supabase
    .from("organizations")
    .select("*, organization_profiles(profile_id, profiles(id, name, email))")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error re-fetching organization after update:", fetchError)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const formattedFinalOrganization = {
    ...finalOrganization,
    profiles: finalOrganization.organization_profiles.map((op: any) => op.profiles),
  }

  return NextResponse.json(formattedFinalOrganization)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  const { id } = params

  // ON DELETE CASCADE on foreign keys in organization_profiles table will handle deleting associations
  const { error } = await supabase.from("organizations").delete().eq("id", id)

  if (error) {
    console.error("Error deleting organization:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
