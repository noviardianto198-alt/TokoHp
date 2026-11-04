export const SUPABASE_SETUP_SQL = `-- =========================================================================
-- SKRIP MIGRASI LENGKAP SUPABASE TOKO HP NOVI
-- Salin dan jalankan seluruh query ini di menu SQL Editor pada Supabase Dashboard Anda.
-- =========================================================================

-- 1. TABEL PRODUK HP & AKSESORI (public.phone_products)
CREATE TABLE IF NOT EXISTS public.phone_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Smartphone',
  price NUMERIC NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  ram_gb INTEGER,
  storage_gb INTEGER,
  color TEXT,
  warranty_months INTEGER DEFAULT 12,
  condition TEXT NOT NULL DEFAULT 'Baru',
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABEL KATEGORI PRODUK (public.product_categories)
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Masukkan kategori standar
INSERT INTO public.product_categories (name, description)
VALUES
  ('Smartphone', 'Perangkat telepon pintar berbagai merek resmi garansi nasional.'),
  ('Tablet', 'Tablet multifungsi untuk produktivitas, belajar, dan hiburan.'),
  ('Smartwatch', 'Jam tangan pintar dan pelacak kebugaran.'),
  ('Aksesori', 'Aksesori pendukung smartphone original dan kompatibel.'),
  ('Charger', 'Kepala charger fast charging, adapter GaN, dan wireless charger.'),
  ('Earphone', 'TWS bluetooth, earphone kabel, dan headphone audio.'),
  ('Power Bank', 'Baterai portabel kapasitas tinggi dengan multi pengisian cepat.'),
  ('Kabel Data', 'Kabel data Type-C, Lightning, dan USB-A tahan tekuk.')
ON CONFLICT (name) DO NOTHING;

-- 3. TABEL MEREK PRODUK (public.product_brands)
CREATE TABLE IF NOT EXISTS public.product_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.product_brands (name, description)
VALUES
  ('Samsung', 'Smartphone dan ekosistem Galaxy dengan garansi resmi SEIN.'),
  ('Apple', 'iPhone resmi dengan garansi iBox/GDN/Digimap.'),
  ('Xiaomi', 'Smartphone Xiaomi dan lini flagship Leica.'),
  ('Redmi', 'Smartphone value-for-money dengan performa tinggi.'),
  ('POCO', 'HP spesifikasi ekstrem untuk gaming dan performa tinggi.'),
  ('OPPO', 'Inovasi fotografi portrait dan pengisian kilat SUPERVOOC.'),
  ('vivo', 'Kamera ZEISS dan desain tipis premium.'),
  ('Infinix', 'Gaming smartphone berfitur tinggi di harga terjangkau.'),
  ('TECNO', 'Kamera canggih dan desain futuristik modern.'),
  ('Realme', 'Smartphone stylish dengan teknologi pengisian cepat.'),
  ('Universal', 'Aksesori original dan berstandar internasional.')
ON CONFLICT (name) DO NOTHING;

-- 4. TABEL AUDIT TRAIL MUTASI STOK (public.stock_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.phone_products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  product_name TEXT NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('masuk', 'keluar', 'koreksi')),
  quantity_change INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  notes TEXT,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABEL PROFIL PENGGUNA & ROLE (public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pelanggan' CHECK (role IN ('admin', 'pelanggan')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. TABEL PESANAN (public.orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'menunggu_konfirmasi' CHECK (status IN ('menunggu_konfirmasi', 'diproses', 'dikirim', 'selesai', 'dibatalkan')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. PEMBERIAN IZIN AKSES DAN ROW LEVEL SECURITY (RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.phone_products TO anon, authenticated;
GRANT ALL ON TABLE public.product_categories TO anon, authenticated;
GRANT ALL ON TABLE public.product_brands TO anon, authenticated;
GRANT ALL ON TABLE public.stock_movements TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- Aktifkan RLS
ALTER TABLE public.phone_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy untuk phone_products
DROP POLICY IF EXISTS "Public select phone_products" ON public.phone_products;
CREATE POLICY "Public select phone_products" ON public.phone_products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for authenticated on phone_products" ON public.phone_products;
CREATE POLICY "Allow all for authenticated on phone_products" ON public.phone_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk product_categories
DROP POLICY IF EXISTS "Public select product_categories" ON public.product_categories;
CREATE POLICY "Public select product_categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all on product_categories" ON public.product_categories;
CREATE POLICY "Allow all on product_categories" ON public.product_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk product_brands
DROP POLICY IF EXISTS "Public select product_brands" ON public.product_brands;
CREATE POLICY "Public select product_brands" ON public.product_brands FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all on product_brands" ON public.product_brands;
CREATE POLICY "Allow all on product_brands" ON public.product_brands FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk stock_movements
DROP POLICY IF EXISTS "Allow all on stock_movements" ON public.stock_movements;
CREATE POLICY "Allow all on stock_movements" ON public.stock_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk orders
DROP POLICY IF EXISTS "Allow all on orders" ON public.orders;
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Policy untuk profiles
DROP POLICY IF EXISTS "Allow select profiles" ON public.profiles;
CREATE POLICY "Allow select profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Allow insert own profile" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
`;
