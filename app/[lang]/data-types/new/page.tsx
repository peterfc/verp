import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"
import { DataTypeNewForm } from "./data-type-new-form"
import { type DataType } from "@/types/data" // Import DataType type
import { type Database } from "@/types/database" // Import Database type

// Define a type for the raw data returned by the Supabase query
// This matches the structure of the `data_types` table row with the joined `organizations` name
type DataTypeWithOrganizationName = Database['public']['Tables']['data_types']['Row'] & {
  organizations: { name: string } | null; // Use null for safety, though !inner implies non-null
};

interface PageProps {
  params: {
    lang: string
  }
}

export default async function NewDataTypePage({ params }: PageProps) {
  const { lang } = params;
  const supabase = await createServerClient();

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

  // Fetch organizations
  const { data: organizations } = await supabase.from("organizations").select("id, name").order("name")

  // Fetch all available data types for reference fields
  const { data: availableDataTypesRaw, error: availableDataTypesError } = await supabase
    .from("data_types")
    .select(`
      id,
      name,
      organization_id,
      organizations!inner(name)
    `)
    .order("name") as { data: DataTypeWithOrganizationName[] | null, error: any }; // Explicitly cast the result

  if (availableDataTypesError) {
    console.error("Error fetching available data types:", availableDataTypesError);
    // Depending on desired behavior, you might want to throw an error or return an empty array
    // For now, we'll proceed with an empty array if there's an error.
  }

  // Transform the data to match expected format (DataType interface)
  const transformedDataTypes: DataType[] =
    availableDataTypesRaw?.map((dt) => ({
      id: dt.id,
      name: dt.name,
      fields: [], // Fields are not needed for reference selection, so an empty array is fine
      organization_id: dt.organization_id,
      organization: dt.organizations ? { name: dt.organizations.name } : undefined, // Safely access organization name
    })) || [];

  return (
    <DataTypeNewForm
      organizations={organizations || []}
      availableDataTypes={transformedDataTypes}
      lang={lang}
      isAdmin={isAdmin}
      isManager={isManager}
    />
  )
}
