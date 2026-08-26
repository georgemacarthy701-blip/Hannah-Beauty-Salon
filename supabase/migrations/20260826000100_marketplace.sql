-- 1. Create Products / Marketplace Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'NLE' NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
CREATE POLICY "Public products are viewable by everyone"
  ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated sellers can insert products" ON public.products;
CREATE POLICY "Authenticated sellers can insert products"
  ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
CREATE POLICY "Sellers can update their own products"
  ON public.products FOR UPDATE USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Sellers or admins can delete products" ON public.products;
CREATE POLICY "Sellers or admins can delete products"
  ON public.products FOR DELETE USING (
    auth.uid() = seller_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- 4. Indexes for Fast Loading
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 5. Grant Permissions to roles
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
