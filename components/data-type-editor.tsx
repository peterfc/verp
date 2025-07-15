"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus } from "lucide-react"
import type { Organization, DataType, Field } from "@/types/data" // Import interfaces from types/data

interface DataTypeEditorProps {
  name: string
  setName: (name: string) => void
  organizationId: string
  setOrganizationId: (id: string) => void
  fields: Field[]
  updateField: (index: number, updated: Partial<Field>) => void
  addField: () => void
  removeField: (index: number) => void
  dataType?: DataType // existing dataType when editing, otherwise undefined for "new"
  organizations: Organization[]
  availableDataTypes: DataType[]
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
      reference: string
    }
    dropdownOptionsLabel: string
    dropdownOptionsPlaceholder: string
    referenceDataTypeLabel: string
    referenceDataTypePlaceholder: string
  }
  isAdmin: boolean
  isManager: boolean
  disabled: boolean // Prop to control form disabling
}

/* ─────────────────────────────────────────────────────────────────── */

const DataTypeEditor: React.FC<DataTypeEditorProps> = ({
  name,
  setName,
  organizationId,
  setOrganizationId,
  fields,
  updateField,
  addField,
  removeField,
  dataType,
  organizations,
  availableDataTypes,
  dict,
  disabled,
}) => {
  // Determine field type, with fallback logic for dropdown detection
  const getFieldType = (field: Field) => {
    // If field has options array, it's a dropdown regardless of type field
    if (field.options && Array.isArray(field.options) && field.options.length > 0) {
      return "dropdown"
    }
    // If field has referenceDataTypeId, it's a reference field
    if (field.referenceDataTypeId) {
      return "reference"
    }
    // Otherwise use the explicit type
    return field.type || "string"
  }

  // Get available data types for reference (excluding current one being edited)
  const getAvailableReferenceDataTypes = () => {
    return availableDataTypes.filter((dt) => dt.id !== dataType?.id)
  }

  /* ui ──────────────────────────────────────────────────────────── */

  return (
    <div className="grid gap-6">
      {/* Name Field */}
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
          disabled={disabled}
        />
      </div>

      {/* Organization Select */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="organization" className="text-right">
          {dict.organizationLabel}
        </Label>
        <Select value={organizationId} onValueChange={setOrganizationId} disabled={disabled}>
          <SelectTrigger className="col-span-3" id="organization">
            <SelectValue placeholder={dict.organizationLabel} />
          </SelectTrigger>
          <SelectContent>
            {organizations.length === 0 && (
              <SelectItem value="__none" disabled>
                {dict.noOrganizationsFound}
              </SelectItem>
            )}
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic Field List */}
      <div className="grid grid-cols-4 gap-4">
        <Label className="text-right pt-2">{dict.fieldsLabel}</Label>
        <div className="col-span-3 space-y-4">
          {fields.map((field, i) => {
            const fieldType = getFieldType(field)

            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={dict.nameLabel}
                    value={field.name}
                    onChange={(e) => updateField(i, { name: e.target.value })}
                    required
                    disabled={disabled}
                  />
                  <Select
                    value={fieldType} // Use the determined fieldType for display
                    onValueChange={(v) => {
                      updateField(i, {
                        type: v as Field["type"],
                        options: undefined,
                        tempOptionsInput: undefined,
                        referenceDataTypeId: undefined,
                      })
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">{dict.fieldTypeOptions.string}</SelectItem>
                      <SelectItem value="number">{dict.fieldTypeOptions.number}</SelectItem>
                      <SelectItem value="boolean">{dict.fieldTypeOptions.boolean}</SelectItem>
                      <SelectItem value="date">{dict.fieldTypeOptions.date}</SelectItem>
                      <SelectItem value="json">{dict.fieldTypeOptions.json}</SelectItem>
                      <SelectItem value="dropdown">{dict.fieldTypeOptions.dropdown}</SelectItem>
                      <SelectItem value="file">{dict.fieldTypeOptions.file}</SelectItem>
                      <SelectItem value="reference">{dict.fieldTypeOptions.reference}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeField(i)} disabled={disabled}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                {fieldType === "dropdown" && (
                  <div className="ml-4">
                    <Textarea
                      placeholder={dict.dropdownOptionsPlaceholder}
                      value={field.tempOptionsInput ?? ""}
                      onChange={(e) => updateField(i, { tempOptionsInput: e.target.value })}
                      disabled={disabled}
                    />
                  </div>
                )}

                {fieldType === "reference" && (
                  <div className="ml-4">
                    <Select
                      value={field.referenceDataTypeId ?? ""}
                      onValueChange={(v) => updateField(i, { referenceDataTypeId: v })}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={dict.referenceDataTypePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableReferenceDataTypes().map((dt) => (
                          <SelectItem key={dt.id} value={dt.id}>
                            {dt.name} ({dt.organization?.name || "Unknown Org"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}

          <Button type="button" variant="outline" onClick={addField} disabled={disabled}>
            <Plus className="h-4 w-4 mr-2" /> {dict.addFieldButton}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* public API */
export { DataTypeEditor }
export default DataTypeEditor
