import { notFound } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DataTypeEditForm } from "./data-type-edit-form"

interface Organization {
  id: string
  name: string
}

interface Field {
  name: string
  type: string
  options?: string[]
}

interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string }
}

interface EditDataTypePageProps {
  params: {
    lang: string
    id: string
  }
}

export default async function EditDataTypePage({
  params,
}: {
  params: { lang: "en" | "es"; id: string }
}) {
  const { lang, id } = params
  const supabase = await createServerClient()

  // Fetch the data type
  const { data: dataType, error: dataTypeError } = await supabase
    .from("data_types")
    .select(`
      id,
      name,
      fields,
      organization_id,
      organization:organizations(name)
    `)
    .eq("id", id)
    .single()

  if (dataTypeError || !dataType) {
    notFound()
  }

  // Fetch organizations for the dropdown
  const { data: organizations, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name")

  if (orgsError) {
    console.error("Error fetching organizations:", orgsError)
  }

  return (
    <div className="container mx-auto py-6">
      <DataTypeEditForm lang={lang} dataType={dataType as DataType} organizations={organizations || []} />
    </div>
  )
}
