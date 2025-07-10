-- Drop any existing DELETE policies on public.organizations to ensure a clean slate.
-- This will remove any potentially conflicting policies.
DROP POLICY IF EXISTS "Admins can delete organizations." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can delete organizations." ON public.organizations;
-- Add any other DELETE policy names you find here if they exist, e.g.:
-- DROP POLICY IF EXISTS "Public organizations can be deleted by everyone." ON public.organizations;

-- Re-create the correct DELETE policy: Only Admins can delete organizations.
CREATE POLICY "Admins can delete organizations."
  ON public.organizations FOR DELETE
  USING (public.is_admin());
