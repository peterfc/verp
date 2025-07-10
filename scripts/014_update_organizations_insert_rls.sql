-- Drop the existing INSERT policy on public.organizations to ensure a clean slate.
DROP POLICY IF EXISTS "Authenticated users can insert organizations." ON public.organizations;

-- Create a new INSERT policy: Only Admins can insert new organizations.
CREATE POLICY "Admins can insert organizations."
  ON public.organizations FOR INSERT
  WITH CHECK (public.is_admin());
