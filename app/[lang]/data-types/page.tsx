import { createClient } from "@/lib/supabase/server"
import { DataTypesClientPage } from "./data-types-client"
import { getDictionary } from "@/app/[lang]/dictionaries"
import type { DataType } from "@/types/data"
import { cookies } from "next/headers"

export default async function DataTypesPage({ params }: { params: Promise<{ lang: "en" | "es" }> }) {
  const { lang } = await params
  const supabase = await createClient()
  const dict = await getDictionary(lang)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let isManager = false

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("type").eq("id", user.id).single()
    if (profile) {
      isAdmin = profile.type === "Administrator"
      isManager = profile.type === "Manager"
    }
  }

  // Get current organization
  const cookieStore = await cookies()
  const currentOrganizationId = cookieStore.get("current-organization")?.value

  if (!isAdmin && !currentOrganizationId) {
    console.log("Non-admin user has no current organization set for data types")
    return (
      <DataTypesClientPage
        initialDataTypes={[]}
        lang={lang}
        dict={dict}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    )
  }

  // Use the same logic as the API endpoint for organization filtering
  let dataTypesQuery = supabase
    .from("data_types")
    .select("*")
    .order("created_at", { ascending: false })

  // If user is not an admin, filter by their current organization
  if (!isAdmin && currentOrganizationId) {
    console.log("Non-admin user, filtering data types for organization:", currentOrganizationId)
    dataTypesQuery = dataTypesQuery.eq("organization_id", currentOrganizationId)
  } else if (isAdmin) {
    console.log("Admin user, fetching all data types")
  }

  const { data: dataTypes, error } = await dataTypesQuery

  if (error) {
    console.error("Error fetching data types:", error)
    // If the migrations haven't run yet the table won't exist (code 42P01). 
    // Instead of crashing the UI, return an empty list so the page can still render.
    if (error.code === "42P01") {
      return (
        <DataTypesClientPage
          initialDataTypes={[]}
          lang={lang}
          dict={dict}
          isAdmin={isAdmin}
          isManager={isManager}
        />
      )
    }
    return <div className="text-red-500 p-4">{dict.dataTypesPage.failedToFetchDataTypes}</div>
  }

  if (!dataTypes?.length) {
    return (
      <DataTypesClientPage
        initialDataTypes={[]}
        lang={lang}
        dict={dict}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    )
  }

  // Collect distinct organization_ids
  const orgIds = [...new Set(dataTypes.map((d: any) => d.organization_id).filter(Boolean))]

  // Fetch those organizations
  const { data: orgs, error: orgError } = await supabase.from("organizations").select("id,name").in("id", orgIds)

  if (orgError) {
    console.error("Error fetching organizations for data types:", orgError)
    // Still return bare data_types if org lookup failed
    const initialDataTypes = dataTypes.map((d: any) => ({ ...d, organization: null }))
    return (
      <DataTypesClientPage
        initialDataTypes={initialDataTypes as DataType[]}
        lang={lang}
        dict={dict}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    )
  }

  const nameById: Record<string, string> = Object.fromEntries(orgs.map((o: any) => [o.id, o.name]))

  // Attach {id,name} to each data_type
  const initialDataTypes = dataTypes.map((d: any) => ({
    ...d,
    organization: d.organization_id ? { id: d.organization_id, name: nameById[d.organization_id] ?? "N/A" } : null,
  }))

  return (
    <DataTypesClientPage
      initialDataTypes={initialDataTypes as DataType[]}
      lang={lang}
      dict={dict}
      isAdmin={isAdmin}
      isManager={isManager}
    />
  )
}
