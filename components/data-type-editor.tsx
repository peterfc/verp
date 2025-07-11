"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea" // Re-import Textarea for dropdown options
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus } from "lucide-react"

interface Organization {
  id: string
  name: string
}

interface Field {
  name: string
  type: string
  options?: string[] // The parsed array of options
  tempOptionsInput?: string // The raw string input for the textarea
}

interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string }
}

interface DataTypeEditorProps {
  dataType?: DataType // Optional, for editing existing data types
  organizations: Organization[]
  onSave: (dataType: { id?: string; name: string; fields: Field[]; organization_id: string }) => void
  onCancel: () => void
  dict: {
    editorTitle: string
    editorDescription: string
    nameLabel: string
    fieldsLabel: string
    organizationLabel: string
    saveButton: string
    cancelButton: string
    invalidJson: string // Reusing for field name validation
    noOrganizationSelected: string
    noOrganizationsFound: string
    addFieldButton: string
    removeFieldButton: string
    fieldTypeOptions: {
      string: string
      number: string
      boolean: string
      date: string
      json: string
      dropdown: string // New: Dropdown type
    }
    dropdownOptionsLabel: string // New: Label for dropdown options
    dropdownOptionsPlaceholder: string // New: Placeholder for dropdown options
  }
  isAdmin: boolean
  isManager: boolean
}

export function DataTypeEditor({
  dataType,
  organizations,
  onSave,
  onCancel,
  dict,
  isAdmin,
  isManager,
}: DataTypeEditorProps) {
  const [name, setName] = useState(dataType?.name || "")
  const [fieldsArray, setFieldsArray] = useState<Field[]>(() => {
    if (dataType?.fields) {
      return dataType.fields.map((field) => ({
        ...field,
        tempOptionsInput: field.type === "dropdown" ? field.options?.join(", ") || "" : undefined,
      }))
    }
    return []
  })
  const [organizationId, setOrganizationId] = useState(dataType?.organization_id || "")
  const { toast } = useToast()

  useEffect(() => {
    if (dataType) {
      setName(dataType.name)
      setFieldsArray(
        dataType.fields.map((field) => ({
          ...field,
          tempOptionsInput: field.type === "dropdown" ? field.options?.join(", ") || "" : undefined,
        })) || [],
      )
      setOrganizationId(dataType.organization_id)
    } else {
      setName("")
      setFieldsArray([])
      setOrganizationId("")
    }
  }, [dataType])

  const handleAddField = useCallback(() => {
    setFieldsArray((prev) => [...prev, { name: "", type: "string" }])
  }, [])

  const handleRemoveField = useCallback((index: number) => {
    setFieldsArray((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleFieldNameChange = useCallback((index: number, value: string) => {
    setFieldsArray((prev) => prev.map((field, i) => (i === index ? { ...field, name: value } : field)))
  }, [])

  const handleFieldTypeChange = useCallback((index: number, value: string) => {
    setFieldsArray((prev) =>
      prev.map((field, i) => {
        if (i === index) {
          const newField: Field = { ...field, type: value }
          if (value === "dropdown") {
            // Changed to lowercase "dropdown"
            newField.options = field.options || [] // Keep existing parsed options
            newField.tempOptionsInput = field.tempOptionsInput || field.options?.join(", ") || "" // Keep existing raw input or derive from parsed
          } else {
            delete newField.options
            delete newField.tempOptionsInput // Remove raw input if type is not Dropdown
          }
          return newField
        }
        return field
      }),
    )
  }, [])

  const handleDropdownOptionsChange = useCallback((index: number, value: string) => {
    setFieldsArray((prev) => prev.map((field, i) => (i === index ? { ...field, tempOptionsInput: value } : field)))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors: string[] = []

    const processedFields: Field[] = fieldsArray.map((field) => {
      if (!field.name.trim()) {
        validationErrors.push("All field names must be filled.")
      }

      if (field.type === "dropdown") {
        // Changed to lowercase "dropdown"
        const parsedOptions = (field.tempOptionsInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)

        if (parsedOptions.length === 0) {
          validationErrors.push(`Dropdown field "${field.name || "Unnamed field"}" must have at least one option.`)
        }
        return { ...field, options: parsedOptions, tempOptionsInput: undefined }
      }
      return { ...field, tempOptionsInput: undefined }
    })

    if (!organizationId) {
      validationErrors.push("Please choose an organization before saving.")
    }

    if (validationErrors.length > 0) {
      toast({
        title: dict.invalidJson, // Reusing this for general validation errors
        description: validationErrors.join("\n"),
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    onSave({ id: dataType?.id, name, fields: processedFields, organization_id: organizationId })
  }

  const isFormDisabled = !isAdmin && !isManager

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.editorTitle}</CardTitle>
        <CardDescription>{dict.editorDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              {dict.nameLabel}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={isFormDisabled}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="organization" className="text-right">
              {dict.organizationLabel}
            </Label>
            <Select value={organizationId} onValueChange={setOrganizationId} disabled={isFormDisabled}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={dict.organizationLabel} />
              </SelectTrigger>
              <SelectContent>
                {organizations.length === 0 ? (
                  <SelectItem value="" disabled>
                    {dict.noOrganizationsFound}
                  </SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Fields Section */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">{dict.fieldsLabel}</Label>
            <div className="col-span-3 grid gap-2 w-full">
              {fieldsArray.map((field, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center gap-2 w-full">
                    <Input
                      placeholder={dict.nameLabel}
                      value={field.name}
                      onChange={(e) => handleFieldNameChange(index, e.target.value)}
                      className="flex-1"
                      required
                      disabled={isFormDisabled}
                    />
                    <Select
                      value={field.type}
                      onValueChange={(value) => handleFieldTypeChange(index, value)}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">{dict.fieldTypeOptions.string}</SelectItem>
                        <SelectItem value="number">{dict.fieldTypeOptions.number}</SelectItem>
                        <SelectItem value="boolean">{dict.fieldTypeOptions.boolean}</SelectItem>
                        <SelectItem value="date">{dict.fieldTypeOptions.date}</SelectItem>
                        <SelectItem value="json">{dict.fieldTypeOptions.json}</SelectItem>
                        <SelectItem value="dropdown">{dict.fieldTypeOptions.dropdown}</SelectItem>{" "}
                        {/* Changed to lowercase "dropdown" */}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveField(index)}
                      disabled={isFormDisabled}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">{dict.removeFieldButton}</span>
                    </Button>
                  </div>
                  {field.type === "dropdown" && ( // Changed to lowercase "dropdown"
                    <div className="flex items-center gap-2 w-full pl-4">
                      <Label htmlFor={`options-${index}`} className="sr-only">
                        {dict.dropdownOptionsLabel}
                      </Label>
                      <Textarea
                        id={`options-${index}`}
                        placeholder={dict.dropdownOptionsPlaceholder}
                        value={field.tempOptionsInput || ""} // Bind to tempOptionsInput
                        onChange={(e) => handleDropdownOptionsChange(index, e.target.value)}
                        className="flex-1 min-h-[40px]"
                        required
                        disabled={isFormDisabled}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddField}
                className="w-full mt-2 bg-transparent"
                disabled={isFormDisabled}
              >
                <Plus className="mr-2 h-4 w-4" />
                {dict.addFieldButton}
              </Button>
            </div>
          </div>
          {/* End Dynamic Fields Section */}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {dict.cancelButton}
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isFormDisabled}>
          {dict.saveButton}
        </Button>
      </CardFooter>
    </Card>
  )
}
