create policy "Allow authenticated users to insert dynamic data entries for their organizations"
on dynamic_data_entries for insert
to authenticated
with check (
  auth.uid() in (
    select profile_id from organization_profiles
    where organization_id = dynamic_data_entries.organization_id
  )
);
