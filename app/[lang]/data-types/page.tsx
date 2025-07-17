"use client"
import { createClient } from "@/lib/supabase/server"
import { DataTypesClientPage } from "./data-types-client"
import { getDictionary } from "@/app/[lang]/dictionaries"
import type { DataType } from "@/types/data"

interface Organization {
  id: string
  name: string
}

export default async function DataTypesPage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const supabase = createClient()
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

  const { data, error } = await supabase
    .from("data_types")
    .select(
      `
      id,
      name,
      organization_id,
      organization:organizations (name)
    `,
    )
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching data types:", error)
    return <div className="text-red-500 p-4">{dict.dataTypesPage.failedToFetchDataTypes}</div>
  }

  // Cast the fetched data to ensure the 'organization' object has the correct type
  const initialDataTypes = data?.map((dt) => ({
    ...dt,
    organization: dt.organization as { name: string } | undefined,
  })) as DataType[] | []

  return (
    <DataTypesClientPage
      initialDataTypes={initialDataTypes}
      lang={lang}
      dict={dict}
      isAdmin={isAdmin}
      isManager={isManager}
    />
  )
}
