-- Supabase Setup Instructions for L.UZ Digital Menu Board

-- 1. Run the following SQL in your Supabase SQL Editor to create tables and setup realtime:

CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'product-images');

CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_uz text NOT NULL,
  price numeric NOT NULL,
  image_url text,
  tv_number integer NOT NULL,
  category_title text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tv_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tv_number integer NOT NULL UNIQUE,
  title text,
  subtitle text,
  is_active boolean DEFAULT true
);

-- Insert default TV settings
INSERT INTO public.tv_settings (tv_number, title, subtitle) VALUES
(1, 'Ichimliklar', 'L.UZ Digital Menu'),
(2, 'Combolar', 'L.UZ Digital Menu'),
(3, 'Fast Foodlar', 'L.UZ Digital Menu')
ON CONFLICT (tv_number) DO NOTHING;

-- Enable Row Level Security (RLS) but allow all operations for simplicity in this version
-- Since the user asked for simple admin authentication, we will allow anon key access for now.
-- In a production environment with Supabase Auth, you would restrict these!
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tv_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read products" ON public.products;
CREATE POLICY "Allow anonymous read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert products" ON public.products;
CREATE POLICY "Allow anonymous insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update products" ON public.products;
CREATE POLICY "Allow anonymous update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous delete products" ON public.products;
CREATE POLICY "Allow anonymous delete products" ON public.products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read tv_settings" ON public.tv_settings;
CREATE POLICY "Allow anonymous read tv_settings" ON public.tv_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous update tv_settings" ON public.tv_settings;
CREATE POLICY "Allow anonymous update tv_settings" ON public.tv_settings FOR UPDATE USING (true);

-- Enable Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tv_settings;

-- 2. Storage Setup:
-- Go to Supabase Dashboard -> Storage -> Create a new bucket.
-- Name the bucket: "product-images"
-- Make it a "Public" bucket.
-- Go to Policies for "product-images" and create a policy to allow all actions (SELECT, INSERT, UPDATE, DELETE) for anon users (since simple auth is requested).
