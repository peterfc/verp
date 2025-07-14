export interface Field {
  name: string
  type: string
  options?: string[] // For 'Dropdown' type
  referenceDataTypeId?: string // For 'Reference' type
}

export interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string } // Optional, for display purposes
}

export interface DynamicDataEntry {
  id: string
  data_type_id: string
  organization_id: string
  data: Record<string, any> // Stores the actual dynamic data based on DataType fields
  created_at: string | null // Can be null if not yet set or from a partial fetch
  updated_at: string | null // Can be null if not yet set or from a partial fetch
}
