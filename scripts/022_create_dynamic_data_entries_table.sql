-- Create the dynamic_data_entries table
CREATE TABLE IF NOT EXISTS public.dynamic_data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type_id UUID REFERENCES public.data_types(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL, -- Redundant but useful for RLS
  data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores the actual dynamic data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for dynamic_data_entries
ALTER TABLE public.dynamic_data_entries ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT:
-- Admins can view all dynamic data entries.
-- Managers can view dynamic data entries for organizations they manage.
-- Any authenticated user can view dynamic data entries for organizations they are associated with.
CREATE POLICY "Admins view all, managers view associated, users view associated dynamic data."
  ON public.dynamic_data_entries FOR SELECT
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(dynamic_data_entries.organization_id) OR
    public.is_profile_associated_with_organization(dynamic_data_entries.organization_id, auth.uid())
  );

-- Policy for INSERT:
-- Admins can insert any dynamic data entry.
-- Managers can insert dynamic data entries for organizations they manage.
CREATE POLICY "Admins insert all, managers insert for associated dynamic data."
  ON public.dynamic_data_entries FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    public.is_manager_of_organization(dynamic_data_entries.organization_id)
  );

-- Policy for UPDATE:
-- Admins can update all dynamic data entries.
-- Managers can update dynamic data entries for organizations they manage.
CREATE POLICY "Admins update all, managers update for associated dynamic data."
  ON public.dynamic_data_entries FOR UPDATE
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(dynamic_data_entries.organization_id)
  );

-- Policy for DELETE:
-- Admins can delete all dynamic data entries.
-- Managers can delete dynamic data entries for organizations they manage.
CREATE POLICY "Admins delete all, managers delete for associated dynamic data."
  ON public.dynamic_data_entries FOR DELETE
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(dynamic_data_entries.organization_id)
  );
