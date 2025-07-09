-- Add a 'type' column to the public.profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'User'
CHECK (type IN ('Administrator', 'Manager', 'User'));

-- Update existing profiles to 'User' if they don't have a type (e.g., from previous migrations)
UPDATE public.profiles
SET type = 'User'
WHERE type IS NULL;

-- Ensure the column is not nullable after setting default for existing rows
ALTER TABLE public.profiles
ALTER COLUMN type SET NOT NULL;
