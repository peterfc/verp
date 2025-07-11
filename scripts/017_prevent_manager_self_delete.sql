-- Drop the existing DELETE policy on public.profiles.
DROP POLICY IF EXISTS "Admins delete all, users delete own, managers delete associated profiles." ON public.profiles;

-- Create a new DELETE policy:
-- Admins can delete all profiles.
-- Regular users can delete their own profile.
-- Managers can delete profiles associated with organizations they manage, but NOT their own profile.
CREATE POLICY "Admins delete all, users delete own, managers delete associated (not self) profiles."
  ON public.profiles FOR DELETE
  USING (
    public.is_admin() OR
    (auth.uid() = id AND NOT public.is_manager()) OR -- Regular users can delete their own profile
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid()) AND auth.uid() <> profiles.id) -- Managers can delete associated profiles, but not their own
  );
