"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Organization, Field, DataType } from "@/types/data" // Import interfaces from types/data

interface DataTypeFormProps {
  lang: string
}

export function DataTypeForm({ lang }: DataTypeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [availableDataTypes, setAvailableDataTypes] = useState<DataType[]>([])
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
            editorTitle: "Create Data Type",
            editorDescription: "Define a new data type for your organization.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Create Data Type",
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
              reference: "Reference",
            },
            dropdownOptionsLabel: "Dropdown Options",
            dropdownOptionsPlaceholder: "Enter options separated by commas (e.g., Option 1, Option 2, Option 3)",
            referenceDataTypeLabel: "Reference Data Type",
            referenceDataTypePlaceholder: "Select a data type to reference",
          },
          common: {
            loading: "Loading...",
            error: "Error",
            success: "Success",
          },
        })
      }
    }
    loadDictionary()
  }, [lang, toast])

  useEffect(() => {
    const fetchData = async () => {
      if (!dict) return
      setLoading(true)
      try {
        // Fetch organizations
        const orgsResponse = await fetch("/api/organizations")
        if (!orgsResponse.ok) throw new Error("Failed to fetch organizations")
        const orgsData: Organization[] = await orgsResponse.json()
        setOrganizations(orgsData)

        // Fetch available data types
        const dataTypesResponse = await fetch("/api/data-types")
        if (!dataTypesResponse.ok) throw new Error("Failed to fetch data types")
        const dataTypesData: DataType[] = await dataTypesResponse.json()
        setAvailableDataTypes(dataTypesData)
      } catch (err: any) {
        console.error(err)
        toast({
          title: dict?.common?.error || "Error",
          description: err.message || "Failed to load data.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (dict) {
      fetchData()
    }
  }, [dict, toast])

  const handleSave = async (newDataType: {
    id?: string // Added optional id
    name: string
    fields: Field[]
    organization_id: string
  }) => {
    try {
      const response = await fetch("/api/data-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDataType),
      })

      if (!response.ok) {
        let message = "Failed to create data type."
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
        description: "Data type created successfully.",
      })

      // Redirect back to data types list
      router.push(`/${lang}/data-types`)
    } catch (err: any) {
      toast({
        title: dict?.common?.error || "Error",
        description: err.message || "Failed to create data type.",
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
    <div className="container mx-auto py-6">
      <DataTypeEditor
        organizations={organizations}
        availableDataTypes={availableDataTypes}
        onSave={handleSave}
        onCancel={handleCancel}
        dict={dict.dataTypeEditor}
        isAdmin={isAdmin}
        isManager={isManager}
      />
    </div>
  )
}
