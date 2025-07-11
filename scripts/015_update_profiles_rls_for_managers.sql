-- Create or replace a function to check if a given profile is associated with any organization
-- that the current authenticated manager user is also associated with.
CREATE OR REPLACE FUNCTION public.is_profile_associated_with_manager_orgs(p_profile_id UUID, p_manager_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator's privileges to access organization_profiles
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_profiles op_p
    JOIN public.organization_profiles op_m ON op_p.organization_id = op_m.organization_id
    WHERE op_p.profile_id = p_profile_id
      AND op_m.profile_id = p_manager_id
  );
END;
$$;

-- Drop existing policies on public.profiles to ensure a clean slate for new policies.
DROP POLICY IF EXISTS "Admins can view all profiles, users can view their own." ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles, users can update their own." ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles, users can delete their own." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles; -- Drop the old insert policy

-- Policy for SELECT:
-- Admins can view all profiles.
-- Regular users can view their own profile.
-- Managers can view profiles associated with organizations they manage.
CREATE POLICY "Admins view all, users view own, managers view associated profiles."
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    public.is_admin() OR
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid()))
  );

-- Policy for INSERT:
-- Admins can insert any profile.
-- Managers can insert any profile.
-- Regular users can insert their own profile (primarily via signup trigger).
CREATE POLICY "Admins and managers can insert profiles, users can insert their own."
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    public.is_admin() OR
    public.is_manager()
  );

-- Policy for UPDATE:
-- Admins can update all profiles.
-- Regular users can update their own profile.
-- Managers can update profiles associated with organizations they manage.
CREATE POLICY "Admins update all, users update own, managers update associated profiles."
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    public.is_admin() OR
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid()))
  );

-- Policy for DELETE:
-- Admins can delete all profiles.
-- Regular users can delete their own profile.
-- Managers can delete profiles associated with organizations they manage.
CREATE POLICY "Admins delete all, users delete own, managers delete associated profiles."
  ON public.profiles FOR DELETE
  USING (
    auth.uid() = id OR
    public.is_admin() OR
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid()))
  );
