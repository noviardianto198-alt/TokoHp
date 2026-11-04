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
