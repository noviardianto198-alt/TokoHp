
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function cleanValue(value?: string) {
  if (!value) return '';

  return value.trim().replace(/^['"]|['"]$/g, '');
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Hanya menerima GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  try {
    const url = cleanValue(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    );

    const anonKey = cleanValue(
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY
    );

    if (!url || !anonKey) {
      return res.status(503).json({
        error: 'Konfigurasi Supabase belum tersedia di Vercel.',
        data: null,
      });
    }

    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      brand,
      category,
      in_stock,
      search,
      sort,
    } = req.query;

    let query = supabase
      .from('phone_products')
      .select('*')
      .eq('is_active', true);

    // Filter merek
    if (typeof brand === 'string' && brand !== 'all') {
      query = query.ilike('brand', brand);
    }

    // Filter kategori
    if (typeof category === 'string' && category !== 'all') {
      query = query.ilike('category', category);
    }

    // Filter stok
    if (in_stock === 'true') {
      query = query.gt('stock', 0);
    }

    // Pencarian produk
    if (typeof search === 'string' && search.trim()) {
      const keyword = search.trim();

      query = query.or(
        `name.ilike.%${keyword}%,brand.ilike.%${keyword}%,sku.ilike.%${keyword}%`
      );
    }

    // Pengurutan
    switch (sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;

      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;

      case 'name-desc':
        query = query.order('name', { ascending: false });
        break;

      case 'stock-desc':
        query = query.order('stock', { ascending: false });
        break;

      default:
        query = query.order('name', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase products error:', error);

      return res.status(500).json({
        error: error.message,
        data: null,
      });
    }

    return res.status(200).json({
      data: data || [],
      count: data?.length || 0,
      source: 'supabase_database',
    });

  } catch (error: any) {
    console.error('Products API error:', error);

    return res.status(500).json({
      error: error.message || 'Gagal mengambil data produk.',
      data: null,
    });
  }
}
