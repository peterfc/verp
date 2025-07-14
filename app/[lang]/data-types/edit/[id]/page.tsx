import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { DataTypeEditForm } from "./data-type-edit-form"

interface PageProps {
  params: {
    lang: string
    id: string
  }
}

export default async function EditDataTypePage({ params }: PageProps) {
  const { lang, id } = params
  const cookieStore = await cookies()
  const supabase = await await createServerClient();

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
  const { data: availableDataTypes } = await supabase
    .from("data_types")
    .select(`
      id,
      name,
      organization_id,
      organizations!inner(name)
    `)
    .neq("id", id)
    .order("name")

  // Transform the data to match expected format
  const transformedDataTypes =
    availableDataTypes?.map((dt) => ({
      id: dt.id,
      name: dt.name,
      fields: [],
      organization_id: dt.organization_id,
      organization: { name: dt.organizations.name },
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
