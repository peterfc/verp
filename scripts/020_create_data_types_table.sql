-- Drop the table if it exists to ensure a clean run
DROP TABLE IF EXISTS public.data_types CASCADE;

-- Drop the trigger function if it exists (and any dependent triggers)
DROP FUNCTION IF EXISTS public.set_updated_at_timestamp() CASCADE;

-- Create the data_types table
CREATE TABLE IF NOT EXISTS public.data_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Store fields as a JSON array
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Will be set by application
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL -- Will be set by application
);

-- Enable Row Level Security for data_types
ALTER TABLE public.data_types ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the current manager is associated with a specific organization.
-- This function still needs SECURITY DEFINER to bypass RLS on other tables.
CREATE OR REPLACE FUNCTION public.is_manager_of_organization(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_profiles op
    WHERE op.organization_id = p_organization_id
      AND op.profile_id = auth.uid()
      AND public.is_manager() -- Ensure the current user is actually a manager
  );
END;
$$;

-- Policy for SELECT: Admins view all, Managers view associated org data types.
CREATE POLICY "Admins view all data types, managers view associated org data types."
  ON public.data_types FOR SELECT
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(data_types.organization_id)
  );

-- Policy for INSERT: Admins insert all, Managers insert for associated orgs.
CREATE POLICY "Admins insert all data types, managers insert for associated orgs."
  ON public.data_types FOR INSERT
  WITH CHECK (
    public.is_admin() OR
    public.is_manager_of_organization(data_types.organization_id) -- Applied user's fix here
  );

-- Policy for UPDATE: Admins update all, Managers update for associated orgs.
CREATE POLICY "Admins update all data types, managers update for associated orgs."
  ON public.data_types FOR UPDATE
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(data_types.organization_id)
  );

-- Policy for DELETE: Admins delete all, Managers delete for associated orgs.
CREATE POLICY "Admins delete all data types, managers delete for associated orgs."
  ON public.data_types FOR DELETE
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(data_types.organization_id)
  );
