-- Create the junction table for Organization-Profile many-to-many relationship
CREATE TABLE IF NOT EXISTS public.organization_profiles (
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (organization_id, profile_id) -- Composite primary key to ensure unique associations
);

-- Enable Row Level Security for organization_profiles
ALTER TABLE public.organization_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view organization-profile associations
CREATE POLICY "Authenticated users can view organization profiles."
  ON public.organization_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert organization-profile associations
CREATE POLICY "Authenticated users can insert organization profiles."
  ON public.organization_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete organization-profile associations
ON public.organization_profiles FOR DELETE
  USING (auth.role() = 'authenticated');
