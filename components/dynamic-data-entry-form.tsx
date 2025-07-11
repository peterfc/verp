"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

interface DynamicDataEntry {
  id?: string
  data_type_id: string
  organization_id: string
  data: Record<string, any>
}

interface Dictionary {
  editorTitle: string
  editorDescription: string
  saveButton: string
  cancelButton: string
  invalidInput: string
  requiredField: string
  invalidNumber: string
  invalidJson: string
  invalidDate: string
  fieldLabel: string
}

interface Props {
  dataType: DataType
  initialData?: DynamicDataEntry
  onSave: (entry: DynamicDataEntry) => void
  onCancel: () => void
  dict?: Partial<Dictionary>
}

const fallbackDict: Dictionary = {
  editorTitle: "Data Entry",
  editorDescription: "Fill in the fields for this entry.",
  saveButton: "Save",
  cancelButton: "Cancel",
  invalidInput: "Invalid input",
  requiredField: "This field is required.",
  invalidNumber: "Please enter a valid number.",
  invalidJson: "Invalid JSON format.",
  invalidDate: "Invalid date.",
  fieldLabel: "Field",
}

export function DynamicDataEntryForm({ dataType, initialData, onSave, onCancel, dict: dictProp }: Props) {
  const dict = { ...fallbackDict, ...(dictProp ?? {}) }
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFormData(initialData.data)
      return
    }

    // Defaults for a *new* entry
    const initial: Record<string, any> = {}
    dataType.fields.forEach((field) => {
      switch (field.type) {
        case "boolean":
          initial[field.name] = false
          break
        case "number":
          initial[field.name] = ""
          break
        case "json":
          initial[field.name] = "{}"
          break
        default:
          initial[field.name] = ""
      }
    })
    setFormData(initial)
  }, [initialData, dataType.fields])

  const validateField = (field: Field, value: any): string | undefined => {
    if (field.type === "number" && value !== "" && isNaN(Number(value))) return dict.invalidNumber

    if (field.type === "json") {
      try {
        JSON.parse(value)
      } catch {
        return dict.invalidJson
      }
    }

    if (field.type === "date" && value && isNaN(new Date(value).getTime())) return dict.invalidDate

    return undefined
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    let hasErrors = false

    dataType.fields.forEach((field) => {
      const val = formData[field.name]
      const err = validateField(field, val)
      if (err) {
        newErrors[field.name] = err
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    const cleaned: Record<string, any> = {}
    dataType.fields.forEach((f) => {
      const v = formData[f.name]
      switch (f.type) {
        case "number":
          cleaned[f.name] = v === "" ? null : Number(v)
          break
        case "json":
          cleaned[f.name] = JSON.parse(v || "{}")
          break
        default:
          cleaned[f.name] = v
      }
    })

    onSave({
      ...initialData,
      data_type_id: dataType.id,
      organization_id: dataType.organization_id,
      data: cleaned,
    })
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{dict.editorTitle}</CardTitle>
        <CardDescription>{dict.editorDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {dataType.fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name}>{field.name}</Label>

              {field.type === "string" && (
                <Input
                  id={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === "number" && (
                <Input
                  id={field.name}
                  type="number"
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === "boolean" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    checked={Boolean(formData[field.name])}
                    onCheckedChange={(c) => handleChange(field.name, c)}
                  />
                  <label htmlFor={field.name} className="text-sm font-medium leading-none">
                    {field.name}
                  </label>
                </div>
              )}

              {field.type === "date" && (
                <Input
                  id={field.name}
                  type="date"
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === "json" && (
                <Textarea
                  id={field.name}
                  rows={5}
                  value={formData[field.name] ?? "{}"}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === "dropdown" && (
                <>
                  {/* Debug info for dropdown */}
                  <div className="text-xs text-gray-500 mb-2">
                    Debug: Field options = {JSON.stringify(field.options)}
                  </div>
                  <Select value={formData[field.name] ?? ""} onValueChange={(v) => handleChange(field.name, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              {errors[field.name] && <p className="text-red-500 text-sm">{errors[field.name]}</p>}
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {dict.cancelButton}
            </Button>
            <Button type="submit">{dict.saveButton}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
