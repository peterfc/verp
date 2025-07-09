-- Set the user with email 'peterfc@gmail.com' as an admin.
-- IMPORTANT: This assumes the user 'peterfc@gmail.com' already exists in your auth.users table
-- and consequently in your public.profiles table.
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'peterfc@gmail.com';
