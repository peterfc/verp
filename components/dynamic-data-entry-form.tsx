"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { useToast } from "@/hooks/use-toast"

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
  data: Record<string, any>
}

interface DynamicDataEntryFormProps {
  dataType: DataType
  entry?: DynamicDataEntry
  onSave: (entry: DynamicDataEntry) => void
  onCancel: () => void
  dict: {
    formTitle: string
    formDescription: string
    saveButton: string
    cancelButton: string
    requiredField: string
  }
}

export function DynamicDataEntryForm({ dataType, entry, onSave, onCancel, dict }: DynamicDataEntryFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (entry) {
      setFormData(entry.data || {})
    } else {
      // Initialize form data with empty values
      const initialData: Record<string, any> = {}
      dataType.fields.forEach((field) => {
        switch (field.type) {
          case "boolean":
            initialData[field.name] = false
            break
          case "number":
            initialData[field.name] = ""
            break
          case "file":
            initialData[field.name] = null
            break
          default:
            initialData[field.name] = ""
        }
      })
      setFormData(initialData)
    }
  }, [dataType, entry])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      for (const field of dataType.fields) {
        const value = formData[field.name]
        if (field.type !== "boolean" && (!value || (typeof value === "string" && !value.trim()))) {
          toast({
            title: "Validation Error",
            description: `${field.name} is required`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      const entryData: DynamicDataEntry = {
        id: entry?.id,
        data_type_id: dataType.id,
        data: formData,
      }

      onSave(entryData)
    } catch (error) {
      console.error("Form submission error:", error)
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: Field) => {
    const value = formData[field.name]

    switch (field.type) {
      case "string":
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value ? Number(e.target.value) : "")}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
        )

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => handleFieldChange(field.name, checked)} />
            <Label>Yes</Label>
          </div>
        )

      case "date":
        return <Input type="date" value={value || ""} onChange={(e) => handleFieldChange(field.name, e.target.value)} />

      case "json":
        return (
          <Textarea
            value={typeof value === "string" ? value : JSON.stringify(value || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleFieldChange(field.name, parsed)
              } catch {
                handleFieldChange(field.name, e.target.value)
              }
            }}
            placeholder={`Enter JSON for ${field.name.toLowerCase()}`}
            rows={4}
          />
        )

      case "dropdown":
        return (
          <Select value={value || ""} onValueChange={(selectedValue) => handleFieldChange(field.name, selectedValue)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
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

      case "file":
        return (
          <FileUpload
            value={value}
            onChange={(file) => handleFieldChange(field.name, file)}
            accept="*/*"
            maxSize={10 * 1024 * 1024} // 10MB
          />
        )

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}`}
          />
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {dataType.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.name}
                <span className="text-red-500 ml-1">*</span>
              </Label>
              {renderField(field)}
            </div>
          ))}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              {dict.cancelButton}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : dict.saveButton}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
