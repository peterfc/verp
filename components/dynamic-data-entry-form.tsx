"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload } from "@/components/file-upload"
import type { Field, DataType, DynamicDataEntry } from "@/types/data" // Import from new types file

interface DynamicDataEntryFormProps {
  dataType: DataType
  entry?: DynamicDataEntry
  onSave: (entry: DynamicDataEntry) => Promise<void>
  onCancel: () => void
  dict: {
    formTitle: string
    formDescription: string
    saveButton: string
    cancelButton: string
    invalidInput: string
    requiredField: string
    invalidNumber: string
    invalidJson: string
    invalidDate: string
    fieldLabel: string
  }
}

export function DynamicDataEntryForm({ dataType, entry, onSave, onCancel, dict }: DynamicDataEntryFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setFormData(entry.data || {})
    } else {
      setFormData({})
    }
    setErrors({})
  }, [entry])

  const validateField = useCallback(
    (field: Field, value: any): string | undefined => {
      if (field.type === "boolean") {
        // Booleans are always valid, even if undefined (defaults to false)
        return undefined
      }

      if (field.type === "file") {
        // File fields can be optional, validation depends on specific requirements
        // For now, we'll assume they are valid if present or empty
        return undefined
      }

      // Check for required fields (if not boolean or file)
      if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
        return dict.requiredField
      }

      switch (field.type) {
        case "number":
          if (isNaN(Number(value))) {
            return dict.invalidNumber
          }
          break
        case "json":
          try {
            JSON.parse(value)
          } catch {
            return dict.invalidJson
          }
          break
        case "date":
          if (isNaN(new Date(value).getTime())) {
            return dict.invalidDate
          }
          break
        case "dropdown":
          if (!field.options?.includes(value)) {
            return dict.invalidInput // Or a more specific message for dropdown
          }
          break
        // Add more specific validations for other types if needed
      }
      return undefined
    },
    [dict],
  )

  const handleChange = useCallback(
    (fieldName: string, value: any, fieldType: string) => {
      let processedValue = value

      // Type-specific processing
      if (fieldType === "number") {
        processedValue = value === "" ? null : Number(value) // Store as number or null
      } else if (fieldType === "boolean") {
        processedValue = Boolean(value) // Ensure boolean type
      } else if (fieldType === "json") {
        // For JSON, we store the string, validation happens on save
        processedValue = value
      } else if (fieldType === "date") {
        // For date, store as string, validation happens on save
        processedValue = value
      }

      setFormData((prev) => ({ ...prev, [fieldName]: processedValue }))

      // Clear error for the field if it becomes valid
      const error = validateField(dataType.fields.find((f) => f.name === fieldName)!, processedValue)
      if (!error) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[fieldName]
          return newErrors
        })
      }
    },
    [dataType.fields, validateField],
  )

  const handleFileChange = useCallback((fieldName: string, fileUrl: string | null, filename: string | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: fileUrl ? { url: fileUrl, filename: filename || "file" } : null,
    }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const newErrors: Record<string, string> = {}
    dataType.fields.forEach((field) => {
      const value = formData[field.name]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSaving(false)
      return
    }

    const entryToSave: DynamicDataEntry = {
      ...entry, // Keep existing id, data_type_id, organization_id if editing
      id: entry?.id || "", // Ensure id is present for existing entries, or empty for new
      data_type_id: dataType.id,
      organization_id: dataType.organization_id,
      data: formData,
      created_at: entry?.created_at || null, // Preserve existing or set null
      updated_at: entry?.updated_at || null, // Preserve existing or set null
    }

    try {
      await onSave(entryToSave)
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (field: Field) => {
    const value = formData[field.name]
    const error = errors[field.name]

    switch (field.type) {
      case "text":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="text"
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value, field.type)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "number":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="number"
              value={value === null ? "" : value} // Handle null for number input
              onChange={(e) => handleChange(field.name, e.target.value, field.type)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "boolean":
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(field.name, checked, field.type)}
            />
            <Label htmlFor={field.name}>{field.name}</Label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "json":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value, field.type)}
              className={error ? "border-red-500" : ""}
              rows={5}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "date":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="date"
              value={value || ""}
              onChange={(e) => handleChange(field.name, e.target.value, field.type)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "dropdown":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Select
              value={value || ""}
              onValueChange={(selectedValue) => handleChange(field.name, selectedValue, field.type)}
            >
              <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder={`Select a ${field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      case "file":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <FileUpload
              value={value?.url || ""}
              filename={value?.filename || ""}
              onUpload={(url, filename) => handleFileChange(field.name, url, filename)}
              onDelete={() => handleFileChange(field.name, null, null)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )
      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.name} (Unsupported Type: {field.type})
            </Label>
            <Input disabled value="N/A" />
          </div>
        )
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.formTitle}</CardTitle>
        <CardDescription>{dict.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {dataType.fields.map(renderField)}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              {dict.cancelButton}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? dict.saveButton + "..." : dict.saveButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
