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

interface DataTypeEditFormProps {
  lang: string
  dataType: DataType
  organizations: Organization[]
}

export function DataTypeEditForm({ lang, dataType, organizations }: DataTypeEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
        const { data: userProfile, error } = await supabase.from("profiles").select("type").eq("id", user.id).single()
        if (error) {
          console.error("Error fetching current user profile type:", error)
        } else if (userProfile) {
          setIsAdmin(userProfile.type === "Administrator")
          setIsManager(userProfile.type === "Manager")
        }
      }
    }
    fetchUserAndProfile()
  }, [supabase])

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const dictResponse = await fetch(`/api/dictionaries/data-types/${lang}`)
        if (!dictResponse.ok) throw new Error("Failed to fetch data types dictionary")
        const dictData = await dictResponse.json()
        setDict(dictData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: "Error",
          description: err.message || "Failed to load dictionary.",
          variant: "destructive",
        })
        // Fallback dictionary if fetch fails
        setDict({
          dataTypeEditor: {
            editorTitle: "Edit Data Type",
            editorDescription: "Make changes to your data type configuration.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Save Changes",
            cancelButton: "Cancel",
            invalidJson: "Invalid configuration",
            noOrganizationSelected: "Please select an organization",
            noOrganizationsFound: "No organizations available",
            addFieldButton: "Add Field",
            removeFieldButton: "Remove Field",
            fieldTypeOptions: {
              string: "Text",
              number: "Number",
              boolean: "Yes/No",
              date: "Date",
              json: "JSON",
              dropdown: "Dropdown",
              file: "File",
            },
            dropdownOptionsLabel: "Dropdown Options",
            dropdownOptionsPlaceholder: "Enter options separated by commas (e.g., Option 1, Option 2, Option 3)",
          },
          common: {
            loading: "Loading...",
            error: "Error",
            success: "Success",
          },
        })
      } finally {
        setLoading(false)
      }
    }
    loadDictionary()
  }, [lang, toast])

  const handleSave = async (updatedDataType: {
    id?: string
    name: string
    fields: Field[]
    organization_id: string
  }) => {
    try {
      const response = await fetch(`/api/data-types/${dataType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedDataType.name,
          fields: updatedDataType.fields,
          organization_id: updatedDataType.organization_id,
        }),
      })

      if (!response.ok) {
        let message = "Failed to update data type."
        try {
          const errorData = await response.json()
          if (errorData?.error) {
            message = errorData.error
          }
        } catch {
          message = response.statusText || message
        }
        throw new Error(message)
      }

      toast({
        title: dict?.common?.success || "Success",
        description: "Data type updated successfully.",
      })

      // Redirect back to data types list
      router.push(`/${lang}/data-types`)
    } catch (err: any) {
      toast({
        title: dict?.common?.error || "Error",
        description: err.message || "Failed to update data type.",
        variant: "destructive",
      })
      console.error(err)
    }
  }

  const handleCancel = () => {
    router.push(`/${lang}/data-types`)
  }

  if (loading || !dict) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>{dict?.common?.loading || "Loading..."}</p>
      </div>
    )
  }

  return (
    <DataTypeEditor
      dataType={dataType}
      organizations={organizations}
      onSave={handleSave}
      onCancel={handleCancel}
      dict={dict.dataTypeEditor}
      isAdmin={isAdmin}
      isManager={isManager}
    />
  )
}
