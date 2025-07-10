-- Create or replace a function to check if the current authenticated user is a Manager.
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND type = 'Manager'
  );
END;
$$;

-- Drop existing policies on public.organizations to ensure a clean slate for new policies.
DROP POLICY IF EXISTS "Authenticated users can view organizations." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert organizations." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can delete organizations." ON public.organizations;

-- Policy for SELECT:
-- Admins can view all organizations.
-- Managers and regular users can view organizations they are associated with.
CREATE POLICY "Admins view all, others view associated organizations."
  ON public.organizations FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1
      FROM public.organization_profiles
      WHERE organization_id = organizations.id AND profile_id = auth.uid()
    )
  );

-- Policy for INSERT:
-- Only Admins can insert new organizations.
CREATE POLICY "Admins can insert organizations."
  ON public.organizations FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy for UPDATE:
-- Admins can update all organizations.
-- Managers can update organizations they are associated with.
CREATE POLICY "Admins update all, managers update associated organizations."
  ON public.organizations FOR UPDATE
  USING (
    public.is_admin() OR
    (
      public.is_manager() AND
      EXISTS (
        SELECT 1
        FROM public.organization_profiles
        WHERE organization_id = organizations.id AND profile_id = auth.uid()
      )
    )
  );

-- Policy for DELETE:
-- Only Admins can delete organizations.
CREATE POLICY "Admins can delete organizations."
  ON public.organizations FOR DELETE
  USING (public.is_admin());
