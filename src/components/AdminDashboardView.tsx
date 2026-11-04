import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Layers,
  Users,
  ShoppingBag,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Tag,
  Shield,
  FileCode,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PhoneProduct } from '../lib/supabase';
import { formatRupiah } from '../lib/config';
import { SUPABASE_SETUP_SQL } from '../lib/schema-sql';
import { AdminProductModal } from './AdminProductModal';
import { AdminStockModal } from './AdminStockModal';

export type AdminTab = 'overview' | 'products' | 'categories' | 'brands' | 'stock' | 'sql';

interface AdminDashboardViewProps {
  initialTab?: AdminTab;
  onNavigateToCatalog: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  initialTab = 'overview',
  onNavigateToCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search for Products
  const [productSearch, setProductSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PhoneProduct | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<PhoneProduct | null>(null);

  const [productToDelete, setProductToDelete] = useState<PhoneProduct | null>(null);

  // New Category / Brand inputs
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catSearch, setCatSearch] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  const [sqlCopied, setSqlCopied] = useState(false);

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [metricsRes, prodsRes, catsRes, brandsRes, movRes] = await Promise.all([
        fetch('/api/admin/metrics').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/products/all').then((r) => r.json()).catch(() => null),
        fetch('/api/categories').then((r) => r.json()).catch(() => null),
        fetch('/api/brands').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/stock/movements').then((r) => r.json()).catch(() => null),
      ]);

      if (metricsRes) setMetrics(metricsRes);
      if (prodsRes?.data) setProducts(prodsRes.data);
      if (catsRes?.data) setCategories(catsRes.data);
      if (brandsRes?.data) setBrands(brandsRes.data);
      if (movRes?.data) setStockMovements(movRes.data);
    } catch (e) {
      console.error('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Product delete
  const handleDeleteProduct = async (product: PhoneProduct) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProductToDelete(null);
        loadAdminData();
      }
    } catch (e) {
      console.error('Error deleting product:', e);
    }
  };

  // Category submit
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() }),
      });
      if (res.ok) {
        setNewCatName('');
        setNewCatDesc('');
        loadAdminData();
      }
    } catch (e) {
      console.error('Error adding category:', e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return;
    try {
      await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      loadAdminData();
    } catch (e) {
      console.error('Error deleting category:', e);
    }
  };

  // Brand submit
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim(), description: newBrandDesc.trim() }),
      });
      if (res.ok) {
        setNewBrandName('');
        setNewBrandDesc('');
        loadAdminData();
      }
    } catch (e) {
      console.error('Error adding brand:', e);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Yakin ingin menghapus merek ini?')) return;
    try {
      await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      loadAdminData();
    } catch (e) {
      console.error('Error deleting brand:', e);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchBrand = selectedBrand === 'all' || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    const matchCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchSearch && matchBrand && matchCat;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const copySqlScript = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2500);
  };

  const brandOptions = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  const categoryOptions = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Pusat Kendali Toko HP Novi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Dashboard & Manajemen Admin</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Kelola katalog produk, stok langsung, kategori, merek, dan pantau aktivitas toko yang terhubung ke database Supabase PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
            <button
              onClick={onNavigateToCatalog}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Lihat Katalog Publik
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-4 border-t border-white/10 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Ringkasan Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Manajemen Produk ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Manajemen Stok & Mutasi</span>
            {metrics?.lowStockCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Kategori</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'brands'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Merek</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sql'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Skrip SQL & RLS</span>
          </button>
        </div>
      </div>

      {/* Low Stock Urgent Warning Banner */}
      {metrics?.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Peringatan Stok: {metrics.lowStockCount} Produk Berada Pada Stok Menipis (1-5 unit)
              </h4>
              <p className="text-[11px] text-amber-700">
                Segera lakukan penambahan stok distributor untuk menghindari kekosongan persediaan penjualan.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Kelola Stok
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TAB: RINGKASAN OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Produk</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">{metrics?.totalProducts ?? products.length}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Tersimpan di Supabase</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Kategori</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">{metrics?.totalCategories ?? 8}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Kategori aktif</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Stok Menipis (1-5)</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-600">{metrics?.lowStockCount ?? 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Perlu restock segera</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Stok Habis (0)</span>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-red-600">{metrics?.outOfStockCount ?? 0}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">Tidak tersedia</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produk Perlu Perhatian */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Daftar Produk Stok Terendah</span>
                </h3>
                <button
                  onClick={() => setActiveTab('stock')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {products
                  .filter((p) => Number(p.stock) <= 5)
                  .slice(0, 5)
                  .map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {p.brand} • SKU: {p.sku}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                            Number(p.stock) <= 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {Number(p.stock) <= 0 ? 'HABIS' : `${p.stock} Unit`}
                        </span>
                        <button
                          onClick={() => {
                            setStockProduct(p);
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          + Tambah Stok
                        </button>
                      </div>
                    </div>
                  ))}
                {products.filter((p) => Number(p.stock) <= 5).length === 0 && (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Semua stok produk saat ini mencukupi (&gt; 5 unit).
                  </p>
                )}
              </div>
            </div>

            {/* Riwayat Mutasi Terkini */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Aktivitas Mutasi Stok Terakhir</span>
                </h3>
                <button
                  onClick={() => setActiveTab('stock')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Riwayat Penuh
                </button>
              </div>

              <div className="space-y-3">
                {stockMovements.slice(0, 5).map((m, idx) => (
                  <div key={m.id || idx} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.product_name}</span>
                      <span className="text-[11px] text-slate-500">
                        {m.notes || 'Penyesuaian stok'} • {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-black ${
                          m.movement_type === 'masuk'
                            ? 'text-emerald-600'
                            : m.movement_type === 'keluar'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {m.movement_type === 'masuk' ? `+${m.quantity_change}` : m.quantity_change} unit
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {m.stock_before} → {m.stock_after}
                      </span>
                    </div>
                  </div>
                ))}
                {stockMovements.length === 0 && (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Belum ada riwayat mutasi stok. Lakukan penambahan atau koreksi stok untuk mencatat riwayat.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: MANAJEMEN PRODUK LENGKAP */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama, brand, atau SKU..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Filter Brand */}
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              >
                <option value="all">Semua Merek</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Filter Kategori */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Merek & Kategori</th>
                  <th className="py-3 px-4">Harga</th>
                  <th className="py-3 px-4">RAM / ROM</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((p) => {
                  const stockNum = Number(p.stock || 0);
                  const isOutOfStock = stockNum <= 0;
                  const isLowStock = stockNum > 0 && stockNum <= 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{p.brand}</span>
                        <span className="text-[11px] text-slate-500">{p.category}</span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900">{formatRupiah(p.price)}</span>
                      </td>

                      {/* RAM/ROM */}
                      <td className="py-3 px-4 text-slate-600">
                        {p.ram_gb ? `${p.ram_gb}GB` : '-'} / {p.storage_gb ? `${p.storage_gb}GB` : '-'}
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? '0 (Habis)' : `${stockNum} unit`}
                        </span>
                      </td>

                      {/* Status Aktif */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.is_active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Sesuaikan Stok"
                            onClick={() => {
                              setStockProduct(p);
                              setIsStockModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Produk"
                            onClick={() => {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Produk"
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada produk yang sesuai dengan kriteria pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} produk
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-semibold">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: MANAJEMEN STOK & MUTASI (AUDIT TRAIL) */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card with Stock Guidelines */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Pedoman Klasifikasi Stok Toko HP Novi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600" />
                <div>
                  <span className="text-xs font-bold text-red-900 block">0 Unit = STOK HABIS</span>
                  <span className="text-[11px] text-red-700">Produk tidak dapat dibeli pelanggan</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div>
                  <span className="text-xs font-bold text-amber-900 block">1 - 5 Unit = STOK MENIPIS</span>
                  <span className="text-[11px] text-amber-700">Waspada sisa sedikit, segera order distributor</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">&gt; 5 Unit = TERSEDIA</span>
                  <span className="text-[11px] text-emerald-700">Persediaan toko aman dan siap kirim</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Adjustment Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Penyesuaian Stok Cepat per Produk</h3>
                <p className="text-xs text-slate-500">Klik tombol aksi untuk mencatat barang masuk atau koreksi stok</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">SKU & Nama Produk</th>
                    <th className="py-3 px-4">Merek</th>
                    <th className="py-3 px-4">Stok Saat Ini</th>
                    <th className="py-3 px-4">Status Persediaan</th>
                    <th className="py-3 px-4 text-right">Aksi Penyesuaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const stock = Number(p.stock || 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{p.brand}</td>
                        <td className="py-3 px-4 font-black text-slate-900">{stock} unit</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stock <= 0
                                ? 'bg-red-100 text-red-700'
                                : stock <= 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {stock <= 0 ? 'HABIS' : stock <= 5 ? 'MENIPIS' : 'TERSEDIA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setStockProduct(p);
                              setIsStockModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Sesuaikan Stok
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail Log Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Mutasi Stok (Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                Log otomatis setiap kali terjadi barang masuk, pengeluaran barang, atau koreksi stok oleh admin
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Produk</th>
                    <th className="py-3 px-4">Jenis Mutasi</th>
                    <th className="py-3 px-4 text-center">Perubahan</th>
                    <th className="py-3 px-4 text-center">Sebelum → Sesudah</th>
                    <th className="py-3 px-4">Alasan / Catatan</th>
                    <th className="py-3 px-4">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{m.product_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {m.sku}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.movement_type === 'masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movement_type === 'keluar'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.movement_type === 'masuk'
                            ? 'Barang Masuk'
                            : m.movement_type === 'keluar'
                            ? 'Barang Keluar'
                            : 'Koreksi Stok'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black">
                        <span
                          className={
                            m.movement_type === 'masuk'
                              ? 'text-emerald-600'
                              : m.movement_type === 'keluar'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }
                        >
                          {m.movement_type === 'masuk' ? `+${m.quantity_change}` : m.quantity_change} unit
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {m.stock_before} → <strong>{m.stock_after}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{m.notes || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{m.created_by || 'Admin'}</td>
                    </tr>
                  ))}
                  {stockMovements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        Belum ada riwayat mutasi stok tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: MANAJEMEN KATEGORI */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Form Tambah Kategori */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tambah Kategori Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Tambahkan kategori untuk memudahkan klasifikasi katalog.</p>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tablet, Smartwatch"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat kategori..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                + Simpan Kategori
              </button>
            </form>
          </div>

          {/* List Kategori */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Kategori Produk</h3>
                <p className="text-xs text-slate-500">Jumlah produk yang terhubung ke setiap kategori</p>
              </div>
              <input
                type="text"
                placeholder="Cari kategori..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="divide-y divide-slate-100">
              {categories
                .filter((c) => !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase()))
                .map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{cat.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          {cat.productCount ?? 0} Produk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.description || 'Tidak ada deskripsi'}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB: MANAJEMEN MEREK */}
      {/* ========================================================================= */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Form Tambah Merek */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs h-fit">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tambah Merek Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Tambahkan brand smartphone resmi baru ke toko.</p>

            <form onSubmit={handleAddBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Merek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ASUS, Sony, Google Pixel"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi / Garansi Resmi</label>
                <input
                  type="text"
                  placeholder="Contoh: Garansi Resmi Asus Indonesia"
                  value={newBrandDesc}
                  onChange={(e) => setNewBrandDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                + Simpan Merek
              </button>
            </form>
          </div>

          {/* List Merek */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">Daftar Merek Smartphone & Aksesori</h3>
              <p className="text-xs text-slate-500">Merek yang telah terdaftar dalam sistem katalog</p>
            </div>

            <div className="divide-y divide-slate-100">
              {brands.map((b) => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{b.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {b.productCount ?? 0} Produk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{b.description || 'Garansi resmi distributor'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteBrand(b.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Hapus Merek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: SKRIP SQL & RLS MIGRATION */}
      {/* ========================================================================= */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Skrip SQL Migrasi Database Supabase</h3>
              <p className="text-xs text-slate-500">
                Jalankan skrip ini sekali di menu <strong>SQL Editor</strong> dashboard Supabase Anda untuk membuat seluruh tabel dan izin akses.
              </p>
            </div>
            <button
              onClick={copySqlScript}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
            >
              {sqlCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{sqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh SQL'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onSaved={loadAdminData}
        categories={categories.map((c) => c.name)}
        brands={brands.map((b) => b.name)}
      />

      <AdminStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockProduct(null);
        }}
        product={stockProduct}
        onStockUpdated={loadAdminData}
      />

      {/* Confirm Delete Product Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Hapus Produk dari Database?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Anda akan menghapus <strong className="text-slate-800">{productToDelete.name}</strong> (SKU: {productToDelete.sku}) secara permanen dari Supabase.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete)}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
