-- Add needs_password_setup column to profiles table
ALTER TABLE profiles 
ADD COLUMN needs_password_setup BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.needs_password_setup IS 'Indicates if this profile was created by an admin and the user needs to set up their password';

-- Create index for performance
CREATE INDEX idx_profiles_needs_password_setup ON profiles(needs_password_setup) WHERE needs_password_setup = TRUE;

-- Update RLS policy to allow users to read their own needs_password_setup status
-- (This is likely already covered by existing RLS policies, but adding for clarity)
