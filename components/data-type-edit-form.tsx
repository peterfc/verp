"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import type { DataType, Organization, Field } from "@/types/data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

  // Form state
  const [name, setName] = useState(dataType?.name || "")
  const [organizationId, setOrganizationId] = useState(dataType?.organization_id || "")
  const [fields, setFields] = useState<Field[]>(() => {
    if (!dataType?.fields?.length) return []
    return dataType.fields.map((f) =>
      f.type === "dropdown"
        ? { ...f, tempOptionsInput: (f.options ?? []).join(", ") }
        : { ...f, tempOptionsInput: undefined },
    )
  })

  // Sync props to state when dataType changes (e.g., on initial load or data refresh)
  useEffect(() => {
    if (dataType) {
      setName(dataType.name)
      setOrganizationId(dataType.organization_id)
      setFields(
        dataType.fields.map((f) =>
          f.type === "dropdown"
            ? { ...f, tempOptionsInput: (f.options ?? []).join(", ") }
            : { ...f, tempOptionsInput: undefined },
        ),
      )
    }
  }, [dataType])

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
    const cleanedFields: Field[] = fields.map((f) => {
      if (!f.name.trim()) errors.push("Every field needs a name.")
      if (f.type === "dropdown") {
        const opts = (f.tempOptionsInput ?? "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
        if (opts.length === 0) errors.push(`Dropdown "${f.name || "Unnamed"}" needs options.`)
        return { ...f, options: opts }
      }
      if (f.type === "reference") {
        if (!f.referenceDataTypeId) {
          errors.push(`Reference field "${f.name || "Unnamed"}" needs a data type selection.`)
        }
        return { ...f, options: undefined }
      }
      return { ...f, options: undefined, referenceDataTypeId: undefined }
    })

    if (errors.length) {
      toast({ title: dict.dataTypeEditor.invalidJson, description: errors.join("\n"), variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/data-types/${dataType.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          fields: cleanedFields,
          organization_id: organizationId,
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
              dataType={dataType}
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
                {loading ? "Saving..." : dict.dataTypeEditor.saveButton}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
