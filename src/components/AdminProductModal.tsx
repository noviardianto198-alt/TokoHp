import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Save,
  Image as ImageIcon,
  DollarSign,
  Layers,
  Cpu,
  HardDrive,
  Palette,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PhoneProduct } from '../lib/supabase';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: PhoneProduct | null;
  onSaved: () => void;
  categories: string[];
  brands: string[];
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
  categories,
  brands,
}) => {
  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Samsung');
  const [category, setCategory] = useState('Smartphone');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [ramGb, setRamGb] = useState('');
  const [storageGb, setStorageGb] = useState('');
  const [color, setColor] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('12');
  const [condition, setCondition] = useState('Baru');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sku, setSku] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setBrand(productToEdit.brand || 'Samsung');
      setCategory(productToEdit.category || 'Smartphone');
      setPrice(String(productToEdit.price || ''));
      setStock(String(productToEdit.stock ?? 0));
      setRamGb(productToEdit.ram_gb ? String(productToEdit.ram_gb) : '');
      setStorageGb(productToEdit.storage_gb ? String(productToEdit.storage_gb) : '');
      setColor(productToEdit.color || '');
      setWarrantyMonths(String(productToEdit.warranty_months || 12));
      setCondition(productToEdit.condition || 'Baru');
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.image_url || '');
      setIsActive(productToEdit.is_active !== false);
      setSku(productToEdit.sku || '');
    } else {
      setName('');
      setBrand(brands[0] || 'Samsung');
      setCategory('Smartphone');
      setPrice('');
      setStock('10');
      setRamGb('8');
      setStorageGb('128');
      setColor('Black');
      setWarrantyMonths('12');
      setCondition('Baru');
      setDescription('');
      setImageUrl('');
      setIsActive(true);
      setSku('');
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen, brands]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMsg('Harga produk harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      price: Number(price),
      stock: Math.max(0, parseInt(stock || '0', 10)),
      ram_gb: ramGb ? parseInt(ramGb, 10) : null,
      storage_gb: storageGb ? parseInt(storageGb, 10) : null,
      color: color.trim() || null,
      warranty_months: warrantyMonths ? parseInt(warrantyMonths, 10) : 12,
      condition,
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      is_active: isActive,
      sku: sku.trim() || undefined,
    };

    try {
      const url = isEditing
        ? `/api/admin/products/${productToEdit?.id}`
        : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan produk ke database Supabase.');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? `Edit Produk: ${productToEdit?.name}` : 'Tambah Produk Baru'}
              </h2>
              <p className="text-[11px] text-slate-300">
                Data akan tersimpan secara instan ke tabel <code className="text-blue-300 font-mono">public.phone_products</code> Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Produk */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Samsung Galaxy S24 Ultra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Merek */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Merek HP <span className="text-red-500">*</span>
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Harga */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Harga Resmi (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="Contoh: 14999000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Stok */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Stok <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="Jumlah unit"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* RAM (GB) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                RAM (GB) <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 8"
                value={ramGb}
                onChange={(e) => setRamGb(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Penyimpanan (GB) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penyimpanan Internal (GB) <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 256"
                value={storageGb}
                onChange={(e) => setStorageGb(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Warna */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Varian</label>
              <input
                type="text"
                placeholder="Contoh: Titanium Gray, Midnight Blue"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Garansi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Garansi (Bulan)
              </label>
              <input
                type="number"
                min="0"
                placeholder="12"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Foto URL Produk */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Foto Produk <span className="text-slate-400 font-normal">(Supabase Storage / CDN URL)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://.../gambar-produk.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Deskripsi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi & Keunggulan</label>
              <textarea
                rows={3}
                placeholder="Jelaskan spesifikasi utama, fitur kamera, chipset, dan keunggulan produk..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Status Aktif & SKU */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Tampilkan di Katalog Publik (Status Aktif)
                </label>
              </div>

              {sku && (
                <span className="text-[11px] font-mono text-slate-500">
                  SKU: <strong className="text-slate-700">{sku}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  <span>Menyimpan ke Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Produk Baru'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
