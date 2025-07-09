-- Ensure Row Level Security is enabled for customers.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all customers.
CREATE POLICY "Authenticated users can view customers."
  ON public.customers FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert customers.
CREATE POLICY "Authenticated users can insert customers."
  ON public.customers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update customers.
CREATE POLICY "Authenticated users can update customers."
  ON public.customers FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete customers.
CREATE POLICY "Authenticated users can delete customers."
  ON public.customers FOR DELETE
  USING (auth.role() = 'authenticated');
