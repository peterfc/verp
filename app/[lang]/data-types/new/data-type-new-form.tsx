"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import { Organization, DataType, DataTypeFormSchema } from "@/types/data"
import type { UseFormReturn } from "react-hook-form"
import z from "zod"

interface DataTypeNewFormProps {
  organizations: Organization[]
  availableDataTypes: DataType[]
  lang: string
  isAdmin: boolean
  isManager: boolean
}

export function DataTypeNewForm({ organizations, availableDataTypes, lang, isAdmin, isManager }: DataTypeNewFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadDictionary = async () => {
      try {
        const response = await fetch(`/api/dictionaries/data-types/${lang}`)
        if (!response.ok) throw new Error("Failed to fetch dictionary")
        const dictData = await response.json()
        setDict(dictData)
      } catch (error) {
        console.error("Error loading dictionary:", error)
        // Fallback dictionary
        setDict({
          dataTypeEditor: {
            editorTitle: "Add Data Type",
            editorDescription: "Create a new data type schema.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Add Data Type",
            cancelButton: "Cancel",
            invalidJson: "Invalid JSON",
            noOrganizationSelected: "Please select an organization.",
            noOrganizationsFound: "No organizations found.",
            addFieldButton: "Add Field",
            removeFieldButton: "Remove Field",
            fieldTypeOptions: {
              string: "String",
              number: "Number",
              boolean: "Boolean",
              date: "Date",
              json: "JSON",
              dropdown: "Dropdown",
              file: "File",
              reference: "Reference",
            },
            dropdownOptionsLabel: "Dropdown Options",
            dropdownOptionsPlaceholder: "e.g., Option 1, Option 2, Option 3",
            referenceDataTypeLabel: "Reference Data Type",
            referenceDataTypePlaceholder: "Select a data type to reference",
          },
        })
      }
    }

    loadDictionary()
  }, [lang])

  const handleSave = async (newDataType: any) => {
    setLoading(true)
    try {
      const response = await fetch("/api/data-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDataType.name,
          fields: newDataType.fields,
          organization_id: newDataType.organization_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create data type")
      }

      toast({
        title: "Success",
        description: "Data type created successfully.",
      })

      router.push(`/${lang}/data-types`)
    } catch (error: any) {
      console.error("Error creating data type:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create data type.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push(`/${lang}/data-types`)
  }

  if (!dict) {
    return <div>Loading...</div>
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
        disabled={false}
      />
    </div>
  )
}
