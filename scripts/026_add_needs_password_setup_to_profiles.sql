-- Add needs_password_setup field to profiles table
-- This field tracks whether a profile was created by an admin and needs password setup

ALTER TABLE profiles 
ADD COLUMN needs_password_setup BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN profiles.needs_password_setup IS 'Indicates if this profile was created by an admin and the user needs to set up their password';

-- Update RLS policies to allow admins to update this field
-- (The existing policies should already cover this, but let's be explicit)

-- Create an index for efficient querying
CREATE INDEX idx_profiles_needs_password_setup ON profiles(needs_password_setup) WHERE needs_password_setup = TRUE;
