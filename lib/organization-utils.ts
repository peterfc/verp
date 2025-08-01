import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import type { Organization } from "@/types/data"

export async function getCurrentOrganization(): Promise<{
  currentOrganization: Organization | null
  userOrganizations: Organization[]
  needsOrganizationSelection: boolean
}> {
  const supabase = await createServerClient()
  
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      currentOrganization: null,
      userOrganizations: [],
      needsOrganizationSelection: false,
    }
  }

  // Get user's organizations
  const { data: organizationProfiles, error } = await supabase
    .from("organization_profiles")
    .select(`
      organization_id,
      organizations (
        id,
        name,
        industry,
        contact
      )
    `)
    .eq("profile_id", user.id)

  if (error) {
    console.error("Error fetching user organizations:", error)
    return {
      currentOrganization: null,
      userOrganizations: [],
      needsOrganizationSelection: false,
    }
  }

  const userOrganizations = organizationProfiles
    ?.map(op => op.organizations)
    .filter(org => org !== null) as unknown as Organization[] || []

  // If user has no organizations, they don't need organization selection
  if (userOrganizations.length === 0) {
    return {
      currentOrganization: null,
      userOrganizations: [],
      needsOrganizationSelection: false,
    }
  }

  // Get current organization from cookie
  const cookieStore = await cookies()
  const currentOrganizationId = cookieStore.get("current-organization")?.value

  let currentOrganization: Organization | null = null

  if (currentOrganizationId) {
    // Verify the user still has access to this organization
    currentOrganization = userOrganizations.find(org => org.id === currentOrganizationId) || null
  }

  // If no valid current organization, user needs to select one (unless they only have one)
  const needsOrganizationSelection = !currentOrganization && userOrganizations.length > 1

  // If user only has one organization and no current org set, use that one
  if (!currentOrganization && userOrganizations.length === 1) {
    currentOrganization = userOrganizations[0]
  }

  return {
    currentOrganization,
    userOrganizations,
    needsOrganizationSelection,
  }
}
