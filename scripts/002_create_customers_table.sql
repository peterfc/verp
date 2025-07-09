CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT UNIQUE NOT NULL,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public customers are viewable by everyone."
  ON public.customers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert customers."
  ON public.customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers."
  ON public.customers FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete customers."
  ON public.customers FOR DELETE
  USING (true);
