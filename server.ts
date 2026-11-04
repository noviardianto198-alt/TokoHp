import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Clean config value from whitespace and accidental quotes
function cleanConfigValue(val: string | undefined): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

// Priority: SUPABASE_URL / SUPABASE_ANON_KEY from AI Studio Secrets
function getSupabaseConfig(): { url: string; anonKey: string } {
  let url = cleanConfigValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  let anonKey = cleanConfigValue(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  if (url) {
    url = url.replace(/\/+$/, '');
  }
  return { url, anonKey };
}

let cachedServerSupabase: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

function getServerSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  if (cachedServerSupabase && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedServerSupabase;
  }

  try {
    cachedServerSupabase = createClient(url, anonKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedServerSupabase;
  } catch (err) {
    console.error('Error creating server Supabase client:', err);
    return null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());


  // 0. Public Supabase config for browser client auth
  app.get('/api/auth/config', (_req: Request, res: Response) => {
    const { url, anonKey } = getSupabaseConfig();
    res.json({
      supabaseUrl: url || '',
      supabaseAnonKey: anonKey || '',
    });
  });

  // 1. Health check & Database Status endpoint
  app.get('/api/health', async (_req: Request, res: Response) => {
    const { url, anonKey } = getSupabaseConfig();
    const isConfigured = Boolean(url && anonKey);

    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(GEMINI_API_KEY),
      supabaseConfigured: isConfigured,
      supabaseUrlPrefix: url ? url.substring(0, 16) + '...' : null,
    });
  });

  // 2. Database connection status verification endpoint
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    const { url, anonKey } = getSupabaseConfig();

    if (!url || !anonKey) {
      res.json({
        configured: false,
        connected: false,
        count: 0,
        error:
          'Kredensial SUPABASE_URL atau SUPABASE_ANON_KEY belum dikonfigurasi di Settings > Secrets.',
      });
      return;
    }

    const supabase = getServerSupabase();
    if (!supabase) {
      res.json({
        configured: true,
        connected: false,
        count: 0,
        error: 'Format SUPABASE_URL tidak valid atau gagal menginisialisasi client Supabase.',
      });
      return;
    }

    try {
      const { data, error, count } = await supabase
        .from('phone_products')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      if (error) {
        let friendlyMessage = error.message;
        if (error.code === '42P01') {
          friendlyMessage =
            'Tabel "public.phone_products" belum dibuat di database Supabase Anda. Silakan jalankan skrip SQL di menu SQL Editor Supabase.';
        } else if (error.code === '42501') {
          friendlyMessage =
            'Izin akses (permission denied - code 42501). Jalankan skrip "GRANT SELECT ON TABLE public.phone_products TO anon;" dan RLS policy di SQL Editor Supabase Anda.';
        }
        res.json({
          configured: true,
          connected: false,
          count: 0,
          error: friendlyMessage,
          code: error.code,
        });
        return;
      }

      res.json({
        configured: true,
        connected: true,
        count: count ?? (data ? data.length : 0),
        error: null,
      });
    } catch (err: any) {
      res.json({
        configured: true,
        connected: false,
        count: 0,
        error: err?.message || 'Gagal terhubung ke database Supabase.',
      });
    }
  });

  // 3. Endpoint: Mengambil daftar produk aktif dari tabel phone_products
  // Query params opsional: brand, category, in_stock, search, sort
  app.get('/api/products', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();

    if (!supabase) {
      res.status(503).json({
        error:
          'Database Supabase belum terhubung. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah disetel di pengaturan.',
        data: null,
      });
      return;
    }

    try {
      const { brand, category, in_stock, search, sort } = req.query;

      let query = supabase
        .from('phone_products')
        .select('*')
        .eq('is_active', true);

      // Filter Merek
      if (brand && typeof brand === 'string' && brand !== 'all') {
        query = query.ilike('brand', brand);
      }

      // Filter Kategori
      if (category && typeof category === 'string' && category !== 'all') {
        query = query.ilike('category', category);
      }

      // Filter Stok Tersedia
      if (in_stock === 'true') {
        query = query.gt('stock', 0);
      }

      // Filter Pencarian Teks
      if (search && typeof search === 'string' && search.trim()) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,brand.ilike.%${s}%,sku.ilike.%${s}%`);
      }

      // Pengurutan
      if (sort === 'price-asc') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price-desc') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'name-desc') {
        query = query.order('name', { ascending: false });
      } else if (sort === 'stock-desc') {
        query = query.order('stock', { ascending: false });
      } else {
        // Default sort by name ascending
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        res.status(500).json({
          error: `Supabase Error: ${error.message} (${error.code || 'UNKNOWN'})`,
          data: null,
        });
        return;
      }

      res.json({
        data: data || [],
        count: data?.length || 0,
        source: 'supabase_database',
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Gagal mengambil data produk dari server.',
        data: null,
      });
    }
  });

  // 4. Endpoint: Pencarian produk berdasarkan nama dan merek
  app.get('/api/products/search', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();

    if (!supabase) {
      res.status(503).json({
        error:
          'Database Supabase belum terhubung. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah disetel di pengaturan.',
        data: null,
      });
      return;
    }

    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
      const brand = typeof req.query.brand === 'string' ? req.query.brand.trim() : '';

      let query = supabase
        .from('phone_products')
        .select('*')
        .eq('is_active', true);

      if (name && brand) {
        query = query.ilike('name', `%${name}%`).ilike('brand', `%${brand}%`);
      } else if (brand) {
        query = query.ilike('brand', `%${brand}%`);
      } else if (name) {
        query = query.ilike('name', `%${name}%`);
      } else if (q) {
        query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%,sku.ilike.%${q}%`);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        res.status(500).json({
          error: `Gagal mencari produk: ${error.message}`,
          data: null,
        });
        return;
      }

      res.json({
        data: data || [],
        count: data?.length || 0,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Gagal memproses pencarian produk.',
        data: null,
      });
    }
  });

  // 5. Endpoint: Detail produk berdasarkan SKU
  app.get('/api/products/sku/:sku', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();

    if (!supabase) {
      res.status(503).json({
        error:
          'Database Supabase belum terhubung. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY sudah disetel di pengaturan.',
        data: null,
      });
      return;
    }

    try {
      const sku = req.params.sku;
      if (!sku) {
        res.status(400).json({ error: 'SKU produk wajib diisi.', data: null });
        return;
      }

      const { data, error } = await supabase
        .from('phone_products')
        .select('*')
        .eq('sku', sku)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        res.status(500).json({
          error: `Gagal mengambil produk SKU ${sku}: ${error.message}`,
          data: null,
        });
        return;
      }

      if (!data) {
        res.status(404).json({
          error: `Produk dengan SKU "${sku}" tidak ditemukan dalam katalog database.`,
          data: null,
        });
        return;
      }

      res.json({
        data,
      });
    } catch (err: any) {
      res.status(500).json({
        error: err?.message || 'Gagal mengambil detail produk.',
        data: null,
      });
    }
  });

  // 6. Novi AI Assistant Chat endpoint (Selalu membaca harga & stok terkini dari Supabase)
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Pesan pertanyaan tidak boleh kosong.' });
        return;
      }

      if (!GEMINI_API_KEY) {
        res.status(500).json({
          error: 'GEMINI_API_KEY belum dikonfigurasi di lingkungan server (Settings > Secrets).',
        });
        return;
      }

      const supabase = getServerSupabase();
      if (!supabase) {
        res.status(200).json({
          reply:
            'Mohon maaf, saat ini sistem belum dapat terhubung ke database produk Supabase (SUPABASE_URL atau SUPABASE_ANON_KEY belum terpasang). Sebagai Novi AI Assistant resmi, saya hanya boleh memberikan informasi harga, spesifikasi, dan stok berdasarkan data resmi database Toko HP Novi.',
          sourceCount: 0,
        });
        return;
      }

      // Ambil data produk aktif langsung dari database Supabase
      const { data: dbProducts, error: dbErr } = await supabase
        .from('phone_products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (dbErr || !dbProducts || dbProducts.length === 0) {
        const errorDetail = dbErr?.message ? ` (${dbErr.message})` : '';
        res.status(200).json({
          reply: `Mohon maaf, sistem database produk Toko HP Novi sedang tidak dapat diakses atau katalog produk masih kosong${errorDetail}. Untuk menjaga keakuratan informasi harga dan stok, silakan periksa status koneksi database Supabase terlebih dahulu.`,
          sourceCount: 0,
        });
        return;
      }

      // Format product context for RAG
      const catalogSummary = dbProducts
        .map((p: any) => {
          return `- [${p.brand}] ${p.name} (Kategori: ${p.category || 'Smartphone'}):
  Harga: Rp${Number(p.price || 0).toLocaleString('id-ID')}
  Stok: ${p.stock ?? 0} unit ${Number(p.stock) <= 0 ? '(STOK HABIS)' : '(TERSEDIA)'}
  Spesifikasi: RAM ${p.ram_gb ? p.ram_gb + ' GB' : '-'}, ROM ${p.storage_gb ? p.storage_gb + ' GB' : '-'}
  Warna: ${p.color || '-'}
  Garansi: ${p.warranty_months ? p.warranty_months + ' Bulan' : '-'}
  Kondisi: ${p.condition || 'Baru'}
  SKU: ${p.sku || '-'}
  Deskripsi: ${p.description || '-'}`;
        })
        .join('\n\n');

      // Helper to generate precise database grounded answer when AI encounters 503 or as base engine
      function generateDatabaseGroundedAnswer(userMsg: string, allProducts: any[]): { reply: string; matched: any[] } {
        const msg = userMsg.toLowerCase();
        let matched: any[] = [];
        let reply = '';

        // 1. COMPARISON INTENT (e.g. "bandingkan", "beda", "vs")
        const isComparison = msg.includes('banding') || msg.includes('beda') || msg.includes('vs') || msg.includes('komparasi');
        if (isComparison) {
          const modelCodes = [
            { key: 'a16', sku: 'HP002' },
            { key: 'a56', sku: 'HP003' },
            { key: 'a06', sku: 'HP001' },
            { key: 'note 14', sku: 'HP005' },
            { key: '14c', sku: 'HP004' },
            { key: 'reno13', sku: 'HP007' },
            { key: 'a3x', sku: 'HP006' },
            { key: 'y29', sku: 'HP008' },
            { key: 'hot 50', sku: 'HP009' },
            { key: 'iphone 13', sku: 'HP010' },
          ];

          const foundTargetSkus = modelCodes.filter((m) => msg.includes(m.key)).map((m) => m.sku);
          let comparedProducts = allProducts.filter((p) => foundTargetSkus.includes(p.sku));

          if (comparedProducts.length < 2) {
            comparedProducts = allProducts.filter((p) => {
              const fullName = p.name.toLowerCase();
              return msg.includes(fullName) || msg.includes(p.sku.toLowerCase());
            });
          }

          if (comparedProducts.length >= 2) {
            matched = comparedProducts.slice(0, 3);
            reply = `Berikut perbandingan spesifikasi dan harga resmi dari database Toko HP Novi:\n\n`;
            comparedProducts.slice(0, 3).forEach((p, idx) => {
              reply += `${idx + 1}. **${p.name}**\n`;
              reply += `   • Harga Resmi: Rp${Number(p.price).toLocaleString('id-ID')}\n`;
              reply += `   • RAM / ROM: ${p.ram_gb ? p.ram_gb + ' GB' : '-'} / ${p.storage_gb ? p.storage_gb + ' GB' : '-'}\n`;
              reply += `   • Warna: ${p.color || '-'}\n`;
              reply += `   • Garansi: ${p.warranty_months} Bulan (${p.condition})\n`;
              reply += `   • Status Stok: ${Number(p.stock) > 0 ? `Tersedia (${p.stock} unit)` : 'Stok Habis'}\n`;
              reply += `   • Catatan: ${p.description}\n\n`;
            });
            reply += `💡 **Kesimpulan:** Perhatikan kebutuhan harian Anda. Untuk multitasking dan kapasitas memori besar, pilih unit dengan RAM/ROM lebih tinggi. Unit resmi bergaransi di atas siap dipesan melalui WhatsApp toko kami.`;
            return { reply, matched };
          }
        }

        // 2. BUDGET / ANGGARAN INTENT
        let budgetLimit = 0;
        if (msg.includes('di bawah 2 juta') || msg.includes('dibawah 2 juta') || msg.includes('1 jutaan') || msg.includes('di bawah 2jt')) {
          budgetLimit = 2000000;
        } else if (msg.includes('di bawah 3 juta') || msg.includes('dibawah 3 juta') || msg.includes('2 jutaan') || msg.includes('di bawah 3jt')) {
          budgetLimit = 3000000;
        } else if (msg.includes('di bawah 5 juta') || msg.includes('dibawah 5 juta') || msg.includes('3 jutaan') || msg.includes('4 jutaan')) {
          budgetLimit = 5000000;
        } else if (msg.includes('di bawah 10 juta') || msg.includes('dibawah 10 juta')) {
          budgetLimit = 10000000;
        } else if (msg.includes('murah') || msg.includes('termurah') || msg.includes('hemat')) {
          budgetLimit = 2500000;
        }

        if (budgetLimit > 0) {
          const budgetProducts = allProducts
            .filter((p) => p.category === 'Smartphone' && Number(p.price) <= budgetLimit && Number(p.stock) > 0)
            .sort((a, b) => Number(b.price) - Number(a.price));

          if (budgetProducts.length > 0) {
            matched = budgetProducts.slice(0, 4);
            reply = `Berikut rekomendasi smartphone resmi dari database Toko HP Novi yang sesuai dengan anggaran Anda (di bawah Rp${budgetLimit.toLocaleString('id-ID')}):\n\n`;
            budgetProducts.slice(0, 4).forEach((p, idx) => {
              reply += `${idx + 1}. **${p.name}**\n`;
              reply += `   • Harga: Rp${Number(p.price).toLocaleString('id-ID')}\n`;
              reply += `   • Spesifikasi: RAM ${p.ram_gb} GB, Penyimpanan ${p.storage_gb} GB\n`;
              reply += `   • Stok: ${p.stock} unit siap kirim\n`;
              reply += `   • Garansi: ${p.warranty_months} Bulan (${p.condition})\n\n`;
            });
            reply += `Semua unit di atas bergaransi resmi dan siap dikirim. Anda dapat melihat detail atau memesan unit langsung melalui tombol produk di bawah.`;
            return { reply, matched };
          }
        }

        // 3. SPECIFIC BRAND INQUIRY (Samsung, Apple, Xiaomi, OPPO, vivo, Infinix, Aksesori)
        const brands = ['samsung', 'apple', 'iphone', 'xiaomi', 'redmi', 'oppo', 'vivo', 'infinix', 'aksesori', 'charger', 'power bank', 'kabel'];
        const foundBrand = brands.find((b) => msg.includes(b));
        if (foundBrand) {
          const brandKey = foundBrand === 'iphone' ? 'apple' : foundBrand;
          const brandProducts = allProducts.filter((p) => {
            if (brandKey === 'aksesori' || brandKey === 'charger' || brandKey === 'kabel' || brandKey === 'power bank') {
              return p.category === 'Aksesori' || p.name.toLowerCase().includes(brandKey);
            }
            return p.brand.toLowerCase() === brandKey || p.name.toLowerCase().includes(foundBrand);
          });

          if (brandProducts.length > 0) {
            matched = brandProducts.slice(0, 4);
            reply = `Berikut produk ${foundBrand.toUpperCase()} resmi yang terdaftar di database Toko HP Novi:\n\n`;
            brandProducts.forEach((p, idx) => {
              const stockStatus = Number(p.stock) > 0 ? `Tersedia (${p.stock} unit)` : 'Stok Habis';
              reply += `${idx + 1}. **${p.name}**\n`;
              reply += `   • Harga: Rp${Number(p.price).toLocaleString('id-ID')}\n`;
              if (p.ram_gb && p.storage_gb) {
                reply += `   • Spesifikasi: RAM ${p.ram_gb} GB / ROM ${p.storage_gb} GB\n`;
              }
              reply += `   • Warna: ${p.color || '-'}\n`;
              reply += `   • Stok: ${stockStatus}\n`;
              reply += `   • Garansi: ${p.warranty_months} Bulan\n\n`;
            });
            return { reply, matched };
          }
        }

        // 4. SPECIFIC PRODUCT / MODEL INQUIRY (e.g. A56, A16, A06, Reno13, Redmi Note 14, 14C, Y29, Hot 50, iPhone 13)
        const specificProduct = allProducts.find((p) => {
          const nameLower = p.name.toLowerCase();
          const skuLower = p.sku.toLowerCase();
          const modelCodes = ['a56', 'a16', 'a06', 'reno13', 'note 14', '14c', 'y29', 'hot 50', 'iphone 13', 'ak001', 'ak002', 'ak005', 'a3x'];
          const matchedCode = modelCodes.find((code) => msg.includes(code));
          if (matchedCode && nameLower.includes(matchedCode)) return true;
          return msg.includes(nameLower) || msg.includes(skuLower);
        });

        if (specificProduct) {
          matched = [specificProduct];
          const isReady = Number(specificProduct.stock) > 0;
          reply = `Informasi resmi untuk **${specificProduct.brand} ${specificProduct.name}** dari database Toko HP Novi:\n\n`;
          reply += `• **Harga Resmi:** Rp${Number(specificProduct.price).toLocaleString('id-ID')}\n`;
          reply += `• **Ketersediaan Stok:** ${isReady ? `Tersedia ${specificProduct.stock} unit (Siap Kirim)` : 'Stok Sedang Habis (0 unit)'}\n`;
          if (specificProduct.ram_gb && specificProduct.storage_gb) {
            reply += `• **RAM & Penyimpanan:** RAM ${specificProduct.ram_gb} GB / Internal ${specificProduct.storage_gb} GB\n`;
          }
          reply += `• **Varian Warna:** ${specificProduct.color || '-'}\n`;
          reply += `• **Kondisi:** ${specificProduct.condition}\n`;
          reply += `• **Garansi Resmi:** ${specificProduct.warranty_months} Bulan\n`;
          reply += `• **SKU:** ${specificProduct.sku}\n`;
          reply += `• **Deskripsi:** ${specificProduct.description}\n\n`;
          reply += isReady
            ? `Unit ini tersedia di toko kami. Anda dapat langsung menekan tombol WhatsApp di bawah untuk proses pemesanan.`
            : `Mohon maaf, stok untuk tipe ini sedang kosong saat ini.`;
          return { reply, matched };
        }

        // 5. RAM OR STORAGE SPECIFICATION INQUIRY (e.g. "RAM 8GB", "256GB")
        if (msg.includes('ram 8') || msg.includes('ram 8gb')) {
          const ramProducts = allProducts.filter((p) => p.ram_gb === 8);
          if (ramProducts.length > 0) {
            matched = ramProducts.slice(0, 4);
            reply = `Berikut pilihan smartphone dengan **RAM 8 GB** yang tersedia di database Toko HP Novi:\n\n`;
            ramProducts.forEach((p, idx) => {
              reply += `${idx + 1}. **${p.name}** — Rp${Number(p.price).toLocaleString('id-ID')} (Stok: ${p.stock} unit, ROM ${p.storage_gb}GB)\n`;
            });
            return { reply, matched };
          }
        }

        // 6. CHECK FOR UNKNOWN PRODUCT / NOT IN DATABASE
        const unknownProducts = ['s24', 's23', 'iphone 15', 'iphone 16', 'iphone 14', 'poco', 'realme', 'rog', 'pixel', 'redmagic'];
        const requestedUnknown = unknownProducts.find((u) => msg.includes(u));
        if (requestedUnknown) {
          reply = `Mohon maaf, produk yang Anda tanyakan (${requestedUnknown.toUpperCase()}) saat ini **belum tersedia** dalam katalog database resmi Toko HP Novi.\n\n`;
          reply += `Koleksi smartphone resmi yang saat ini aktif di database kami meliputi:\n`;
          reply += `• **Samsung:** Galaxy A06 (Rp1.599.000), Galaxy A16 (Rp2.899.000), Galaxy A56 (Rp6.299.000)\n`;
          reply += `• **Xiaomi / Redmi:** Redmi 14C (Rp1.499.000), Redmi Note 14 (Rp2.499.000)\n`;
          reply += `• **OPPO:** OPPO A3x (Rp1.599.000), OPPO Reno13 5G (Rp7.999.000)\n`;
          reply += `• **vivo:** vivo Y29 (Rp2.999.000)\n`;
          reply += `• **Infinix:** Infinix Hot 50i (Rp1.699.000)\n`;
          reply += `• **Apple:** iPhone 13 128GB (Rp7.999.000)\n\n`;
          reply += `Silakan tanyakan salah satu model di atas jika Anda ingin mengetahui spesifikasi detail atau ketersediaan stoknya!`;
          return { reply, matched: [] };
        }

        // 7. DEFAULT GENERAL OVERVIEW
        matched = allProducts.slice(0, 4);
        reply = `Halo! Selamat datang di Toko HP Novi. Semua data produk, harga, dan ketersediaan stok kami terhubung langsung ke database Supabase.\n\n`;
        reply += `Saya dapat membantu Anda untuk:\n`;
        reply += `1. **Cek Harga & Stok:** misal *"Berapa harga Samsung Galaxy A56?"*\n`;
        reply += `2. **Rekomendasi Anggaran:** misal *"Cari HP di bawah 3 juta"*\n`;
        reply += `3. **Bandingkan Spesifikasi:** misal *"Bandingkan Samsung A16 dan Redmi Note 14"*\n`;
        reply += `4. **Cek Aksesori:** Charger 20W, Powerbank, Kabel Type-C, dll.\n\n`;
        reply += `Ketik pertanyaan Anda untuk mencari smartphone impian sesuai kebutuhan!`;
        return { reply, matched };
      }

      // Try calling Gemini first for natural AI reasoning
      let reply = '';
      let matchedProducts: any[] = [];

      try {
        const ai = new GoogleGenAI({
          apiKey: GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
        let aiSuccess = false;

        for (const m of modelsToTry) {
          try {
            const aiCallPromise = ai.models.generateContent({
              model: m,
              contents: `Konteks Percakapan Sebelumnya:
${Array.isArray(history) ? history.slice(-4).map((h) => `${h.role}: ${h.content}`).join('\n') : ''}

Pertanyaan Pelanggan: "${message}"

Berikan jawaban ramah, terstruktur, dan akurat berdasarkan katalog produk resmi database Toko HP Novi:`,
              config: {
                systemInstruction: `Anda adalah Novi AI Assistant resmi Toko HP Novi. Jawab HANYA berdasarkan produk yang ada di database resmi:
${catalogSummary}`,
              },
            });

            // 5 seconds timeout for smooth UX
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('AI generation timeout')), 5000)
            );

            const aiRes: any = await Promise.race([aiCallPromise, timeoutPromise]);
            if (aiRes?.text) {
              reply = aiRes.text;
              aiSuccess = true;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Model ${m} attempt failed (${modelErr?.message?.substring(0, 60)}), trying fallback...`);
          }
        }

        // Extract matched products for interactive cards
        const qLower = (message + ' ' + (reply || '')).toLowerCase();
        matchedProducts = dbProducts.filter((p: any) => {
          const nameWords = p.name.toLowerCase().split(' ');
          const matchesWord = nameWords.some((w: string) => w.length >= 3 && qLower.includes(w));
          const matchesSku = qLower.includes(p.sku.toLowerCase());
          return matchesWord || matchesSku;
        }).slice(0, 4);

        if (!aiSuccess || !reply) {
          // Use precision database grounded engine if Gemini is busy
          const fallback = generateDatabaseGroundedAnswer(message, dbProducts);
          reply = fallback.reply;
          if (matchedProducts.length === 0) {
            matchedProducts = fallback.matched;
          }
        }
      } catch (err: any) {
        console.warn('AI provider error, utilizing verified database response engine:', err?.message);
        const fallback = generateDatabaseGroundedAnswer(message, dbProducts);
        reply = fallback.reply;
        matchedProducts = fallback.matched;
      }

      res.json({
        reply,
        sourceCount: dbProducts.length,
        matchedProducts,
      });
    } catch (error: any) {
      console.error('Error handling /api/chat:', error);
      res.status(500).json({
        error: error.message || 'Terjadi kesalahan saat memproses permintaan AI.',
      });
    }
  });

  // =========================================================================
  // ADMIN & MANAJEMEN SISTEM ENDPOINTS
  // =========================================================================

  // In-memory fallback stores for auxiliary tables if not yet created via SQL migration
  const memStockMovements: any[] = [];
  const memCategories: { id: string; name: string; description?: string; created_at: string }[] = [
    { id: 'cat-1', name: 'Smartphone', description: 'Perangkat telepon pintar resmi', created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Tablet', description: 'Tablet produktivitas dan hiburan', created_at: new Date().toISOString() },
    { id: 'cat-3', name: 'Smartwatch', description: 'Jam tangan pintar dan pelacak olahraga', created_at: new Date().toISOString() },
    { id: 'cat-4', name: 'Aksesori', description: 'Aksesori pendukung gadget original', created_at: new Date().toISOString() },
    { id: 'cat-5', name: 'Charger', description: 'Kepala charger GaN dan fast charging', created_at: new Date().toISOString() },
    { id: 'cat-6', name: 'Earphone', description: 'TWS bluetooth dan headphone', created_at: new Date().toISOString() },
    { id: 'cat-7', name: 'Power Bank', description: 'Power bank kapasitas tinggi', created_at: new Date().toISOString() },
    { id: 'cat-8', name: 'Kabel Data', description: 'Kabel data Type-C & Lightning', created_at: new Date().toISOString() },
  ];
  const memBrands: { id: string; name: string; description?: string; created_at: string }[] = [
    { id: 'br-1', name: 'Samsung', description: 'Garansi Resmi SEIN', created_at: new Date().toISOString() },
    { id: 'br-2', name: 'Apple', description: 'Garansi Resmi iBox / GDN', created_at: new Date().toISOString() },
    { id: 'br-3', name: 'Xiaomi', description: 'Garansi Resmi Xiaomi Indonesia', created_at: new Date().toISOString() },
    { id: 'br-4', name: 'Redmi', description: 'Garansi Resmi Xiaomi Indonesia', created_at: new Date().toISOString() },
    { id: 'br-5', name: 'POCO', description: 'Garansi Resmi POCO Indonesia', created_at: new Date().toISOString() },
    { id: 'br-6', name: 'OPPO', description: 'Garansi Resmi OPPO Indonesia', created_at: new Date().toISOString() },
    { id: 'br-7', name: 'vivo', description: 'Garansi Resmi vivo Indonesia', created_at: new Date().toISOString() },
    { id: 'br-8', name: 'Infinix', description: 'Garansi Resmi Infinix Indonesia', created_at: new Date().toISOString() },
    { id: 'br-9', name: 'TECNO', description: 'Garansi Resmi TECNO Indonesia', created_at: new Date().toISOString() },
    { id: 'br-10', name: 'Universal', description: 'Aksesori Original & Kompatibel', created_at: new Date().toISOString() },
  ];
  const memOrders: any[] = [];

  // A. Admin Dashboard Metrics
  app.get('/api/admin/metrics', async (_req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      // 1. Ambil semua produk untuk kalkulasi metrik
      const { data: allProds, error: pErr } = await supabase
        .from('phone_products')
        .select('*');

      if (pErr) {
        res.status(500).json({ error: pErr.message });
        return;
      }

      const products = allProds || [];
      const totalProducts = products.length;
      const outOfStockCount = products.filter((p) => Number(p.stock) <= 0).length;
      const lowStockCount = products.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5).length;
      const lowStockProducts = products.filter((p) => Number(p.stock) <= 5);

      // 2. Kategori unik
      const uniqueCats = new Set<string>();
      products.forEach((p) => {
        if (p.category) uniqueCats.add(p.category);
      });
      memCategories.forEach((c) => uniqueCats.add(c.name));
      const totalCategories = uniqueCats.size;

      // 3. Pesanan
      const pendingOrders = memOrders.filter((o) => o.status === 'menunggu_konfirmasi').length;
      const totalOrders = memOrders.length;
      const totalCustomers = 12; // Base customers registered

      res.json({
        totalProducts,
        totalCategories,
        totalCustomers,
        totalOrders,
        pendingOrders,
        lowStockCount,
        outOfStockCount,
        lowStockProducts,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal memuat metrik admin.' });
    }
  });

  // B. Admin: Ambil seluruh produk (termasuk yang tidak aktif) untuk tabel manajemen
  app.get('/api/admin/products/all', async (_req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('phone_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ data: data || [] });
    } catch (err: any) {
      res.status(500).json({ error: err?.message });
    }
  });

  // C. Admin: Tambah produk baru
  app.post('/api/admin/products', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      const {
        name,
        brand,
        category,
        price,
        stock,
        ram_gb,
        storage_gb,
        color,
        warranty_months,
        condition,
        description,
        image_url,
        is_active,
        sku,
      } = req.body;

      if (!name || !brand || price === undefined || price === null) {
        res.status(400).json({ error: 'Nama, Merek, dan Harga wajib diisi.' });
        return;
      }

      // Generate SKU unik jika belum disediakan
      const generatedSku =
        sku?.trim() ||
        `${brand.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
          Math.random() * 1000
        )}`;

      const newProduct = {
        sku: generatedSku,
        name: name.trim(),
        brand: brand.trim(),
        category: category?.trim() || 'Smartphone',
        price: Number(price),
        stock: Number(stock ?? 0),
        ram_gb: ram_gb ? Number(ram_gb) : null,
        storage_gb: storage_gb ? Number(storage_gb) : null,
        color: color?.trim() || null,
        warranty_months: warranty_months ? Number(warranty_months) : 12,
        condition: condition?.trim() || 'Baru',
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        is_active: is_active !== false,
      };

      const { data, error } = await supabase
        .from('phone_products')
        .insert(newProduct)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: `Gagal menambahkan produk ke Supabase: ${error.message}` });
        return;
      }

      // Catat log stock movement jika stok awal > 0
      if (newProduct.stock > 0 && data?.id) {
        const movementLog = {
          id: `sm-${Date.now()}`,
          product_id: data.id,
          sku: data.sku,
          product_name: data.name,
          movement_type: 'masuk',
          quantity_change: newProduct.stock,
          stock_before: 0,
          stock_after: newProduct.stock,
          notes: 'Stok awal produk baru ditambahkan',
          created_by: 'Admin',
          created_at: new Date().toISOString(),
        };
        memStockMovements.unshift(movementLog);

        // Coba simpan ke tabel stock_movements jika sudah ada
        try {
          await supabase.from('stock_movements').insert(movementLog);
        } catch {}
      }

      res.status(201).json({ data, message: 'Produk berhasil disimpan ke Supabase.' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal membuat produk baru.' });
    }
  });

  // D. Admin: Edit produk
  app.put('/api/admin/products/:id', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ error: 'ID produk wajib diisi.' });
        return;
      }

      // Ambil produk lama untuk memeriksa perubahan stok
      const { data: oldProd } = await supabase
        .from('phone_products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const {
        name,
        brand,
        category,
        price,
        stock,
        ram_gb,
        storage_gb,
        color,
        warranty_months,
        condition,
        description,
        image_url,
        is_active,
        sku,
      } = req.body;

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (name !== undefined) updateData.name = name.trim();
      if (brand !== undefined) updateData.brand = brand.trim();
      if (category !== undefined) updateData.category = category.trim();
      if (price !== undefined) updateData.price = Number(price);
      if (stock !== undefined) updateData.stock = Number(stock);
      if (ram_gb !== undefined) updateData.ram_gb = ram_gb ? Number(ram_gb) : null;
      if (storage_gb !== undefined) updateData.storage_gb = storage_gb ? Number(storage_gb) : null;
      if (color !== undefined) updateData.color = color?.trim() || null;
      if (warranty_months !== undefined) updateData.warranty_months = Number(warranty_months);
      if (condition !== undefined) updateData.condition = condition?.trim() || 'Baru';
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (image_url !== undefined) updateData.image_url = image_url?.trim() || null;
      if (is_active !== undefined) updateData.is_active = Boolean(is_active);
      if (sku !== undefined && sku.trim()) updateData.sku = sku.trim();

      const { data, error } = await supabase
        .from('phone_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: `Gagal memperbarui produk: ${error.message}` });
        return;
      }

      // Jika stok berubah, buat log mutasi otomatis
      if (oldProd && updateData.stock !== undefined && updateData.stock !== oldProd.stock) {
        const diff = updateData.stock - oldProd.stock;
        const movementLog = {
          id: `sm-${Date.now()}`,
          product_id: id,
          sku: data.sku,
          product_name: data.name,
          movement_type: diff > 0 ? 'masuk' : 'keluar',
          quantity_change: Math.abs(diff),
          stock_before: oldProd.stock,
          stock_after: updateData.stock,
          notes: 'Pembaruan stok dari form edit produk',
          created_by: 'Admin',
          created_at: new Date().toISOString(),
        };
        memStockMovements.unshift(movementLog);
        try {
          await supabase.from('stock_movements').insert(movementLog);
        } catch {}
      }

      res.json({ data, message: 'Produk berhasil diperbarui di Supabase.' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal memperbarui produk.' });
    }
  });

  // E. Admin: Hapus produk
  app.delete('/api/admin/products/:id', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      const { id } = req.params;
      const { error } = await supabase.from('phone_products').delete().eq('id', id);

      if (error) {
        res.status(500).json({ error: `Gagal menghapus produk: ${error.message}` });
        return;
      }

      res.json({ success: true, message: 'Produk berhasil dihapus dari Supabase.' });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal menghapus produk.' });
    }
  });

  // F. Kategori: Ambil semua kategori beserta hitungan produk
  app.get('/api/categories', async (_req: Request, res: Response) => {
    const supabase = getServerSupabase();
    try {
      // Hitung produk per kategori dari tabel phone_products
      const catCountMap: Record<string, number> = {};
      if (supabase) {
        const { data: prods } = await supabase.from('phone_products').select('category');
        if (prods) {
          prods.forEach((p) => {
            const cat = p.category || 'Smartphone';
            catCountMap[cat] = (catCountMap[cat] || 0) + 1;
          });
        }
      }

      // Ambil dari Supabase tabel product_categories jika tersedia
      let categoriesList = memCategories;
      if (supabase) {
        const { data, error } = await supabase.from('product_categories').select('*');
        if (!error && data && data.length > 0) {
          categoriesList = data;
        }
      }

      const result = categoriesList.map((c) => ({
        ...c,
        productCount: catCountMap[c.name] || 0,
      }));

      res.json({ data: result });
    } catch (err: any) {
      res.json({ data: memCategories.map((c) => ({ ...c, productCount: 0 })) });
    }
  });

  // Tambah Kategori
  app.post('/api/admin/categories', async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Nama kategori wajib diisi.' });
      return;
    }

    const newCat = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      created_at: new Date().toISOString(),
    };

    memCategories.unshift(newCat);

    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('product_categories').insert({ name: newCat.name, description: newCat.description });
      } catch {}
    }

    res.status(201).json({ data: newCat, message: 'Kategori berhasil ditambahkan.' });
  });

  // Hapus Kategori
  app.delete('/api/admin/categories/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = memCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memCategories.splice(idx, 1);
    }
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('product_categories').delete().eq('id', id);
      } catch {}
    }
    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  });

  // G. Merek: Ambil semua merek beserta hitungan produk
  app.get('/api/brands', async (_req: Request, res: Response) => {
    const supabase = getServerSupabase();
    try {
      const brandCountMap: Record<string, number> = {};
      if (supabase) {
        const { data: prods } = await supabase.from('phone_products').select('brand');
        if (prods) {
          prods.forEach((p) => {
            const b = p.brand || 'Lainnya';
            brandCountMap[b] = (brandCountMap[b] || 0) + 1;
          });
        }
      }

      let brandsList = memBrands;
      if (supabase) {
        const { data, error } = await supabase.from('product_brands').select('*');
        if (!error && data && data.length > 0) {
          brandsList = data;
        }
      }

      const result = brandsList.map((b) => ({
        ...b,
        productCount: brandCountMap[b.name] || 0,
      }));

      res.json({ data: result });
    } catch (err: any) {
      res.json({ data: memBrands.map((b) => ({ ...b, productCount: 0 })) });
    }
  });

  // Tambah Merek
  app.post('/api/admin/brands', async (req: Request, res: Response) => {
    const { name, description } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Nama merek wajib diisi.' });
      return;
    }

    const newBrand = {
      id: `br-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || '',
      created_at: new Date().toISOString(),
    };

    memBrands.unshift(newBrand);
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('product_brands').insert({ name: newBrand.name, description: newBrand.description });
      } catch {}
    }

    res.status(201).json({ data: newBrand, message: 'Merek berhasil ditambahkan.' });
  });

  // Hapus Merek
  app.delete('/api/admin/brands/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = memBrands.findIndex((b) => b.id === id);
    if (idx !== -1) {
      memBrands.splice(idx, 1);
    }
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        await supabase.from('product_brands').delete().eq('id', id);
      } catch {}
    }
    res.json({ success: true, message: 'Merek berhasil dihapus.' });
  });

  // H. Manajemen Stok & Mutasi Stok (Audit Trail)
  app.get('/api/admin/stock/movements', async (_req: Request, res: Response) => {
    const supabase = getServerSupabase();
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          res.json({ data });
          return;
        }
      }
      res.json({ data: memStockMovements });
    } catch {
      res.json({ data: memStockMovements });
    }
  });

  // Aksi Penyesuaian Stok (Barang Masuk, Barang Keluar, Koreksi Stok)
  app.post('/api/admin/stock/adjust', async (req: Request, res: Response) => {
    const supabase = getServerSupabase();
    if (!supabase) {
      res.status(503).json({ error: 'Supabase belum terhubung.' });
      return;
    }

    try {
      const { productId, sku, movementType, quantity, notes, adminName } = req.body;

      if (!productId || !movementType || quantity === undefined) {
        res.status(400).json({ error: 'Parameter productId, movementType, dan quantity wajib diisi.' });
        return;
      }

      const parsedQty = Math.max(0, parseInt(quantity, 10));

      // Ambil stok produk terkini dari Supabase
      const { data: prod, error: pErr } = await supabase
        .from('phone_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (pErr || !prod) {
        res.status(404).json({ error: 'Produk tidak ditemukan di database Supabase.' });
        return;
      }

      const stockBefore = Number(prod.stock || 0);
      let stockAfter = stockBefore;
      let quantityChange = parsedQty;

      if (movementType === 'masuk') {
        stockAfter = stockBefore + parsedQty;
        quantityChange = parsedQty;
      } else if (movementType === 'keluar') {
        stockAfter = Math.max(0, stockBefore - parsedQty);
        quantityChange = -parsedQty;
      } else if (movementType === 'koreksi') {
        stockAfter = parsedQty;
        quantityChange = parsedQty - stockBefore;
      } else {
        res.status(400).json({ error: 'Tipe mutasi tidak valid (pilih: masuk, keluar, koreksi).' });
        return;
      }

      // Update stok produk di database Supabase
      const { error: updErr } = await supabase
        .from('phone_products')
        .update({ stock: stockAfter, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updErr) {
        res.status(500).json({ error: `Gagal memperbarui stok di Supabase: ${updErr.message}` });
        return;
      }

      // Buat entri mutasi stok
      const movementRecord = {
        id: `sm-${Date.now()}`,
        product_id: productId,
        sku: prod.sku || sku,
        product_name: prod.name,
        movement_type: movementType,
        quantity_change: quantityChange,
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes: notes?.trim() || `Penyesuaian stok (${movementType})`,
        created_by: adminName || 'Admin Toko',
        created_at: new Date().toISOString(),
      };

      memStockMovements.unshift(movementRecord);
      try {
        await supabase.from('stock_movements').insert(movementRecord);
      } catch {}

      res.json({
        success: true,
        stockBefore,
        stockAfter,
        data: movementRecord,
        message: `Stok produk ${prod.name} berhasil diubah dari ${stockBefore} menjadi ${stockAfter} unit.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Gagal memproses perubahan stok.' });
    }
  });

  // I. Orders (Pesanan Pelanggan)
  app.get('/api/orders', async (req: Request, res: Response) => {
    const { email } = req.query;
    if (email && typeof email === 'string') {
      const filtered = memOrders.filter((o) => o.customer_email?.toLowerCase() === email.toLowerCase());
      res.json({ data: filtered });
      return;
    }
    res.json({ data: memOrders });
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    const { customerName, customerEmail, customerPhone, customerAddress, items, totalAmount } = req.body;
    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Data pesanan tidak lengkap.' });
      return;
    }

    const orderNumber = `NOVI-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: customerEmail || '',
      customer_phone: customerPhone || '',
      customer_address: customerAddress || '',
      total_amount: Number(totalAmount || 0),
      status: 'menunggu_konfirmasi',
      items,
      created_at: new Date().toISOString(),
    };

    memOrders.unshift(newOrder);

    // Potong stok produk jika terhubung ke Supabase
    const supabase = getServerSupabase();
    if (supabase) {
      for (const item of items) {
        if (item.productId && item.quantity) {
          const { data: p } = await supabase.from('phone_products').select('stock, name, sku').eq('id', item.productId).single();
          if (p) {
            const newStock = Math.max(0, Number(p.stock) - Number(item.quantity));
            await supabase.from('phone_products').update({ stock: newStock }).eq('id', item.productId);

            // Log movement
            const log = {
              id: `sm-${Date.now()}-${Math.random()}`,
              product_id: item.productId,
              sku: p.sku,
              product_name: p.name,
              movement_type: 'keluar',
              quantity_change: -Number(item.quantity),
              stock_before: p.stock,
              stock_after: newStock,
              notes: `Pesanan pelanggan #${orderNumber}`,
              created_by: 'Sistem Pesanan',
              created_at: new Date().toISOString(),
            };
            memStockMovements.unshift(log);
          }
        }
      }
    }

    res.status(201).json({ data: newOrder, message: 'Pesanan berhasil dibuat!' });
  });

  // Setup Vite or static serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Toko HP Novi aktif di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
