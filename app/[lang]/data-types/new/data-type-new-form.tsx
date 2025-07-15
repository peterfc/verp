"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTypeEditor } from "@/components/data-type-editor"
import { createClient } from "@/lib/supabase/client"
import type { DataType, Field, Organization } from "@/types/data" // Import types from centralized file

interface DataTypeNewFormProps {
  organizations: Organization[]
  availableDataTypes: DataType[]
  lang: string
  isAdmin: boolean
  isManager: boolean
}

export function DataTypeNewForm({ organizations, availableDataTypes, lang, isAdmin, isManager }: DataTypeNewFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)

  // State for form fields
  const [name, setName] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [fields, setFields] = useState<Field[]>([])

  // State for validation errors
  const [formErrors, setFormErrors] = useState<string[]>([])

  const updateField = useCallback((index: number, updated: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updated } : f)))
  }, [])

  const addField = useCallback(() => {
    setFields((prev) => [...prev, { name: "", type: "string" }])
  }, [])

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  async function onSubmit() {
    setIsSaving(true)
    setFormErrors([]) // Clear previous errors

    const errors: string[] = []

    if (!name.trim()) {
      errors.push("Data type name is required.")
    }
    if (!organizationId) {
      errors.push("Organization is required.")
    }
    if (fields.length === 0) {
      errors.push("At least one field is required.")
    }

    const fieldsToSave = fields.map((field) => {
      const newField: Field = {
        name: field.name,
        type: field.type,
      }
      if (!field.name.trim()) {
        errors.push(`Field name cannot be empty for one of the fields.`)
      }

      if (field.type === "dropdown") {
        const opts = (field.tempOptionsInput ?? "")
          .split(",")
          .map((option) => option.trim())
          .filter((option) => option.length > 0)
        if (opts.length === 0) {
          errors.push(`Dropdown field "${field.name || "Unnamed"}" needs options.`)
        }
        newField.options = opts
      } else if (field.type === "reference") {
        if (!field.referenceDataTypeId) {
          errors.push(`Reference field "${field.name || "Unnamed"}" needs a data type selection.`)
        }
        newField.referenceDataTypeId = field.referenceDataTypeId || undefined
      }
      return newField
    })

    if (errors.length > 0) {
      setFormErrors(errors)
      toast({
        title: "Validation Error",
        description: errors.join("\n"),
        variant: "destructive",
      })
      setIsSaving(false)
      return
    }

    try {
      const { error } = await supabase.from("data_types").insert({
        name: name,
        organization_id: organizationId,
        fields: fieldsToSave,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success!",
        description: "Data type created successfully.",
      })
      router.push(`/${lang}/data-types`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create data type.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const isFormDisabled = !isAdmin && !isManager

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Create New Data Type</CardTitle>
        <CardDescription>Define a new data type with custom fields.</CardDescription>
      </CardHeader>
      <CardContent>
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded">
            <p className="font-semibold">Please correct the following errors:</p>
            <ul className="list-disc list-inside">
              {formErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="space-y-8"
        >
          <DataTypeEditor
            name={name}
            setName={setName}
            organizationId={organizationId}
            setOrganizationId={setOrganizationId}
            fields={fields}
            updateField={updateField}
            addField={addField}
            removeField={removeField}
            organizations={organizations}
            availableDataTypes={availableDataTypes}
            disabled={isFormDisabled}
            dict={{
              editorTitle: "Create New Data Type",
              editorDescription: "Define a new data type with custom fields.",
              nameLabel: "Name",
              fieldsLabel: "Fields",
              organizationLabel: "Organization",
              saveButton: "Create Data Type",
              cancelButton: "Cancel",
              invalidJson: "Invalid JSON", // This might need to be more specific now
              noOrganizationSelected: "No organization selected.",
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
              dropdownOptionsLabel: "Dropdown Options (comma-separated)",
              dropdownOptionsPlaceholder: "Option 1, Option 2, Option 3",
              referenceDataTypeLabel: "Reference Data Type",
              referenceDataTypePlaceholder: "Select a data type to reference",
            }}
            isAdmin={isAdmin}
            isManager={isManager}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isFormDisabled}>
              {isSaving ? "Creating..." : "Create Data Type"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
