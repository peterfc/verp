-- Start a new transaction for isolated testing
BEGIN;

-- Set the role to 'authenticated' to simulate a logged-in user.
SET ROLE authenticated;

-- Set the JWT claim for the user's ID (sub = subject).
-- IMPORTANT: Replace 'YOUR_MANAGER_USER_UUID' with the actual UUID of your manager user.
SET LOCAL "request.jwt.claim.sub" TO 'YOUR_MANAGER_USER_UUID';

-- Test what public.is_admin() returns for this user
SELECT public.is_admin() AS is_admin_result;

-- Test what public.is_manager() returns for this user
SELECT public.is_manager() AS is_manager_result;

-- Attempt a DELETE operation on an organization (this should still fail if is_admin_result is FALSE)
-- You might need to replace 'SOME_ORGANIZATION_ID' with an actual organization ID from your 'organizations' table
-- to see if the DELETE is attempted and blocked by RLS.
-- If you don't have an organization ID handy, you can try to select one:
-- DELETE FROM public.organizations WHERE id = (SELECT id FROM public.organizations LIMIT 1);
-- Or, if you know an ID:
-- DELETE FROM public.organizations WHERE id = 'SOME_ORGANIZATION_ID';
-- For testing purposes, let's try to delete the first organization found:
DELETE FROM public.organizations WHERE id = (SELECT id FROM public.organizations LIMIT 1);


-- Rollback the transaction to undo any changes and reset the session context
ROLLBACK;

-- Reset the role and JWT claim after testing
RESET ALL;
