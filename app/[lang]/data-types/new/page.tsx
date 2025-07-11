"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface Organization {
  id: string
  name: string
}

export default function NewDataTypePage({ params: { lang } }: { params: { lang: "en" | "es" } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
        if (error) {
          console.error("Error fetching user profile type:", error)
        } else if (profile) {
          setIsAdmin(profile.type === "Administrator")
          setIsManager(profile.type === "Manager")
        }
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  useEffect(() => {
    const loadDictionaryAndOrganizations = async () => {
      try {
        const dictResponse = await fetch(`/api/dictionaries/data-types/${lang}`)
        if (!dictResponse.ok) throw new Error("Failed to fetch data types dictionary")
        const dictData = await dictResponse.json()
        setDict(dictData)

        const orgResponse = await fetch("/api/organizations")
        if (!orgResponse.ok) throw new Error("Failed to fetch organizations")
        const orgData: Organization[] = await orgResponse.json()
        setOrganizations(orgData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: dict?.common.error || "Error",
          description: err.message || "Failed to load page data.",
          variant: "destructive",
        })
        // Fallback dictionary if fetch fails
        setDict({
          dataTypeEditor: {
            editorTitle: "Add Data Type",
            editorDescription: "Add a new data type to your list.",
            nameLabel: "Name",
            fieldsLabel: "Fields (JSON)",
            organizationLabel: "Organization",
            saveButton: "Add Data Type",
            cancelButton: "Cancel",
            invalidJson: "Invalid JSON",
            noOrganizationSelected: "No organization selected",
            noOrganizationsFound: "No organizations found",
          },
          common: {
            error: "Error",
            success: "Success",
          },
          dataTypesPage: {
            dataTypeSaved: "Data Type saved successfully.",
          },
        })
      }
    }
    loadDictionaryAndOrganizations()
  }, [lang, toast])

  const handleSave = async (dataTypeData: { name: string; fields: any; organization_id: string }) => {
    try {
      const response = await fetch("/api/data-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataTypeData),
      })

      if (!response.ok) {
        let message = dict?.dataTypesPage.failedToSaveDataType || "Failed to save data type."
        try {
          const maybeJson = await response.clone().json()
          if (maybeJson?.error && String(maybeJson.error).trim()) {
            message = maybeJson.error
          } else if (response.statusText.trim()) {
            message = response.statusText
          } else {
            message = `HTTP ${response.status} error`
          }
        } catch {
          message = response.statusText.trim() || `HTTP ${response.status} error`
        }
        throw new Error(message)
      }

      toast({
        title: dict?.common.success || "Success",
        description: dict?.dataTypesPage.dataTypeSaved || "Data Type saved successfully.",
      })
      router.push(`/${lang}/data-types`)
    } catch (err: any) {
      toast({
        title: dict?.common.error || "Error",
        description: err.message || "Failed to save data type.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleCancel = () => {
    router.push(`/${lang}/data-types`)
  }

  if (!dict) return null // Don't render until dictionary is loaded

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <DataTypeEditor
        organizations={organizations}
        onSave={handleSave}
        onCancel={handleCancel}
        dict={dict.dataTypeEditor}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    </div>
  )
}
