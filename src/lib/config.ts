export interface StoreConfig {
  brandName: string;
  slogan: string;
  description: string;
  whatsappNumber: string; // international format without + or with
  whatsappFormatted: string;
  email: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    mapEmbedQuery?: string;
  };
  operationalHours: {
    weekday: string;
    weekend: string;
    note: string;
  };
  socialLinks: {
    instagram: string;
    tiktok: string;
    facebook: string;
  };
}

export const STORE_CONFIG: StoreConfig = {
  brandName: 'Toko HP Novi',
  slogan: 'Solusi kebutuhan smartphone Anda.',
  description:
    'Toko HP Novi merupakan toko yang menyediakan berbagai pilihan smartphone dan aksesori dari berbagai merek. Kami berkomitmen memberikan informasi produk yang jelas, harga yang kompetitif, dan pelayanan terbaik kepada pelanggan.',
  whatsappNumber: '6281234567890',
  whatsappFormatted: '+62 812-3456-7890',
  email: 'kontak@tokohpnovi.id',
  address: {
    street: 'Jl. Pemuda No. 45, Ruko Graha Plaza Blok B2',
    city: 'Pusat Kota',
    province: 'Jawa Tengah',
    postalCode: '50132',
    country: 'Indonesia',
  },
  operationalHours: {
    weekday: 'Senin - Sabtu: 09.00 - 21.00 WIB',
    weekend: 'Minggu: 10.00 - 18.00 WIB',
    note: 'Layanan konsultasi online melalui Novi AI Assistant aktif 24 jam.',
  },
  socialLinks: {
    instagram: 'https://instagram.com/tokohpnovi',
    tiktok: 'https://tiktok.com/@tokohpnovi',
    facebook: 'https://facebook.com/tokohpnovi',
  },
};

/**
 * Generates WhatsApp click-to-chat URL with pre-filled message
 */
export function getWhatsAppProductUrl(productName: string, sku?: string): string {
  const cleanNumber = STORE_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Halo Toko HP Novi, saya tertarik dengan produk ${productName}${sku ? ` (SKU: ${sku})` : ''}. Apakah unitnya masih tersedia dan ada penawaran promo hari ini?`
  );
  return `https://wa.me/${cleanNumber}?text=${message}`;
}

export function getWhatsAppGeneralUrl(): string {
  const cleanNumber = STORE_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
  const message = encodeURIComponent(
    `Halo Toko HP Novi, saya ingin bertanya seputar ketersediaan smartphone dan layanan toko.`
  );
  return `https://wa.me/${cleanNumber}?text=${message}`;
}

/**
 * Format currency to IDR Rupiah (Rp X.XXX.XXX)
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return 'Rp0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}
