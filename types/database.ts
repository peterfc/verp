export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          type: string
          created_at: string
          updated_at: string
          needs_password_setup: boolean | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          type?: string
          created_at?: string
          updated_at?: string
          needs_password_setup?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          type?: string
          created_at?: string
          updated_at?: string
          needs_password_setup?: boolean | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_profiles: {
        Row: {
          id: string
          organization_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      data_types: {
        Row: {
          id: string
          name: string
          fields: Json
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          fields: Json
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          fields?: Json
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      dynamic_data_entries: {
        Row: {
          id: string
          data_type_id: string
          data: Json
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          data_type_id: string
          data: Json
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          data_type_id?: string
          data?: Json
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
