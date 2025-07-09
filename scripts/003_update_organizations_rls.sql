-- Ensure Row Level Security is enabled for organizations.
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all organizations.
CREATE POLICY "Authenticated users can view organizations."
  ON public.organizations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert organizations.
CREATE POLICY "Authenticated users can insert organizations."
  ON public.organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update organizations.
CREATE POLICY "Authenticated users can update organizations."
  ON public.organizations FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete organizations.
CREATE POLICY "Authenticated users can delete organizations."
  ON public.organizations FOR DELETE
  USING (auth.role() = 'authenticated');
