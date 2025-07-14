"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Minus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Organization {
  id: string
  name: string
}

interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string }
}

interface Field {
  name: string
  type: string
  options?: string[]
  referenceDataTypeId?: string
  /* raw textarea input for dropdown options – not saved to DB */
  tempOptionsInput?: string
}

interface DataTypeEditorProps {
  /* existing dataType when editing, otherwise undefined for "new" */
  dataType?: DataType
  organizations: Organization[]
  availableDataTypes: DataType[]
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
}

/* ─────────────────────────────────────────────────────────────────── */

const DataTypeEditor: React.FC<DataTypeEditorProps> = ({
  dataType,
  organizations,
  availableDataTypes,
  onSave,
  onCancel,
  dict,
  isAdmin,
  isManager,
}) => {
  const [name, setName] = useState(dataType?.name || "")
  const [organizationId, setOrganizationId] = useState(dataType?.organization_id || "")
  const [fields, setFields] = useState<Field[]>(() => {
    if (!dataType?.fields?.length) return []
    return dataType.fields.map((f) =>
      f.type === "dropdown"
        ? { ...f, tempOptionsInput: (f.options ?? []).join(", ") }
        : { ...f, tempOptionsInput: undefined },
    )
  })

  /* helpers ──────────────────────────────────────────────────────── */

  const isFormDisabled = !isAdmin && !isManager

  const addField = useCallback(() => setFields((prev) => [...prev, { name: "", type: "string" }]), [])

  const removeField = useCallback((index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateField = useCallback((index: number, updated: Partial<Field>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...updated } : f)))
  }, [])

  /* sync props → state when dialog re-opens ─────────────────────── */

  useEffect(() => {
    if (dataType) {
      setName(dataType.name)
      setOrganizationId(dataType.organization_id)
      setFields(
        dataType.fields.map((f) =>
          f.type === "dropdown"
            ? { ...f, tempOptionsInput: (f.options ?? []).join(", ") }
            : { ...f, tempOptionsInput: undefined },
        ),
      )
    } else {
      setName("")
      setOrganizationId("")
      setFields([])
    }
  }, [dataType])

  /* submit ───────────────────────────────────────────────────────── */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isFormDisabled) return

    /* basic validation */
    if (!organizationId) {
      toast({
        title: dict.noOrganizationSelected,
        variant: "destructive",
      })
      return
    }

    const errors: string[] = []
    const cleaned: Field[] = fields.map((f) => {
      if (!f.name.trim()) errors.push("Every field needs a name.")
      if (f.type === "dropdown") {
        const opts = (f.tempOptionsInput ?? "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
        if (opts.length === 0) errors.push(`Dropdown "${f.name || "Unnamed"}" needs options.`)
        return { ...f, options: opts }
      }
      if (f.type === "reference") {
        if (!f.referenceDataTypeId) {
          errors.push(`Reference field "${f.name || "Unnamed"}" needs a data type selection.`)
        }
        return { ...f, options: undefined }
      }
      return { ...f, options: undefined, referenceDataTypeId: undefined }
    })

    if (errors.length) {
      toast({ title: dict.invalidJson, description: errors.join("\n"), variant: "destructive" })
      return
    }

    onSave({ id: dataType?.id, name, organization_id: organizationId, fields: cleaned })
  }

  // Determine field type, with fallback logic for dropdown detection
  const getFieldType = (field: Field, index: number) => {
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{dict.editorTitle}</CardTitle>
        <CardDescription>{dict.editorDescription}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Name & Organisation */}
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{dict.nameLabel}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={isFormDisabled}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{dict.organizationLabel}</Label>
            <Select value={organizationId} onValueChange={setOrganizationId} disabled={isFormDisabled}>
              <SelectTrigger className="col-span-3">
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

          {/* dynamic field list */}
          <div className="grid grid-cols-4 gap-4">
            <Label className="text-right pt-2">{dict.fieldsLabel}</Label>
            <div className="col-span-3 space-y-4">
              {fields.map((field, i) => {
                const fieldType = getFieldType(field, i)

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={dict.nameLabel}
                        value={field.name}
                        onChange={(e) => updateField(i, { name: e.target.value })}
                        required
                        disabled={isFormDisabled}
                      />
                      <Select
                        value={fieldType}
                        onValueChange={(v) => updateField(i, { type: v })}
                        disabled={isFormDisabled}
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
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeField(i)}
                        disabled={isFormDisabled}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>

                    {fieldType === "dropdown" && (
                      <div className="ml-4">
                        <Textarea
                          placeholder={dict.dropdownOptionsPlaceholder}
                          value={field.tempOptionsInput ?? ""}
                          onChange={(e) => updateField(i, { tempOptionsInput: e.target.value })}
                          disabled={isFormDisabled}
                        />
                      </div>
                    )}

                    {fieldType === "reference" && (
                      <div className="ml-4">
                        <Select
                          value={field.referenceDataTypeId ?? ""}
                          onValueChange={(v) => updateField(i, { referenceDataTypeId: v })}
                          disabled={isFormDisabled}
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

              <Button type="button" variant="outline" onClick={addField} disabled={isFormDisabled}>
                <Plus className="h-4 w-4 mr-2" /> {dict.addFieldButton}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {dict.cancelButton}
        </Button>
        <Button onClick={handleSubmit} disabled={isFormDisabled}>
          {dict.saveButton}
        </Button>
      </CardFooter>
    </Card>
  )
}

/* public API */
export { DataTypeEditor }
export default DataTypeEditor
