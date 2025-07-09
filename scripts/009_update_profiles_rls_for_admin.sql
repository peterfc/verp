-- Create or replace a function to check if the current authenticated user is an Administrator.
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the user who created it (typically the database owner),
-- allowing it to read the 'profiles' table even if the current user's RLS would normally prevent it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND type = 'Administrator'
  );
END;
$$;

-- Drop existing policies to avoid conflicts and ensure clean application of new policies.
-- It's good practice to drop by name before creating new ones.
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;

-- Policy for SELECT: Admins can view all profiles, regular users can view their own.
CREATE POLICY "Admins can view all profiles, users can view their own."
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Policy for UPDATE: Admins can update all profiles, regular users can update their own.
CREATE POLICY "Admins can update all profiles, users can update their own."
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- Policy for DELETE: Admins can delete all profiles, regular users can delete their own.
CREATE POLICY "Admins can delete all profiles, users can delete their own."
  ON public.profiles FOR DELETE
  USING (auth.uid() = id OR public.is_admin());

-- Note: The INSERT policy "Users can insert their own profile." remains unchanged,
-- as new profiles are primarily created via the signup process and associated trigger.
