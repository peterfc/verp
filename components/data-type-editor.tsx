"use client"

import type React from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus } from "lucide-react"
import type { Organization, DataType, Field, DataTypeFormSchema } from "@/types/data" // Import interfaces from types/data
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import type { UseFormReturn } from "react-hook-form"
import * as z from "zod"

interface DataTypeEditorProps {
  form: UseFormReturn<z.infer<typeof DataTypeFormSchema>>
  dataType?: DataType // existing dataType when editing, otherwise undefined for "new"
  onSave: (newDataType: any) => Promise<void>
  onCancel: () => void
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
  form,
  dataType,
  organizations,
  availableDataTypes,
  dict,
  isAdmin,
  isManager,
  disabled,
}) => {
  const fields = form.watch("fields")
  const organizationId = form.watch("organization_id")

  /* helpers ──────────────────────────────────────────────────────── */

  const addField = useCallback(() => {
    const currentFields = form.getValues("fields")
    form.setValue("fields", [...currentFields, { name: "", type: "string" }], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [form])

  const removeField = useCallback(
    (index: number) => {
      const currentFields = form.getValues("fields")
      form.setValue(
        "fields",
        currentFields.filter((_, i) => i !== index),
        { shouldDirty: true, shouldValidate: true },
      )
    },
    [form],
  )

  const updateField = useCallback(
    (index: number, updated: Partial<Field>) => {
      const currentFields = form.getValues("fields")
      const newFields = currentFields.map((f, i) => (i === index ? { ...f, ...updated } : f))
      form.setValue("fields", newFields, { shouldDirty: true, shouldValidate: true })
    },
    [form],
  )

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
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem className="grid grid-cols-4 items-center gap-4">
            <FormLabel className="text-right">{dict.nameLabel}</FormLabel>
            <FormControl>
              <Input {...field} className="col-span-3" required disabled={disabled} />
            </FormControl>
            <FormMessage className="col-span-3 col-start-2" />
          </FormItem>
        )}
      />

      {/* Organization Select */}
      <FormField
        control={form.control}
        name="organization_id"
        render={({ field }) => (
          <FormItem className="grid grid-cols-4 items-center gap-4">
            <FormLabel className="text-right">{dict.organizationLabel}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
              <FormControl>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={dict.organizationLabel} />
                </SelectTrigger>
              </FormControl>
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
            <FormMessage className="col-span-3 col-start-2" />
          </FormItem>
        )}
      />

      {/* Dynamic Field List */}
      <div className="grid grid-cols-4 gap-4">
        <Label className="text-right pt-2">{dict.fieldsLabel}</Label>
        <div className="col-span-3 space-y-4">
          {fields.map((field, i) => {
            const fieldType = getFieldType(field)

            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`fields.${i}.name`}
                    render={({ field: nameField }) => (
                      <FormItem className="flex-grow">
                        <FormControl>
                          <Input placeholder={dict.nameLabel} {...nameField} required disabled={disabled} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`fields.${i}.type`}
                    render={({ field: typeField }) => (
                      <FormItem>
                        <Select
                          value={fieldType} // Use the determined fieldType for display
                          onValueChange={(v) => {
                            updateField(i, {
                              type: v as Field["type"],
                              options: undefined,
                              tempOptionsInput: undefined,
                              referenceDataTypeId: undefined,
                            })
                            typeField.onChange(v) // Also update the react-hook-form field
                          }}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                          </FormControl>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeField(i)} disabled={disabled}>
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                {fieldType === "dropdown" && (
                  <FormField
                    control={form.control}
                    name={`fields.${i}.tempOptionsInput`}
                    render={({ field: optionsField }) => (
                      <FormItem className="ml-4">
                        <FormControl>
                          <Textarea
                            placeholder={dict.dropdownOptionsPlaceholder}
                            {...optionsField}
                            disabled={disabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {fieldType === "reference" && (
                  <FormField
                    control={form.control}
                    name={`fields.${i}.referenceDataTypeId`}
                    render={({ field: referenceField }) => (
                      <FormItem className="ml-4">
                        <Select
                          value={referenceField.value ?? ""}
                          onValueChange={referenceField.onChange}
                          disabled={disabled}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={dict.referenceDataTypePlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableReferenceDataTypes().map((dt) => (
                              <SelectItem key={dt.id} value={dt.id}>
                                {dt.name} ({dt.organization?.name || "Unknown Org"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
