export interface PhoneProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  ram_gb: number | null;
  storage_gb: number | null;
  color: string | null;
  warranty_months: number | null;
  condition: string | null;
  description: string | null;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStatusResponse {
  configured: boolean;
  connected: boolean;
  count: number;
  error: string | null;
  code?: string;
}

export interface ProductQueryParams {
  brand?: string;
  category?: string;
  in_stock?: boolean;
  search?: string;
  sort?: string;
}

/**
 * Memeriksa status koneksi database Supabase melalui endpoint backend server
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatusResponse> {
  try {
    const res = await fetch('/api/database/status');
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        configured: false,
        connected: false,
        count: 0,
        error: errData.error || `Server HTTP ${res.status}: Gagal memeriksa database.`,
      };
    }
    const data: DatabaseStatusResponse = await res.json();
    return data;
  } catch (err: any) {
    return {
      configured: false,
      connected: false,
      count: 0,
      error: err?.message || 'Gagal menghubungi server aplikasi.',
    };
  }
}

/**
 * Mengambil daftar produk aktif dari tabel phone_products melalui server backend
 */
export async function fetchActivePhoneProducts(params?: ProductQueryParams): Promise<{
  data: PhoneProduct[] | null;
  count: number;
  error: string | null;
}> {
  try {
    const query = new URLSearchParams();
    if (params?.brand && params.brand !== 'all') query.set('brand', params.brand);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.in_stock) query.set('in_stock', 'true');
    if (params?.search?.trim()) query.set('search', params.search.trim());
    if (params?.sort) query.set('sort', params.sort);

    const qs = query.toString();
    const url = `/api/products${qs ? `?${qs}` : ''}`;

    const res = await fetch(url);
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        count: 0,
        error: result.error || `Gagal mengambil produk (${res.status})`,
      };
    }

    return {
      data: (result.data as PhoneProduct[]) || [],
      count: result.count ?? (result.data?.length || 0),
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      count: 0,
      error: err?.message || 'Gagal terhubung ke endpoint produk server.',
    };
  }
}

/**
 * Mencari produk berdasarkan nama dan merek melalui endpoint backend /api/products/search
 */
export async function searchPhoneProducts(
  searchTerm?: string,
  brand?: string
): Promise<{
  data: PhoneProduct[] | null;
  error: string | null;
}> {
  try {
    const query = new URLSearchParams();
    if (searchTerm?.trim()) query.set('q', searchTerm.trim());
    if (brand && brand !== 'all') query.set('brand', brand.trim());

    const res = await fetch(`/api/products/search?${query.toString()}`);
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: result.error || 'Gagal mencari produk dari server.',
      };
    }

    return {
      data: (result.data as PhoneProduct[]) || [],
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Gagal menghubungi server pencarian produk.',
    };
  }
}

/**
 * Mengambil detail produk dari database berdasarkan SKU melalui endpoint /api/products/sku/:sku
 */
export async function fetchProductBySku(sku: string): Promise<{
  data: PhoneProduct | null;
  error: string | null;
}> {
  try {
    if (!sku?.trim()) {
      return { data: null, error: 'SKU produk tidak valid.' };
    }

    const res = await fetch(`/api/products/sku/${encodeURIComponent(sku.trim())}`);
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: result.error || `Produk SKU ${sku} tidak ditemukan.`,
      };
    }

    return {
      data: (result.data as PhoneProduct) || null,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err?.message || 'Gagal menghubungi server untuk detail produk.',
    };
  }
}
