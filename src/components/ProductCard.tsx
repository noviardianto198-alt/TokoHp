import React from 'react';
import { PhoneProduct } from '../lib/supabase';
import { formatRupiah } from '../lib/config';
import { ProductPlaceholder } from './ProductPlaceholder';
import { Sparkles, Info, CheckCircle2, XCircle, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
  product: PhoneProduct;
  onSelect: (product: PhoneProduct) => void;
  onAskAI: (product: PhoneProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onAskAI }) => {
  const isOutOfStock = Number(product.stock) <= 0;
  const isPhone = (product.category || 'Smartphone').toLowerCase() === 'smartphone';

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div>
        {/* Product Image / Placeholder */}
        <div className="relative cursor-pointer" onClick={() => onSelect(product)}>
          {product.image_url ? (
            <div className="w-full h-48 bg-slate-100 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <ProductPlaceholder
              brand={product.brand}
              name={product.name}
              category={product.category}
              color={product.color}
              ram={product.ram_gb}
              storage={product.storage_gb}
            />
          )}

          {/* Condition Tag */}
          <div className="absolute bottom-2 left-3">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs ${
                product.condition?.toLowerCase() === 'baru'
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {product.condition || 'Baru'}
            </span>
          </div>
        </div>

        {/* Content details */}
        <div className="p-4 space-y-3">
          {/* Brand & Stock Status */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px]">
              {product.brand}
            </span>
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                <XCircle className="w-3 h-3" />
                Stok Habis
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                Stok: {product.stock}
              </span>
            )}
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-base leading-snug cursor-pointer min-h-[2.75rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Specs: RAM & Storage */}
          {isPhone && (product.ram_gb || product.storage_gb) && (
            <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              {product.ram_gb && (
                <div className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  <span>RAM {product.ram_gb} GB</span>
                </div>
              )}
              {product.ram_gb && product.storage_gb && (
                <span className="text-slate-300">•</span>
              )}
              {product.storage_gb && (
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                  <span>ROM {product.storage_gb} GB</span>
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="pt-1">
            <div className="text-xs text-slate-400 font-medium">Harga Resmi</div>
            <div className="text-lg font-extrabold text-blue-900 tracking-tight">
              {formatRupiah(product.price)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={() => onSelect(product)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Detail</span>
        </button>

        <button
          type="button"
          onClick={() => onAskAI(product)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 active:scale-[0.98] transition-all cursor-pointer border border-blue-200/60"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tanya AI</span>
        </button>
      </div>
    </div>
  );
};
