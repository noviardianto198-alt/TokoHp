import React, { useState } from 'react';
import {
  X,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { PhoneProduct } from '../lib/supabase';

interface AdminStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PhoneProduct | null;
  onStockUpdated: () => void;
}

export const AdminStockModal: React.FC<AdminStockModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockUpdated,
}) => {
  const [movementType, setMovementType] = useState<'masuk' | 'keluar' | 'koreksi'>('masuk');
  const [quantity, setQuantity] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = Number(product.stock || 0);
  const parsedQty = Math.max(0, parseInt(quantity || '0', 10));

  let resultingStock = currentStock;
  if (movementType === 'masuk') {
    resultingStock = currentStock + parsedQty;
  } else if (movementType === 'keluar') {
    resultingStock = Math.max(0, currentStock - parsedQty);
  } else if (movementType === 'koreksi') {
    resultingStock = parsedQty;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (parsedQty <= 0 && movementType !== 'koreksi') {
      setErrorMsg('Jumlah stok harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sku: product.sku,
          movementType,
          quantity: parsedQty,
          notes: notes.trim() || undefined,
          adminName: 'Admin Toko',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah stok di Supabase.');
      }

      onStockUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Penyesuaian Stok Produk</h2>
              <p className="text-[11px] text-blue-200 truncate max-w-[240px]">
                {product.name} ({product.brand})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Stock Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Stok Saat Ini</span>
              <span className="text-xl font-black text-slate-900">
                {currentStock}{' '}
                <span className="text-xs font-normal text-slate-500">unit</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium block">Estimasi Hasil</span>
              <span
                className={`text-xl font-black ${
                  resultingStock <= 0
                    ? 'text-red-600'
                    : resultingStock <= 5
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {resultingStock}{' '}
                <span className="text-xs font-normal text-slate-500">unit</span>
              </span>
            </div>
          </div>

          {/* Movement Type Radio Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilih Jenis Perubahan Stok:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('masuk')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  movementType === 'masuk'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 font-bold ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Barang Masuk</span>
                <span className="text-[10px] text-slate-400 font-normal">(+) Tambah</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('keluar')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  movementType === 'keluar'
                    ? 'border-red-600 bg-red-50/70 text-red-800 font-bold ring-1 ring-red-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-red-600" />
                <span className="text-xs">Barang Keluar</span>
                <span className="text-[10px] text-slate-400 font-normal">(-) Kurang</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('koreksi')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  movementType === 'koreksi'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 font-bold ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Koreksi Stok</span>
                <span className="text-[10px] text-slate-400 font-normal">(=) Opname</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {movementType === 'koreksi' ? 'Jumlah Stok Baru Sebenarnya' : 'Jumlah Unit'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-sm font-bold px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan / Keterangan Mutasi <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pasokan distributor resmi SEIN, retur pelanggan, audit fisik"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memperbarui...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Mutasi Stok</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
