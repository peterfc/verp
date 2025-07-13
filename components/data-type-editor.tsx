"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"

interface Organization {
  id: string
  name: string
}

interface Field {
  name: string
  type: string
  options?: string[]
}

interface DataType {
  id?: string
  name: string
  fields: Field[]
  organization_id: string
}

interface DataTypeEditorProps {
  dataType?: DataType
  organizations: Organization[]
  onSave: (dataType: DataType) => void
  onCancel: () => void
  dict: {
    editorTitle: string
    editorDescription: string
    nameLabel: string
    fieldsLabel: string
    organizationLabel: string
    saveButton: string
    cancelButton: string
    invalidJson: string
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
      dropdown: string
      file: string
    }
    dropdownOptionsLabel: string
    dropdownOptionsPlaceholder: string
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
  const [fields, setFields] = useState<Field[]>(dataType?.fields || [])
  const [organizationId, setOrganizationId] = useState(dataType?.organization_id || "")
  const [tempOptionsInputs, setTempOptionsInputs] = useState<{ [key: number]: string }>({})

  // Debug logging
  console.log("DataTypeEditor - Initial dataType:", dataType)
  console.log("DataTypeEditor - Initial fields:", fields)

  useEffect(() => {
    if (dataType) {
      console.log("DataTypeEditor - Setting state from dataType:", dataType)
      setName(dataType.name)
      setFields(dataType.fields || [])
      setOrganizationId(dataType.organization_id)

      // Initialize temp options inputs for dropdown fields
      const tempInputs: { [key: number]: string } = {}
      dataType.fields?.forEach((field, index) => {
        console.log(`Field ${index}:`, field)
        if (field.options && Array.isArray(field.options)) {
          tempInputs[index] = field.options.join(", ")
          console.log(`Setting tempInput for field ${index}:`, tempInputs[index])
        }
      })
      setTempOptionsInputs(tempInputs)
    }
  }, [dataType])

  const addField = () => {
    setFields([...fields, { name: "", type: "string" }])
  }

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    setFields(newFields)

    // Clean up temp options input
    const newTempInputs = { ...tempOptionsInputs }
    delete newTempInputs[index]
    setTempOptionsInputs(newTempInputs)
  }

  const updateField = (index: number, key: keyof Field, value: any) => {
    const newFields = [...fields]

    if (key === "type") {
      // When changing type, handle options appropriately
      if (value === "dropdown") {
        // Initialize empty options if switching to dropdown
        if (!newFields[index].options) {
          newFields[index].options = []
          setTempOptionsInputs((prev) => ({ ...prev, [index]: "" }))
        }
      } else {
        // Remove options if switching away from dropdown
        delete newFields[index].options
        const newTempInputs = { ...tempOptionsInputs }
        delete newTempInputs[index]
        setTempOptionsInputs(newTempInputs)
      }
    }

    newFields[index] = { ...newFields[index], [key]: value }
    setFields(newFields)
  }

  const updateFieldOptions = (index: number, optionsString: string) => {
    setTempOptionsInputs((prev) => ({ ...prev, [index]: optionsString }))

    const options = optionsString
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)

    const newFields = [...fields]
    newFields[index] = { ...newFields[index], options }
    setFields(newFields)
  }

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    if (!organizationId) {
      return
    }

    // Validate fields
    for (const field of fields) {
      if (!field.name.trim()) {
        return
      }
    }

    onSave({
      id: dataType?.id,
      name: name.trim(),
      fields,
      organization_id: organizationId,
    })
  }

  // Determine field type, with fallback logic for dropdown detection
  const getFieldType = (field: Field, index: number) => {
    // If field has options array, it's a dropdown regardless of type field
    if (field.options && Array.isArray(field.options) && field.options.length > 0) {
      console.log(`Field ${index} detected as dropdown due to options:`, field.options)
      return "dropdown"
    }

    // Otherwise use the explicit type
    return field.type || "string"
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.editorTitle}</CardTitle>
        <CardDescription>{dict.editorDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">{dict.nameLabel}</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter data type name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">{dict.organizationLabel}</Label>
          <Select value={organizationId} onValueChange={setOrganizationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an organization" />
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{dict.fieldsLabel}</Label>
            <Button type="button" onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {dict.addFieldButton}
            </Button>
          </div>

          {fields.map((field, index) => {
            const fieldType = getFieldType(field, index)
            console.log(`Rendering field ${index} with type:`, fieldType)

            return (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label htmlFor={`field-name-${index}`}>Field Name</Label>
                    <Input
                      id={`field-name-${index}`}
                      value={field.name}
                      onChange={(e) => updateField(index, "name", e.target.value)}
                      placeholder="Enter field name"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`field-type-${index}`}>Field Type</Label>
                    <Select value={fieldType} onValueChange={(value) => updateField(index, "type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">{dict.fieldTypeOptions.string}</SelectItem>
                        <SelectItem value="number">{dict.fieldTypeOptions.number}</SelectItem>
                        <SelectItem value="boolean">{dict.fieldTypeOptions.boolean}</SelectItem>
                        <SelectItem value="date">{dict.fieldTypeOptions.date}</SelectItem>
                        <SelectItem value="json">{dict.fieldTypeOptions.json}</SelectItem>
                        <SelectItem value="dropdown">{dict.fieldTypeOptions.dropdown}</SelectItem>
                        <SelectItem value="file">{dict.fieldTypeOptions.file}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeField(index)} className="mt-6">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {fieldType === "dropdown" && (
                  <div className="ml-4">
                    <Textarea
                      value={tempOptionsInputs[index] || ""}
                      onChange={(e) => updateFieldOptions(index, e.target.value)}
                      placeholder={dict.dropdownOptionsPlaceholder}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {dict.cancelButton}
          </Button>
          <Button type="button" onClick={handleSave}>
            {dict.saveButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Export both named and default for compatibility
export default DataTypeEditor
