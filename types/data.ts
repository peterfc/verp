export interface Profile {
  id: string
  name: string
  email: string
  type: "Administrator" | "Manager" | "User"
  organization_id: string | null
  organizations?: { name: string } | null // Joined organization name
}

export interface Organization {
  id: string
  name: string
  contact: string // Added
  industry: string // Added
  profiles?: Profile[] // Added, assuming the API returns nested profiles
}

export interface Field {
  name: string
  type: "string" | "number" | "boolean" | "date" | "json" | "dropdown" | "file" | "reference"
  options?: string[] // For dropdowns
  tempOptionsInput?: string // Temporary field for form input (comma-separated string)
  referenceDataTypeId?: string // For reference fields, stores the ID of the data type being referenced
}

export interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string } // Joined organization name
}

export interface DynamicDataEntry {
  id: string // Optional for new entries
  data_type_id: string
  organization_id: string
  data: Record<string, any> // Dynamic data based on DataType fields
  created_at?: string
  updated_at?: string
}
