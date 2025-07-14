"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { FileUpload } from "@/components/file-upload"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { FieldDefinition } from "@/types/data"

interface DataType {
  id: string
  name: string
  fields: FieldDefinition[]
  organization_id: string
}

interface DynamicDataEntry {
  id?: string
  data_type_id: string
  organization_id: string
  data: Record<string, any>
  created_at?: string
  updated_at?: string
}

interface DynamicDataEntryFormProps {
  dataType: DataType
  entry?: DynamicDataEntry
  onSave: (entry: DynamicDataEntry) => Promise<void> // Changed to accept Promise<void>
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
    viewFile: string
  }
}

const DynamicDataEntryFormType = {
  Text: "text",
  Number: "number",
  Boolean: "boolean",
  Date: "date",
  Json: "json",
  Dropdown: "dropdown",
  File: "file",
} as const

export default function DynamicDataEntryForm({ dataType, entry, onSave, onCancel, dict }: DynamicDataEntryFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    if (entry) {
      setFormData(entry.data || {})
    } else {
      setFormData({})
    }
    setErrors({})
  }, [entry])

  const validateField = (field: FieldDefinition, value: any): string | null => {
    if (field.required && (value === null || value === undefined || value === "")) {
      return dict.requiredField
    }
    if (value === null || value === undefined || value === "") return null // No further validation if not required and empty

    switch (field.type) {
      case DynamicDataEntryFormType.Number:
        if (isNaN(Number(value))) {
          return dict.invalidNumber
        }
        break
      case DynamicDataEntryFormType.Json:
        try {
          JSON.parse(value)
        } catch {
          return dict.invalidJson
        }
        break
      case DynamicDataEntryFormType.Date:
        if (value && !isNaN(new Date(value).getTime())) {
          // Valid date string or Date object
        } else {
          return dict.invalidDate
        }
        break
      // Add more type-specific validations here if needed
    }
    return null
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    let hasErrors = false
    const newErrors: Record<string, string> = {}

    dataType.fields.forEach((field) => {
      const error = validateField(field, formData[field.name])
      if (error) {
        newErrors[field.name] = error
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      setIsSaving(false)
      toast({
        title: dict.invalidInput,
        description: "Please correct the errors in the form.",
        variant: "destructive",
      })
      return
    }

    const entryToSave: DynamicDataEntry = {
      data_type_id: dataType.id,
      organization_id: dataType.organization_id,
      data: formData,
    }

    if (entry?.id) {
      entryToSave.id = entry.id
    }

    try {
      await onSave(entryToSave)
    } finally {
      setIsSaving(false)
    }
  }

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name]

    switch (field.type) {
      case DynamicDataEntryFormType.Text:
        return (
          <Input
            id={field.name}
            name={field.name}
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case DynamicDataEntryFormType.Number:
        return (
          <Input
            id={field.name}
            name={field.name}
            type="number"
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        )
      case DynamicDataEntryFormType.Boolean:
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              name={field.name}
              checked={!!value}
              onCheckedChange={(checked) => handleChange(field.name, checked)}
            />
            <Label htmlFor={field.name}>{field.name}</Label>
          </div>
        )
      case DynamicDataEntryFormType.Date:
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!value && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleChange(field.name, date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )
      case DynamicDataEntryFormType.Json:
        return (
          <Textarea
            id={field.name}
            name={field.name}
            value={value ? JSON.stringify(value, null, 2) : ""}
            onChange={(e) => {
              try {
                handleChange(field.name, JSON.parse(e.target.value))
              } catch {
                handleChange(field.name, e.target.value) // Keep as string if invalid JSON for error display
              }
            }}
            required={field.required}
            rows={5}
          />
        )
      case DynamicDataEntryFormType.Dropdown:
        return (
          <Select
            value={value || ""}
            onValueChange={(selectedValue) => handleChange(field.name, selectedValue)}
            required={field.required}
          >
            <SelectTrigger>
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
        )
      case DynamicDataEntryFormType.File:
        return (
          <FileUpload
            bucketName="dynamic-data-files" // Or a specific bucket for dynamic data
            value={value}
            onChange={(fileUrl, fileName) => handleChange(field.name, { url: fileUrl, filename: fileName })}
            onDelete={() => handleChange(field.name, null)}
            supabase={supabase}
            dict={{
              uploadButton: "Upload File",
              replaceButton: "Replace File",
              deleteButton: "Delete File",
              viewFile: dict.viewFile,
              uploading: "Uploading...",
              uploadSuccess: "File uploaded successfully.",
              uploadError: "Failed to upload file.",
              deleteSuccess: "File deleted successfully.",
              deleteError: "Failed to delete file.",
            }}
          />
        )
      default:
        return (
          <Input
            id={field.name}
            name={field.name}
            value={value || ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{entry ? `Edit ${dataType.name}` : `Add New ${dataType.name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {dataType.fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name}>
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
              </Label>
              {renderField(field)}
              {errors[field.name] && <p className="text-red-500 text-sm">{errors[field.name]}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              {dict.cancelButton}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : dict.saveButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
