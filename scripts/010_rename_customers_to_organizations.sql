-- Rename the 'customers' table to 'organizations'
ALTER TABLE public.customers RENAME TO organizations;

-- Rename the 'customer_profiles' table to 'organization_profiles'
ALTER TABLE public.customer_profiles RENAME TO organization_profiles;

-- Rename the 'customer_id' column in 'organization_profiles' to 'organization_id'
ALTER TABLE public.organization_profiles RENAME COLUMN customer_id TO organization_id;

-- Drop and recreate the primary key on 'organization_profiles' to reflect the column rename
ALTER TABLE public.organization_profiles DROP CONSTRAINT IF EXISTS customer_profiles_pkey;
ALTER TABLE public.organization_profiles ADD PRIMARY KEY (organization_id, profile_id);

-- Drop and recreate the foreign key constraint from 'organization_profiles' to 'organizations'
ALTER TABLE public.organization_profiles DROP CONSTRAINT IF EXISTS customer_profiles_customer_id_fkey;
ALTER TABLE public.organization_profiles
ADD CONSTRAINT organization_profiles_organization_id_fkey
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update RLS policies for the new 'organizations' table
DROP POLICY IF EXISTS "Authenticated users can view customers." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can insert customers." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can update customers." ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can delete customers." ON public.organizations;

CREATE POLICY "Authenticated users can view organizations."
  ON public.organizations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert organizations."
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update organizations."
  ON public.organizations FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete organizations."
  ON public.organizations FOR DELETE
  USING (auth.role() = 'authenticated');

-- Update RLS policies for the new 'organization_profiles' table
DROP POLICY IF EXISTS "Authenticated users can view customer profiles." ON public.organization_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert customer profiles." ON public.organization_profiles;
DROP POLICY IF EXISTS "Authenticated users can delete customer profiles." ON public.organization_profiles;

CREATE POLICY "Authenticated users can view organization profiles."
  ON public.organization_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert organization profiles."
  ON public.organization_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete organization profiles."
  ON public.organization_profiles FOR DELETE
  USING (auth.role() = 'authenticated');
