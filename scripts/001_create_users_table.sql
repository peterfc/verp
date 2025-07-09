CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users are viewable by everyone."
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert users."
  ON public.users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users."
  ON public.users FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete users."
  ON public.users FOR DELETE
  USING (true);
