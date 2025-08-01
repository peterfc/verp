import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getDictionary } from "../dictionaries"

interface Organization {
  id: string
  name: string
  industry?: string
  created_at: string
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ lang: "en" | "es" }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const supabase = await createServerClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login")
  }

  // Get current organization from cookies
  const cookieStore = await cookies()
  const currentOrganizationId = cookieStore.get("current-organization")?.value

  if (!currentOrganizationId) {
    redirect(`/${lang}/select-organization`)
  }

  // Fetch the current organization
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", currentOrganizationId)
    .single()

  if (orgError || !organization) {
    console.error("Error fetching organization:", orgError)
    redirect(`/${lang}/select-organization`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">{dict.organizationPage.title}</h1>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-lg">{organization.name}</p>
            </div>
            {organization.industry && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Industry</label>
                <p className="text-lg">{organization.industry}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-lg">
                {new Date(organization.created_at).toLocaleDateString(lang === "es" ? "es-ES" : "en-US")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
