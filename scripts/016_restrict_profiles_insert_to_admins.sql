-- Drop the existing INSERT policy on public.profiles.
DROP POLICY IF EXISTS "Admins and managers can insert profiles, users can insert their own." ON public.profiles;

-- Create a new INSERT policy: Only Admins can insert profiles, and users can insert their own (for signup).
CREATE POLICY "Admins can insert profiles, users can insert their own."
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR -- Allows users to create their own profile (via signup trigger)
    public.is_admin()   -- Allows administrators to create any profile
  );
