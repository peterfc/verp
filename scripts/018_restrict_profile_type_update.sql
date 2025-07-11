-- Drop the existing UPDATE policy on public.profiles.
DROP POLICY IF EXISTS "Admins update all, users update own, managers update associated profiles." ON public.profiles;

-- Create a new UPDATE policy:
-- Admins can update all profiles.
-- Regular users can update their own profile (excluding type).
-- Managers can update associated profiles (excluding type), and their own profile (excluding type).
CREATE POLICY "Admins update all, others update (not type) own/associated profiles."
  ON public.profiles FOR UPDATE
  USING (
    public.is_admin() OR
    (auth.uid() = id) OR -- Allows users to update their own profile
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid())) -- Allows managers to update associated profiles
  )
  WITH CHECK (
    public.is_admin() OR -- Admins can change type
    (OLD.type = NEW.type) -- Non-admins can only update if the type remains unchanged
  );
