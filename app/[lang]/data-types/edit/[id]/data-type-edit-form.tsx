"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DataTypeEditor } from "@/components/data-type-editor"
import { useToast } from "@/hooks/use-toast"
import type { Organization, Field, DataType } from "@/types/data"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"

interface DataTypeEditFormProps {
  lang: string
  initialData?: DataType // Make optional to prevent crash on first render
  organizations: Organization[]
  availableDataTypes: DataType[]
  onSave: (data: Partial<DataType>) => Promise<{ error?: any }>
}

export function DataTypeEditForm({
  lang,
  initialData,
  organizations,
  availableDataTypes,
  onSave,
}: DataTypeEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [dict, setDict] = useState<any>(null)
  const [loading, setLoading] = useState(false) // For submission loading state
  const [pageLoading, setPageLoading] = useState(true) // For initial data/dict loading
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)

  // Safely initialize state from initialData
  const [name, setName] = useState(initialData?.name || "")
  const [organizationId, setOrganizationId] = useState(initialData?.organization_id || "")
  const [fields, setFields] = useState<Field[]>(
    initialData?.fields?.map((f) => ({
      ...f,
      tempOptionsInput: f.type === "dropdown" && f.options ? f.options.join(", ") : "",
    })) || [],
  )

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
      setPageLoading(true)
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
      } finally {
        setPageLoading(false)
      }
    }
    loadDictionary()
  }, [lang, toast])

  // Effect to sync state if initialData changes after initial render
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setOrganizationId(initialData.organization_id)
      setFields(
        initialData.fields?.map((f) => ({
          ...f,
          tempOptionsInput: f.type === "dropdown" && f.options ? f.options.join(", ") : "",
        })) || [],
      )
    }
  }, [initialData])

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
    if (isFormDisabled || !initialData) return

    setLoading(true)

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
      setLoading(false)
      return
    }

    const updatedDataType = {
      id: initialData.id,
      name,
      organization_id: organizationId,
      fields: fieldsToSave,
    }

    const { error } = await onSave(updatedDataType)

    if (error) {
      toast({
        title: dict?.common?.error || "Error",
        description: (error as any).message || "Failed to update data type.",
        variant: "destructive",
      })
    } else {
      toast({
        title: dict?.common?.success || "Success",
        description: "Data type updated successfully.",
      })
      router.push(`/${lang}/data-types`)
    }
    setLoading(false)
  }

  const handleCancel = () => {
    router.push(`/${lang}/data-types`)
  }

  if (pageLoading || !dict || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <p>Loading...</p>
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
  )
}
