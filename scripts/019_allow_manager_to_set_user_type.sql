-- Drop the existing UPDATE policy to replace it with the refined one.
DROP POLICY IF EXISTS "Admins update all, others update (not type) own/associated profiles." ON public.profiles;

-- Create a new UPDATE policy:
-- Admins can update all profiles and all columns.
-- Managers can update their own name/email, and name/email/type (to Manager/User, not Admin) for associated profiles.
-- Regular users can update their own name/email.
CREATE POLICY "Admins update all, managers update associated (not admin type), users update own (not type)."
  ON public.profiles FOR UPDATE
  USING (
    public.is_admin() OR -- Admins can update any profile
    (auth.uid() = id) OR -- Any authenticated user can update their own profile
    (public.is_manager() AND public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid())) -- Managers can update associated profiles
  )
  WITH CHECK (
    public.is_admin() OR -- Admins can change type freely
    (OLD.type = NEW.type) OR -- If type is not changed, it's allowed for non-admins
    (
      public.is_manager() AND -- If current user is a manager
      public.is_profile_associated_with_manager_orgs(profiles.id, auth.uid()) AND -- And the profile is associated with their orgs
      NEW.type IN ('Manager', 'User') AND -- And the new type is Manager or User
      OLD.type != 'Administrator' -- And the old type was not Administrator (managers cannot downgrade admins)
    )
  );
