-- Create the junction table for Customer-Profile many-to-many relationship
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (customer_id, profile_id) -- Composite primary key to ensure unique associations
);

-- Enable Row Level Security for customer_profiles
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view customer-profile associations
CREATE POLICY "Authenticated users can view customer profiles."
  ON public.customer_profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert customer-profile associations
CREATE POLICY "Authenticated users can insert customer profiles."
  ON public.customer_profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete customer-profile associations
CREATE POLICY "Authenticated users can delete customer profiles."
  ON public.customer_profiles FOR DELETE
  USING (auth.role() = 'authenticated');
