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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/file-upload"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"

interface Field {
  name: string
  type: string
  options?: string[]
  referenceDataTypeId?: string
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
  created_at?: string
  updated_at?: string
}

interface DynamicDataEntryFormProps {
  dataType: DataType
  entry?: DynamicDataEntry
  onSave: (entry: DynamicDataEntry) => Promise<void>
  onCancel: () => void
  dict?: Record<string, any> // ✅ optional
}

export function DynamicDataEntryForm({ dataType, entry, onSave, onCancel, dict }: DynamicDataEntryFormProps) {
  // Safely merge dictionaries; if none provided we fall back to defaults
  const mergedDict = { ...defaultDict, ...(dict ?? {}) }
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [referenceOptions, setReferenceOptions] = useState<Record<string, { id: string; data: Record<string, any> }[]>>(
    {},
  )
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    console.log("Form initialized with entry:", entry)
    const initialData: Record<string, any> = {}
    if (entry?.data) {
      // Deep copy entry.data to avoid direct mutation
      Object.keys(entry.data).forEach((key) => {
        initialData[key] = entry.data[key]
      })
    }
    setFormData(initialData)
    console.log("Setting form data from entry:", initialData)
  }, [entry])

  useEffect(() => {
    const loadReferenceOptions = async () => {
      const refFields = dataType.fields.filter((f) => f.type === "reference" && f.referenceDataTypeId)
      console.log("Loading reference options for fields:", refFields)
      const newReferenceOptions: Record<string, { id: string; data: Record<string, any> }[]> = {}

      for (const field of refFields) {
        if (field.referenceDataTypeId) {
          console.log(`Loading reference options for ${field.name} from dataTypeId: ${field.referenceDataTypeId}`)
          try {
            const { data, error } = await supabase
              .from("dynamic_data_entries")
              .select("id, data")
              .eq("data_type_id", field.referenceDataTypeId)

            if (error) {
              console.error(`Error fetching reference data for ${field.name}:`, error.message)
              toast({
                title: defaultDict.common?.error ?? "Error",
                description: `Failed to load options for ${field.name}: ${error.message}`,
                variant: "destructive",
              })
            } else {
              newReferenceOptions[field.name] = data || []
              console.log(`Loaded ${data?.length || 0} reference options for ${field.name}:`, data)
            }
          } catch (err: any) {
            console.error(`Unexpected error fetching reference data for ${field.name}:`, err)
            toast({
              title: defaultDict.common?.error ?? "Error",
              description: `Unexpected error loading options for ${field.name}: ${err.message}`,
              variant: "destructive",
            })
          }
        }
      }
      setReferenceOptions(newReferenceOptions)
    }

    loadReferenceOptions()
  }, [dataType.fields, supabase, toast])

  const validateField = (field: Field, value: any): string => {
    if (field.type === "string" && field.name === "Document1") {
      console.log(`Validating field ${field.name} (type: ${field.type}) with value:`, value)
    }

    if (field.type === "reference" && field.name === "Document1") {
      console.log(`Validating field ${field.name} (type: ${field.type}) with value:`, value)
    }

    if (field.type === "number") {
      if (value !== "" && isNaN(Number(value))) {
        return mergedDict.invalidNumber
      }
    } else if (field.type === "json") {
      try {
        if (value) JSON.parse(value)
      } catch {
        return mergedDict.invalidJson
      }
    } else if (field.type === "date") {
      if (value && !isNaN(new Date(value).getTime())) {
        // Valid date string
      } else if (value && isNaN(new Date(value).getTime())) {
        return mergedDict.invalidDate
      }
    }
    // Add more validation rules as needed
    return ""
  }

  const handleChange = useCallback((fieldName: string, value: any) => {
    setFormData((prevData) => {
      const newData = { ...prevData, [fieldName]: value }
      console.log(`Field ${fieldName} changed to:`, value)
      console.log("Updated form data:", newData)
      return newData
    })
    setErrors((prevErrors) => ({ ...prevErrors, [fieldName]: "" })) // Clear error on change
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const dataToSave: Record<string, any> = {}

    dataType.fields.forEach((field) => {
      const value = formData[field.name]
      const error = validateField(field, value)
      if (error) {
        newErrors[field.name] = error
      }
      // Ensure numbers are stored as numbers, booleans as booleans, etc.
      if (field.type === "number") {
        dataToSave[field.name] = value === "" ? null : Number(value)
      } else if (field.type === "boolean") {
        dataToSave[field.name] = Boolean(value)
      } else if (field.type === "json") {
        try {
          dataToSave[field.name] = value ? JSON.parse(value) : null
        } catch {
          dataToSave[field.name] = value // Save as string if invalid JSON
        }
      } else if (field.type === "file") {
        // File field value is already an object { url, filename, size, type }
        dataToSave[field.name] = value || null
      } else {
        dataToSave[field.name] = value
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: mergedDict.invalidInput,
        description: "Please correct the errors in the form.",
        variant: "destructive",
      })
      return
    }

    const finalEntry: DynamicDataEntry = {
      ...(entry || {}), // Preserve existing ID if editing
      data_type_id: dataType.id,
      organization_id: dataType.organization_id, // Ensure organization_id is passed
      data: dataToSave,
    }
    console.log("Calling onSave with:", finalEntry)
    onSave(finalEntry)
  }

  const getFieldType = (field: Field) => {
    if (field.type === "reference") {
      return "reference"
    }
    return field.type
  }

  const getReferenceDisplayValue = (referenceEntry: { id: string; data: Record<string, any> }) => {
    // Prioritize common display fields
    const displayFields = ["name", "title", "label", "filename"]
    for (const key of displayFields) {
      if (referenceEntry.data[key] && typeof referenceEntry.data[key] === "string") {
        return referenceEntry.data[key]
      }
    }
    // Fallback to first string value or ID
    const firstStringValue = Object.values(referenceEntry.data).find(
      (val) => typeof val === "string" && val.trim().length > 0,
    )
    return firstStringValue || `ID: ${referenceEntry.id.substring(0, 8)}...`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{entry ? mergedDict.formTitleEdit : mergedDict.formTitle}</CardTitle>
        <CardDescription>{mergedDict.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {dataType.fields.map((field) => {
            const fieldType = getFieldType(field)
            const value = formData[field.name]
            const error = errors[field.name]

            console.log(
              `Rendering field: ${field.name}, type: ${fieldType}, options: ${field.options}, referenceDataTypeId: ${field.referenceDataTypeId}, value:`,
              value,
            )

            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.name}</Label>
                {fieldType === "string" && (
                  <Input
                    id={field.name}
                    value={value || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                )}
                {fieldType === "number" && (
                  <Input
                    id={field.name}
                    type="number"
                    value={value === null ? "" : value}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                )}
                {fieldType === "boolean" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={Boolean(value)}
                      onCheckedChange={(checked) => handleChange(field.name, checked)}
                    />
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {field.name}
                    </label>
                  </div>
                )}
                {fieldType === "text" && (
                  <Textarea
                    id={field.name}
                    value={value || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={error ? "border-red-500" : ""}
                  />
                )}
                {fieldType === "Dropdown" && (
                  <Select onValueChange={(val) => handleChange(field.name, val)} value={value || ""}>
                    <SelectTrigger className={cn(error && "border-red-500")}>
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
                )}
                {fieldType === "date" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !value && "text-muted-foreground",
                          error && "border-red-500",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={value ? new Date(value) : undefined}
                        onSelect={(date) => handleChange(field.name, date?.toISOString().split("T")[0])} // Save as YYYY-MM-DD string
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                {fieldType === "json" && (
                  <Textarea
                    id={field.name}
                    value={value ? (typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)) : ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className={cn("font-mono", error && "border-red-500")}
                    rows={5}
                  />
                )}
                {fieldType === "file" && (
                  <FileUpload
                    value={value}
                    onChange={(file) => handleChange(field.name, file)}
                    onDelete={() => handleChange(field.name, null)}
                  />
                )}
                {fieldType === "reference" && (
                  <Select onValueChange={(val) => handleChange(field.name, val)} value={value || ""}>
                    <SelectTrigger className={cn(error && "border-red-500")}>
                      <SelectValue placeholder={`Select a ${field.name}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceOptions[field.name]?.length === 0 ? (
                        <SelectItem value="" disabled>
                          No options available
                        </SelectItem>
                      ) : (
                        referenceOptions[field.name]?.map((refEntry) => {
                          console.log(
                            `Reference field ${field.name} has ${referenceOptions[field.name]?.length} options:`,
                            referenceOptions[field.name],
                          )
                          return (
                            <SelectItem key={refEntry.id} value={refEntry.id}>
                              {getReferenceDisplayValue(refEntry)}
                            </SelectItem>
                          )
                        })
                      )}
                    </SelectContent>
                  </Select>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            )
          })}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {mergedDict.cancelButton}
            </Button>
            <Button type="submit">{mergedDict.saveButton}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
const defaultDict = {
  formTitle: "Create New Entry",
  formTitleEdit: "Edit Entry",
  formDescription: "Enter the details for this data entry.",
  invalidInput: "Invalid Input",
  invalidNumber: "Please enter a valid number.",
  invalidJson: "Please enter a valid JSON.",
  invalidDate: "Please enter a valid date.",
  cancelButton: "Cancel",
  saveButton: "Save",
  common: {
    error: "Error",
  },
}
