CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT UNIQUE NOT NULL,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public organizations are viewable by everyone."
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert organizations."
  ON public.organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update organizations."
  ON public.organizations FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete organizations."
  ON public.organizations FOR DELETE
  USING (true);
