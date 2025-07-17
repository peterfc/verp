"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { Organization, Field, DataType } from "@/types/data" // Import interfaces from types/data
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

  // Local state for the form fields
  const [name, setName] = useState("")
  const [organizationId, setOrganizationId] = useState("")
  const [fields, setFields] = useState<Field[]>([])

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

  /* Field management functions to pass to DataTypeEditor */
  const addField = useCallback(() => setFields((prev) => [...prev, { name: "", type: "string" }]), [])

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateField = useCallback((index: number, updated: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updated } : f)))
  }, [])

  const isFormDisabled = !isAdmin && !isManager

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormDisabled) return

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

    try {
      const newDataType: Partial<DataType> = {
        name,
        organization_id: organizationId,
        fields: fieldsToSave,
      }

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.dataTypeEditor.editorTitle}</CardTitle>
        <CardDescription>{dict.dataTypeEditor.editorDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
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
        </form>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={handleCancel}>
          {dict.dataTypeEditor.cancelButton}
        </Button>
        <Button onClick={handleSubmit} disabled={isFormDisabled}>
          {dict.dataTypeEditor.saveButton}
        </Button>
      </CardFooter>
    </Card>
  )
}
