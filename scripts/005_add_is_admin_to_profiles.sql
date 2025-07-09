-- Add an is_admin column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Optional: Create an index on is_admin if you plan to query by it frequently
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin);
