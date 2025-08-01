import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { getDictionary } from "../dictionaries"
import { OrganizationSelector } from "@/components/organization-selector"
import type { Organization } from "@/types/data"

export default async function SelectOrganizationPage({
  params,
}: {
  params: Promise<{ lang: "en" | "es" }>
}) {
  const { lang } = await params
  const supabase = await createServerClient()
  const dict = await getDictionary(lang)

  // Get current user with debugging
  console.log("SELECT-ORG PAGE: Attempting to get user session...")
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  console.log("SELECT-ORG PAGE: User data:", user?.email || "No user", "Error:", userError?.message || "No error")

  if (!user) {
    console.log("SELECT-ORG PAGE: No user found, redirecting to login")
    redirect(`/${lang}/login`)
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
    // Redirect to home if there's an error
    redirect(`/${lang}`)
  }

  const organizations = organizationProfiles?.map(op => op.organizations).filter(Boolean) as unknown as Organization[] || []

  console.log("Select-organization page debug:", {
    userEmail: user.email,
    organizationProfiles,
    organizations: organizations.map(org => ({ id: org.id, name: org.name })),
    organizationCount: organizations.length
  });

  // If user has no organizations, redirect to main page (they shouldn't be here)
  if (organizations.length === 0) {
    redirect(`/${lang}`)
  }

  // If user has only one organization, set it automatically and redirect
  if (organizations.length === 1) {
    const organizationId = organizations[0].id
    
    // We need to set the cookie on the server side for this automatic case
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    cookieStore.set("current-organization", organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })
    
    redirect(`/${lang}`)
  }

  return (
    <OrganizationSelector
      organizations={organizations}
      dict={(dict as any).organizationSelector}
      lang={lang}
    />
  )
}
