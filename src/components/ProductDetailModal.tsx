import React from 'react';
import { PhoneProduct } from '../lib/supabase';
import { formatRupiah, getWhatsAppProductUrl } from '../lib/config';
import { ProductPlaceholder } from './ProductPlaceholder';
import {
  X,
  Sparkles,
  MessageCircle,
  Cpu,
  HardDrive,
  Palette,
  ShieldCheck,
  Package,
  Layers,
  Tag,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: PhoneProduct | null;
  onClose: () => void;
  onAskAI: (product: PhoneProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAskAI,
}) => {
  if (!product) return null;

  const isOutOfStock = Number(product.stock) <= 0;
  const whatsappUrl = getWhatsAppProductUrl(product.name, product.sku);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-100 text-blue-700">
              {product.brand}
            </span>
            <span className="text-xs text-slate-500 font-medium">SKU: {product.sku}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Visual presentation */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="max-h-64 object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full">
                  <ProductPlaceholder
                    brand={product.brand}
                    name={product.name}
                    category={product.category}
                    color={product.color}
                    ram={product.ram_gb}
                    storage={product.storage_gb}
                  />
                </div>
              )}
            </div>

            {/* Main Product Info */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">
                  {product.category || 'Smartphone'}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                  {product.name}
                </h2>
              </div>

              {/* Price & Stock */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                <span className="text-xs font-medium text-slate-500">Harga Resmi</span>
                <div className="text-2xl font-black text-blue-900 tracking-tight">
                  {formatRupiah(product.price)}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Stok Sedang Habis (0 Unit)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tersedia: {product.stock} unit siap kirim
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Grid: Only display fields available in database */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Spesifikasi Lengkap
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {product.ram_gb !== null && product.ram_gb !== undefined && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Cpu className="w-3.5 h-3.5 text-blue-600" />
                    <span>RAM</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.ram_gb} GB
                  </div>
                </div>
              )}

              {product.storage_gb !== null && product.storage_gb !== undefined && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                    <span>Penyimpanan</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.storage_gb} GB
                  </div>
                </div>
              )}

              {product.color && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Palette className="w-3.5 h-3.5 text-blue-600" />
                    <span>Warna</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.color}
                  </div>
                </div>
              )}

              {product.warranty_months !== null && product.warranty_months !== undefined && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Garansi</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.warranty_months} Bulan
                  </div>
                </div>
              )}

              {product.condition && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kondisi</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.condition}
                  </div>
                </div>
              )}

              {product.category && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kategori</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {product.category}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">Deskripsi Produk</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAskAI(product);
            }}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-blue-700 bg-blue-100/80 hover:bg-blue-200 active:scale-[0.99] transition-all cursor-pointer text-sm shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Tanya AI tentang Produk Ini</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all text-sm shadow-md shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
