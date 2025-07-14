-- IMPORTANT: Replace 'YOUR_ENTRY_ID_HERE' with an actual ID from one of your 'Person' data type entries.
-- You can find this ID by looking at the 'id' column in the table displayed on the /en/data-types/YOUR_ORG_ID/YOUR_DATATYPE_ID/person page.

UPDATE public.dynamic_data_entries
SET
    data = jsonb_set(data, '{Document1}', '"test_document_id_from_sql"', true),
    updated_at = now()
WHERE
    id = 'YOUR_ENTRY_ID_HERE';

-- Verify the update
SELECT id, data FROM public.dynamic_data_entries WHERE id = 'YOUR_ENTRY_ID_HERE';
