-- Create or replace a function to check if a given profile is associated with a specific organization.
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the user who created it,
-- allowing it to read the 'organization_profiles' table even if the current user's RLS would normally prevent it.
CREATE OR REPLACE FUNCTION public.is_profile_associated_with_organization(p_organization_id UUID, p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_profiles op
    WHERE op.organization_id = p_organization_id
      AND op.profile_id = p_profile_id
  );
END;
$$;

-- Drop the existing SELECT policy on public.data_types to ensure a clean slate for the new policy.
DROP POLICY IF EXISTS "Admins view all data types, managers view associated org data types." ON public.data_types;

-- Create a new SELECT policy for data_types:
-- Admins can view all data types.
-- Managers can view data types for organizations they manage.
-- Any authenticated user can view data types for organizations they are associated with.
CREATE POLICY "Admins view all, managers view associated, users view associated data types."
  ON public.data_types FOR SELECT
  USING (
    public.is_admin() OR
    public.is_manager_of_organization(data_types.organization_id) OR
    public.is_profile_associated_with_organization(data_types.organization_id, auth.uid())
  );
