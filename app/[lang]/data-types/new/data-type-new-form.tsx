"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import type { Organization, Field, DataType } from "@/types/data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

  // Form state
  const [name, setName] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [fields, setFields] = useState<Field[]>([])

  // Dictionary loading
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
            editorTitle: "Create New Data Type",
            editorDescription: "Define a new data type for your organization.",
            nameLabel: "Name",
            fieldsLabel: "Fields",
            organizationLabel: "Organization",
            saveButton: "Create Data Type",
            cancelButton: "Cancel",
            invalidJson: "Invalid Data",
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

  // Helper functions for fields state
  const addField = useCallback(() => setFields((prev) => [...prev, { name: "", type: "string" }]), [])

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateField = useCallback((index: number, updated: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updated } : f)))
  }, [])

  const isFormDisabled = !isAdmin && !isManager

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormDisabled) return

    /* basic validation */
    if (!name.trim()) {
      toast({
        title: dict.dataTypeEditor.invalidJson,
        description: "Data type name is required.",
        variant: "destructive",
      })
      return
    }

    if (!organizationId) {
      toast({
        title: dict.dataTypeEditor.noOrganizationSelected,
        variant: "destructive",
      })
      return
    }

    const errors: string[] = []
    const fieldsToSave = fields.map((field) => {
      const newField: Partial<Field> = { name: field.name, type: field.type }

      if (!field.name.trim()) {
        errors.push("Every field needs a name.")
      }

      if (field.type === "dropdown") {
        const opts = (field.tempOptionsInput ?? "")
          .split(",")
          .map((o: string) => o.trim())
          .filter(Boolean)
        if (opts.length === 0) {
          errors.push(`Dropdown "${field.name || "Unnamed"}" needs options.`)
        }
        newField.options = opts
      }

      if (field.type === "reference") {
        if (!field.referenceDataTypeId) {
          errors.push(`Reference field "${field.name || "Unnamed"}" needs a data type selection.`)
        }
        newField.referenceDataTypeId = field.referenceDataTypeId
      }

      return newField as Field
    })

    if (errors.length) {
      toast({ title: dict.dataTypeEditor.invalidJson, description: errors.join("\n"), variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/data-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          fields: fieldsToSave,
          organization_id: organizationId,
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{dict.dataTypeEditor.editorTitle}</CardTitle>
          <CardDescription>{dict.dataTypeEditor.editorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-6">
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
              dict={dict.dataTypeEditor}
              isAdmin={isAdmin}
              isManager={isManager}
              disabled={isFormDisabled}
            />
            <CardFooter className="justify-end gap-2 p-0 pt-6">
              <Button variant="outline" onClick={handleCancel} type="button">
                {dict.dataTypeEditor.cancelButton}
              </Button>
              <Button type="submit" disabled={isFormDisabled || loading}>
                {loading ? "Creating..." : dict.dataTypeEditor.saveButton}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
