export interface Field {
  name: string
  type: string
  options?: string[]
  referenceDataTypeId?: string
}

export interface DataType {
  id: string
  name: string
  fields: Field[]
  organization_id: string
  organization?: { name: string }
}

export interface DynamicDataEntry {
  id?: string // Optional for new entries
  data_type_id: string
  organization_id: string
  data: Record<string, any>
  created_at?: string
  updated_at?: string
}
