import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { DataTypeEditForm } from "./data-type-edit-form"
import type { DataType } from "@/types/data" // Import DataType and Field from centralized types

interface PageProps {
  params: {
    lang: string
    id: string
  }
}

// Define a type for the raw data returned from Supabase for availableDataTypes
interface RawDataTypeFromSupabase {
  id: string
  name: string
  organization_id: string
  organizations: { name: string } | null // organizations can be null if no join match
}

export default async function EditDataTypePage({ params }: PageProps) {
  const { lang, id } = params
  const cookieStore = await cookies()
  const supabase = await createServerClient()

  // Get current user and check permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  // Get user profile to check permissions
  const { data: userProfile } = await supabase.from("profiles").select("type").eq("id", user.id).single()

  const isAdmin = userProfile?.type === "Administrator"
  const isManager = userProfile?.type === "Manager"

  if (!isAdmin && !isManager) {
    notFound()
  }

  // Fetch the data type
  const { data: dataType, error: dataTypeError } = await supabase.from("data_types").select("*").eq("id", id).single()

  if (dataTypeError || !dataType) {
    notFound()
  }

  // Fetch organizations
  const { data: organizations } = await supabase.from("organizations").select("id, name").order("name")

  // Fetch all available data types for reference fields (excluding the current one)
  const { data: availableDataTypes, error: availableDataTypesError } = (await supabase
    .from("data_types")
    .select(`
      id,
      name,
      organization_id,
      organizations!inner(name)
    `)
    .neq("id", id)
    .order("name")) as { data: RawDataTypeFromSupabase[] | null; error: any } // Cast to the raw type

  if (availableDataTypesError) {
    console.error("Error fetching available data types:", availableDataTypesError)
    // Handle error appropriately, e.g., return empty array or throw
  }

  // Transform the data to match expected format
  const transformedDataTypes: DataType[] =
    availableDataTypes?.map((dt) => ({
      id: dt.id,
      name: dt.name,
      fields: [], // Fields are not needed for reference selection, so an empty array is fine
      organization_id: dt.organization_id,
      organization: dt.organizations ? { name: dt.organizations.name } : undefined, // Safely access organization name
    })) || []

  return (
    <DataTypeEditForm
      dataType={dataType}
      organizations={organizations || []}
      availableDataTypes={transformedDataTypes}
      lang={lang}
      isAdmin={isAdmin}
      isManager={isManager}
    />
  )
}
