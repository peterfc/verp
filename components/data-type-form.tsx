"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import type { DataType, Field, Organization } from "@/types/data"
import { cn } from "@/lib/utils"

interface DataTypeFormProps {
  dataType?: DataType // Optional for new data types
  onSave: (dataType: DataType) => Promise<void>
  onCancel: () => void
  dict?: Record<string, any>
}

export function DataTypeForm({ dataType, onSave, onCancel, dict }: DataTypeFormProps) {
  const mergedDict = { ...defaultDict, ...(dict ?? {}) }
  const [name, setName] = useState(dataType?.name || "")
  const [fields, setFields] = useState<Field[]>(
    dataType?.fields?.map((field) => ({
      ...field,
      options: field.options || [], // Ensure options is always an array
      tempOptionsInput: field.options?.join(", ") || "", // Initialize tempOptionsInput for editing
    })) || [],
  )
  const [organizationId, setOrganizationId] = useState<string>(dataType?.organization_id || "")
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase.from("organizations").select("id, name")
      if (error) {
        console.error("Error fetching organizations:", error)
        toast({
          title: mergedDict.common?.error || "Error",
          description: mergedDict.failedToLoadOrganizations || "Failed to load organizations.",
          variant: "destructive",
        })
      } else {
        setOrganizations(data || [])
      }
    }
    fetchOrganizations()
  }, [supabase, toast]) // Removed mergedDict from dependencies

  const addField = () => {
    setFields([...fields, { name: "", type: "string", options: [] }]) // Initialize with empty options array
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = useCallback((index: number, key: keyof Field, value: any) => {
    setFields((prevFields) => {
      const newFields = [...prevFields]
      if (key === "type") {
        // Reset options/referenceDataTypeId when type changes
        newFields[index] = {
          ...newFields[index],
          [key]: value,
          options: [],
          tempOptionsInput: "",
          referenceDataTypeId: undefined,
        }
      } else if (key === "tempOptionsInput") {
        // Parse comma-separated string into array for 'options'
        newFields[index] = {
          ...newFields[index],
          tempOptionsInput: value,
          options: value ? value.split(",").map((s: string) => s.trim()) : [],
        }
      } else {
        newFields[index] = { ...newFields[index], [key]: value }
      }
      return newFields
    })
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors.name = mergedDict.nameRequired
    }
    if (!organizationId) {
      newErrors.organizationId = mergedDict.organizationRequired
    }
    fields.forEach((field, index) => {
      if (!field.name.trim()) {
        newErrors[`field-${index}-name`] = mergedDict.fieldNameRequired
      }
      if (field.type === "dropdown" && (!field.options || field.options.length === 0)) {
        newErrors[`field-${index}-options`] = mergedDict.dropdownOptionsRequired
      }
      if (field.type === "reference" && !field.referenceDataTypeId) {
        newErrors[`field-${index}-reference`] = mergedDict.referenceDataTypeRequired
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        title: mergedDict.invalidInput,
        description: mergedDict.correctErrors,
        variant: "destructive",
      })
      return
    }

    const fieldsToSave = fields.map((field) => {
      const { tempOptionsInput, ...rest } = field // Exclude tempOptionsInput from saved data
      return rest
    })

    const dataTypeToSave: DataType = {
      id: dataType?.id, // Include ID if editing
      name,
      fields: fieldsToSave,
      organization_id: organizationId,
    }

    await onSave(dataTypeToSave)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dataType ? mergedDict.formTitleEdit : mergedDict.formTitleNew}</CardTitle>
        <CardDescription>{mergedDict.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">{mergedDict.nameLabel}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">{mergedDict.organizationLabel}</Label>
            <Select onValueChange={setOrganizationId} value={organizationId}>
              <SelectTrigger className={cn(errors.organizationId && "border-red-500")}>
                <SelectValue placeholder={mergedDict.selectOrganizationPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.organizationId && <p className="text-red-500 text-sm">{errors.organizationId}</p>}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{mergedDict.fieldsLabel}</h3>
            {fields.map((field, index) => (
              <div key={index} className="flex items-end gap-2 border p-3 rounded-md relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-grow">
                  <div className="space-y-2">
                    <Label htmlFor={`field-name-${index}`}>{mergedDict.fieldNameLabel}</Label>
                    <Input
                      id={`field-name-${index}`}
                      value={field.name}
                      onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                      className={errors[`field-${index}-name`] ? "border-red-500" : ""}
                    />
                    {errors[`field-${index}-name`] && (
                      <p className="text-red-500 text-sm">{errors[`field-${index}-name`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`field-type-${index}`}>{mergedDict.fieldTypeLabel}</Label>
                    <Select
                      onValueChange={(value: Field["type"]) => handleFieldChange(index, "type", value)}
                      value={field.type}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={mergedDict.selectFieldTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">{mergedDict.stringType}</SelectItem>
                        <SelectItem value="number">{mergedDict.numberType}</SelectItem>
                        <SelectItem value="boolean">{mergedDict.booleanType}</SelectItem>
                        <SelectItem value="date">{mergedDict.dateType}</SelectItem>
                        <SelectItem value="json">{mergedDict.jsonType}</SelectItem>
                        <SelectItem value="dropdown">{mergedDict.dropdownType}</SelectItem>
                        <SelectItem value="file">{mergedDict.fileType}</SelectItem>
                        <SelectItem value="reference">{mergedDict.referenceType}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {field.type === "dropdown" && (
                    <div className="col-span-full space-y-2">
                      <Label htmlFor={`field-options-${index}`}>{mergedDict.dropdownOptionsLabel}</Label>
                      <Textarea
                        id={`field-options-${index}`}
                        value={field.tempOptionsInput || ""} // Use tempOptionsInput for editing
                        onChange={(e) => handleFieldChange(index, "tempOptionsInput", e.target.value)}
                        placeholder={mergedDict.dropdownOptionsPlaceholder}
                        className={errors[`field-${index}-options`] ? "border-red-500" : ""}
                      />
                      {errors[`field-${index}-options`] && (
                        <p className="text-red-500 text-sm">{errors[`field-${index}-options`]}</p>
                      )}
                    </div>
                  )}
                  {field.type === "reference" && (
                    <div className="col-span-full space-y-2">
                      <Label htmlFor={`field-reference-${index}`}>{mergedDict.referenceDataTypeLabel}</Label>
                      <Select
                        onValueChange={(value) => handleFieldChange(index, "referenceDataTypeId", value)}
                        value={field.referenceDataTypeId || ""}
                      >
                        <SelectTrigger className={cn(errors[`field-${index}-reference`] && "border-red-500")}>
                          <SelectValue placeholder={mergedDict.selectReferenceDataTypePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Fetch and map other data types here */}
                          {/* This part needs to be implemented to fetch other data types */}
                          <SelectItem value="example-data-type-id">Example Data Type</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors[`field-${index}-reference`] && (
                        <p className="text-red-500 text-sm">{errors[`field-${index}-reference`]}</p>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeField(index)}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addField} className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              {mergedDict.addFieldButton}
            </Button>
          </div>

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
  formTitleNew: "Create New Data Type",
  formTitleEdit: "Edit Data Type",
  formDescription: "Define the structure and fields for your data type.",
  nameLabel: "Data Type Name",
  nameRequired: "Data Type Name is required.",
  organizationLabel: "Associated Organization",
  organizationRequired: "Organization is required.",
  selectOrganizationPlaceholder: "Select an organization",
  fieldsLabel: "Fields",
  fieldNameLabel: "Field Name",
  fieldNameRequired: "Field Name is required.",
  fieldTypeLabel: "Field Type",
  selectFieldTypePlaceholder: "Select a type",
  stringType: "Text",
  numberType: "Number",
  booleanType: "Boolean",
  dateType: "Date",
  jsonType: "JSON",
  dropdownType: "Dropdown",
  fileType: "File",
  referenceType: "Reference",
  dropdownOptionsLabel: "Dropdown Options (comma-separated)",
  dropdownOptionsPlaceholder: "e.g., Option A, Option B, Option C",
  dropdownOptionsRequired: "Dropdown options are required.",
  referenceDataTypeLabel: "Reference Data Type",
  referenceDataTypeRequired: "Reference Data Type is required.",
  selectReferenceDataTypePlaceholder: "Select a data type to reference",
  addFieldButton: "Add Field",
  cancelButton: "Cancel",
  saveButton: "Save Data Type",
  invalidInput: "Invalid Input",
  correctErrors: "Please correct the errors in the form.",
  failedToLoadOrganizations: "Failed to load organizations.",
  common: {
    error: "Error",
  },
}
