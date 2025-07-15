import { z } from "zod"

export interface Organization {
  id: string
  name: string
  contact?: string
  industry?: string
  profiles?: Profile[]
}

export interface Profile {
  id: string
  email: string
  type: "Administrator" | "Manager" | "User"
  organization_id?: string
  organization?: Organization
}

export type FieldType = "string" | "number" | "boolean" | "date" | "json" | "dropdown" | "file" | "reference"

export interface Field {
  name: string
  type: FieldType
  options?: string[] // For dropdowns
  tempOptionsInput?: string // Temporary field for dropdown options input
  referenceDataTypeId?: string // For reference fields
}

export interface DataType {
  id?: string // Made optional for new data types
  name: string
  organization_id: string
  fields: Field[]
}

// Zod schema for data type form (if react-hook-form is used)
export const DataTypeFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  organization_id: z.string().min(1, { message: "Organization is required." }),
  fields: z.array(
    z.object({
      name: z.string().min(1, { message: "Field name is required." }),
      type: z.enum(["string", "number", "boolean", "date", "json", "dropdown", "file", "reference"]),
      options: z.array(z.string()).optional(),
      tempOptionsInput: z.string().optional(), // Temporary field for dropdown options input
      referenceDataTypeId: z.string().optional(),
    }),
  ),
})

export type DataTypeFormValues = z.infer<typeof DataTypeFormSchema>

export interface DataTypeEditorProps {
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
  disabled?: boolean
  name: string
  setName: (name: string) => void
  organizationId: string
  setOrganizationId: (id: string) => void
  fields: Field[]
  updateField: (index: number, updated: Partial<Field>) => void
  addField: () => void
  removeField: (index: number) => void
}

export interface OrganizationFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | undefined
  onSave: (organizationData: {
    id?: string
    name: string
    contact?: string
    industry?: string
    profile_ids?: string[]
  }) => Promise<void>
  dict: {
    editTitle: string
    addTitle: string
    editDescription: string
    addDescription: string
    nameLabel: string
    namePlaceholder: string
    contactLabel: string
    contactPlaceholder: string
    industryLabel: string
    industryPlaceholder: string
    profilesLabel: string
    selectProfilesPlaceholder: string
    saveChangesButton: string
    addOrganizationButton: string
    cancelButton: string
    saveSuccess: string
    saveError: string
    noProfilesFound: string
    errorToastTitle: string
    errorToastDescription: string
  }
  isAdmin: boolean
  isManager: boolean
  profiles: Profile[]
  lang: string
}
