"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import { DataType, Organization } from "@/types/data"

interface DataTypeEditFormProps {
  dataType: DataType
  organizations: Organization[]
  availableDataTypes: DataType[]
  lang: string
  isAdmin: boolean
  isManager: boolean
}

export function DataTypeEditForm({
  dataType,
  organizations,
  availableDataTypes,
  lang,
  isAdmin,
  isManager,
}: DataTypeEditFormProps) {
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
            editorTitle: "Edit Data Type",
            editorDescription: "Make changes to the data type here.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Save Changes",
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

  const handleSave = async (updatedDataType: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/data-types/${dataType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: updatedDataType.name,
          fields: updatedDataType.fields,
          organization_id: updatedDataType.organization_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update data type")
      }

      toast({
        title: "Success",
        description: "Data type updated successfully.",
      })

      router.push(`/${lang}/data-types`)
    } catch (error: any) {
      console.error("Error updating data type:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update data type.",
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
        dataType={dataType}
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
