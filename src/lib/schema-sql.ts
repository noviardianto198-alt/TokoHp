export const SUPABASE_SETUP_SQL = `-- 1. Buat tabel public.phone_products di Supabase SQL Editor
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

-- 2. Berikan izin baca kepada role anon & authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.phone_products TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- 3. Aktifkan Row Level Security (RLS) dan Kebijakan Baca Publik
ALTER TABLE public.phone_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active products" ON public.phone_products;
CREATE POLICY "Public read active products"
ON public.phone_products
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 4. Contoh data awal resmi (Smartphone populer berbagai brand & aksesori)
INSERT INTO public.phone_products (sku, name, brand, category, price, stock, ram_gb, storage_gb, color, warranty_months, condition, description, is_active)
VALUES
  ('SAM-S24U-256', 'Samsung Galaxy S24 Ultra', 'Samsung', 'Smartphone', 21999000, 7, 12, 256, 'Titanium Gray', 12, 'Baru', 'Flagship bertenaga Snapdragon 8 Gen 3 for Galaxy, kamera 200MP, dan Galaxy AI terintegrasi.', true),
  ('SAM-A56-128', 'Samsung Galaxy A56 5G', 'Samsung', 'Smartphone', 5499000, 15, 8, 128, 'Awesome Navy', 12, 'Baru', 'Performa kencang dengan layar Super AMOLED 120Hz dan ketahanan air IP67.', true),
  ('SAM-A16-128', 'Samsung Galaxy A16 LTE', 'Samsung', 'Smartphone', 1999000, 24, 6, 128, 'Light Green', 12, 'Baru', 'Pilihan hemat dengan layar 90Hz jernih, baterai 5000mAh, dan update OS hingga 6 tahun.', true),
  ('APP-IP16P-256', 'Apple iPhone 16 Pro', 'Apple', 'Smartphone', 20999000, 5, 8, 256, 'Natural Titanium', 12, 'Baru', 'Ditenagai chip A18 Pro, Camera Control button, dan bodi titanium kelas kedirgantaraan.', true),
  ('APP-IP15-128', 'Apple iPhone 15', 'Apple', 'Smartphone', 13999000, 10, 6, 128, 'Black', 12, 'Baru', 'Dynamic Island, kamera utama 48MP yang tajam, dan port USB-C modern.', true),
  ('APP-IP13-128', 'Apple iPhone 13', 'Apple', 'Smartphone', 8999000, 8, 4, 128, 'Midnight Blue', 12, 'Baru', 'Performa stabil chip A15 Bionic, baterai awet, dan sistem kamera ganda berkelas.', true),
  ('XIA-14-512', 'Xiaomi 14', 'Xiaomi', 'Smartphone', 11999000, 6, 12, 512, 'Black', 12, 'Baru', 'Optik Leica Summilux profesional dengan chipset Snapdragon 8 Gen 3 super bertenaga.', true),
  ('RED-14C-128', 'Redmi 14C', 'Redmi', 'Smartphone', 1499000, 30, 6, 128, 'Starry Blue', 12, 'Baru', 'Smartphone terjangkau dengan layar mulus 120Hz 6.88 inci dan desain kaca elegan.', true),
  ('RED-NOTE13P-256', 'Redmi Note 13 Pro 5G', 'Redmi', 'Smartphone', 4399000, 18, 8, 256, 'Ocean Teal', 12, 'Baru', 'Kamera 200MP OIS ultra jernih, layar 1.5K AMOLED 120Hz, dan turbo charging 67W.', true),
  ('POC-F6-256', 'POCO F6 5G', 'POCO', 'Smartphone', 5699000, 12, 8, 256, 'Titanium', 12, 'Baru', 'Monster gaming dengan prosesor Snapdragon 8s Gen 3 dan pendingin LiquidCool 4.0.', true),
  ('POC-X6P-512', 'POCO X6 Pro 5G', 'POCO', 'Smartphone', 4899000, 14, 12, 512, 'Yellow Vegan Leather', 12, 'Baru', 'Performa kencang Dimensity 8300-Ultra, penyimpanan luas 512GB, dan layar CrystalRes Flow AMOLED.', true),
  ('POC-M6P-256', 'POCO M6 Pro', 'POCO', 'Smartphone', 2799000, 20, 8, 256, 'Black', 12, 'Baru', 'Layar 120Hz Flow AMOLED bezel tipis dengan kamera 64MP OIS di harga terjangkau.', true),
  ('OPP-RENO12-256', 'OPPO Reno12 5G', 'OPPO', 'Smartphone', 6999000, 9, 12, 256, 'Astro Silver', 12, 'Baru', 'Desain futuristik tahan benturan dengan fitur GenAI canggih untuk foto portrait.', true),
  ('OPP-A60-128', 'OPPO A60', 'OPPO', 'Smartphone', 2599000, 22, 8, 128, 'Ripple Blue', 12, 'Baru', 'Tahan standar militer MIL-STD 810H, layar 950 nits ultra cerah, dan 45W SUPERVOOC.', true),
  ('VIV-V40-256', 'vivo V40 5G', 'vivo', 'Smartphone', 6499000, 8, 12, 256, 'Chrome Purple', 12, 'Baru', 'ZEISS All Main Camera dengan baterai jumbo 5500mAh BlueVolt tertipis di kelasnya.', true),
  ('VIV-Y28-128', 'vivo Y28', 'vivo', 'Smartphone', 2399000, 19, 6, 128, 'Agate Green', 12, 'Baru', 'Star Halo notifikasi unik, baterai 6000mAh tahan lama, dan audio booster 300%.', true),
  ('INF-GT20P-256', 'Infinix GT 20 Pro 5G', 'Infinix', 'Smartphone', 4299000, 11, 12, 256, 'Mecha Silver', 12, 'Baru', 'HP gaming turnamen resmi dengan chip display game dedicated dan Cyber Mecha Design berlampu RGB.', true),
  ('INF-HOT50-128', 'Infinix HOT 50 Pro+', 'Infinix', 'Smartphone', 2499000, 16, 8, 128, 'Sleek Black', 12, 'Baru', 'Desain 3D Curved tertipis 6.8mm dengan Helio G100 dan sertifikasi kelancaran 5 tahun.', true),
  ('TEC-CAMON30-256', 'TECNO Camon 30 Premier 5G', 'TECNO', 'Smartphone', 5999000, 5, 12, 512, 'Alps Snowy Silver', 12, 'Baru', 'Quad 50MP kamera dengan imaging chip PolarAce dan lensa periskop telefoto.', true),
  ('TEC-SPARK20-128', 'TECNO Spark 20 Pro', 'TECNO', 'Smartphone', 1949000, 25, 8, 256, 'Frosty Ivory', 12, 'Baru', 'RAM 8GB (+8GB ekspansi), memori 256GB, dan kamera 108MP di bawah 2 juta.', true),
  ('UNI-CHG-65W', 'Universal GaN Charger 65W Dual USB-C', 'Universal', 'Aksesori', 249000, 40, null, null, 'White', 12, 'Baru', 'Fast charger kompak teknologi GaN dengan dual port Type-C dan satu USB-A.', true),
  ('UNI-CBL-100W', 'Universal Kabel Data Type-C to Type-C 100W Braided', 'Universal', 'Aksesori', 79000, 75, null, null, 'Black Braided', 6, 'Baru', 'Kabel rajut nilon kuat mendukung Power Delivery hingga 100W dan transfer data cepat.', true),
  ('UNI-PB-20K', 'Universal Powerbank 20.000mAh 22.5W Fast Charging', 'Universal', 'Aksesori', 299000, 32, null, null, 'Navy Blue', 12, 'Baru', 'Powerbank berkapasitas besar dengan display digital LED dan multi proteksi keamanan.', true)
ON CONFLICT (sku) DO NOTHING;
`;
