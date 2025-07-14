-- Check the current structure of the dynamic_data_entries table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dynamic_data_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any constraints on the data column
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'dynamic_data_entries'
AND tc.table_schema = 'public';

-- Check RLS policies on the table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dynamic_data_entries';

-- Check the column type of the 'data' column in 'dynamic_data_entries' table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'dynamic_data_entries' AND column_name = 'data';

-- Also check RLS policies for the 'dynamic_data_entries' table
SELECT
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public' AND tablename = 'dynamic_data_entries';

-- Test a direct update to see if it works
-- (This will help us understand if the issue is with our API or the database)
SELECT id, data FROM dynamic_data_entries WHERE id = '20f6e98c-ccd7-4ac5-978f-0221fb4afcc7';
