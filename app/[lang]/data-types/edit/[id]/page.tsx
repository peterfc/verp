import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DataTypeEditForm } from "./data-type-edit-form"
import type { DataType, Organization } from "@/types/data"

// Server action to update the data type
async function updateDataType(formData: Partial<DataType>) {
  "use server"

  const supabase = await createServerClient()
  const { id, name, organization_id, fields } = formData

  if (!id) {
    return { error: { message: "Data Type ID is missing." } }
  }

  try {
    // Update the main data type properties, including the fields JSONB
    const { error: dataTypeError } = await supabase
      .from("data_types")
      .update({
        name,
        organization_id,
        fields,
      })
      .eq("id", id)

    if (dataTypeError) throw dataTypeError

    revalidatePath("/[lang]/data-types", "layout")
    return {}
  } catch (error: any) {
    console.error("Error updating data type:", error)
    return { error: { message: error.message || "Failed to update data type." } }
  }
}

interface PageProps {
  params: Promise<{
    lang: string
    id: string
  }>
}

interface RawDataTypeFromSupabase {
  id: string
  name: string
  organization_id: string
  organizations: { name: string } | null
}

export default async function EditDataTypePage({ params }: PageProps) {
  const { lang, id } = await params
  const supabase = await createServerClient()

  const { data: dataType, error: dataTypeError } = await supabase.from("data_types").select("*").eq("id", id).single()

  if (dataTypeError || !dataType) {
    notFound()
  }

  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations")
    .select("id, name, contact, industry")
    .order("name")

  if (organizationsError) {
    console.error("Error fetching organizations:", organizationsError)
  }

  const { data: availableDataTypes, error: availableDataTypesError } = (await supabase
    .from("data_types")
    .select(
      `
      id,
      name,
      organization_id,
      organizations!inner(name)
    `,
    )
    .neq("id", id)
    .order("name")) as { data: RawDataTypeFromSupabase[] | null; error: any }

  if (availableDataTypesError) {
    console.error("Error fetching available data types:", availableDataTypesError)
  }

  const transformedDataTypes: DataType[] =
    availableDataTypes?.map((dt) => ({
      id: dt.id,
      name: dt.name,
      fields: [],
      organization_id: dt.organization_id,
      organization: dt.organizations ? { name: dt.organizations.name } : undefined,
    })) || []

  return (
    <div className="container mx-auto py-6">
      <DataTypeEditForm
        initialData={dataType}
        organizations={(organizations || []) as Organization[]}
        availableDataTypes={transformedDataTypes}
        lang={lang}
        onSave={updateDataType}
      />
    </div>
  )
}
