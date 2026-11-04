import React, { useState, useMemo } from 'react';
import { PhoneProduct } from '../lib/supabase';
import { ProductCard } from './ProductCard';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react';

interface CatalogViewProps {
  products: PhoneProduct[];
  isLoading: boolean;
  dbError: string | null;
  onRefreshDb: () => void;
  onOpenDbStatus: () => void;
  onSelectProduct: (product: PhoneProduct) => void;
  onAskAI: (product: PhoneProduct) => void;
  selectedBrandFilter: string;
  onSelectBrandFilter: (brand: string) => void;
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export type PriceRange = 'all' | 'under2m' | '2m-3m' | '3m-5m' | '5m-10m' | 'above10m';
export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-desc';

const BRANDS = [
  'Samsung',
  'Apple',
  'Xiaomi',
  'Redmi',
  'POCO',
  'OPPO',
  'vivo',
  'Infinix',
  'TECNO',
  'Universal',
];

const ITEMS_PER_PAGE = 9;

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  isLoading,
  dbError,
  onRefreshDb,
  onOpenDbStatus,
  onSelectProduct,
  onAskAI,
  selectedBrandFilter,
  onSelectBrandFilter,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  searchQuery,
  onSearchChange,
}) => {
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query filter (name, brand, sku, description)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(query);
          const matchBrand = p.brand?.toLowerCase().includes(query);
          const matchSku = p.sku?.toLowerCase().includes(query);
          const matchDesc = p.description?.toLowerCase().includes(query);
          if (!matchName && !matchBrand && !matchSku && !matchDesc) {
            return false;
          }
        }

        // Brand filter
        if (selectedBrandFilter !== 'all') {
          if (p.brand?.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
            return false;
          }
        }

        // Category filter
        if (selectedCategoryFilter !== 'all') {
          if (p.category?.toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
            return false;
          }
        }

        // In-stock only filter
        if (inStockOnly && Number(p.stock) <= 0) {
          return false;
        }

        // Price range filter
        const price = Number(p.price || 0);
        if (priceRange === 'under2m' && price >= 2000000) return false;
        if (priceRange === '2m-3m' && (price < 2000000 || price > 3000000)) return false;
        if (priceRange === '3m-5m' && (price < 3000000 || price > 5000000)) return false;
        if (priceRange === '5m-10m' && (price < 5000000 || price > 10000000)) return false;
        if (priceRange === 'above10m' && price <= 10000000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return Number(a.price) - Number(b.price);
        }
        if (sortBy === 'price-desc') {
          return Number(b.price) - Number(a.price);
        }
        if (sortBy === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'stock-desc') {
          return Number(b.stock) - Number(a.stock);
        }
        // default name-asc
        return a.name.localeCompare(b.name);
      });
  }, [
    products,
    searchQuery,
    selectedBrandFilter,
    selectedCategoryFilter,
    priceRange,
    inStockOnly,
    sortBy,
  ]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedBrandFilter,
    selectedCategoryFilter,
    priceRange,
    inStockOnly,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleResetFilters = () => {
    onSelectBrandFilter('all');
    onSelectCategoryFilter('all');
    setPriceRange('all');
    setInStockOnly(false);
    onSearchChange('');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedBrandFilter !== 'all' ||
    selectedCategoryFilter !== 'all' ||
    priceRange !== 'all' ||
    inStockOnly ||
    searchQuery.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Top search & sorting control banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari smartphone berdasarkan nama, seri, atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Right Controls: Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100"
          >
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="name-asc">Nama Produk (A-Z)</option>
              <option value="name-desc">Nama Produk (Z-A)</option>
              <option value="price-asc">Harga Termurah</option>
              <option value="price-desc">Harga Termahal</option>
              <option value="stock-desc">Stok Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar Filters (Desktop & Mobile Drawer) */}
        <aside
          className={`lg:block bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Filter Katalog</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Kategori Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kategori</h4>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'all', label: 'Semua Kategori' },
                { id: 'Smartphone', label: 'Smartphone' },
                { id: 'Aksesori', label: 'Aksesori & Perlengkapan' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategoryFilter(cat.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.label}</span>
                  {selectedCategoryFilter === cat.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Merek Brand Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Merek</h4>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 text-xs scrollbar-thin">
              <button
                onClick={() => onSelectBrandFilter('all')}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                  selectedBrandFilter === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Semua Merek</span>
                {selectedBrandFilter === 'all' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              {BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => onSelectBrandFilter(brand)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                    selectedBrandFilter.toLowerCase() === brand.toLowerCase()
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{brand}</span>
                  {selectedBrandFilter.toLowerCase() === brand.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rentang Harga Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rentang Harga</h4>
            <div className="flex flex-col gap-1 text-xs">
              {[
                { id: 'all', label: 'Semua Rentang Harga' },
                { id: 'under2m', label: 'Di bawah Rp2 juta' },
                { id: '2m-3m', label: 'Rp2 juta – Rp3 juta' },
                { id: '3m-5m', label: 'Rp3 juta – Rp5 juta' },
                { id: '5m-10m', label: 'Rp5 juta – Rp10 juta' },
                { id: 'above10m', label: 'Di atas Rp10 juta' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setPriceRange(tier.id as PriceRange)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                    priceRange === tier.id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{tier.label}</span>
                  {priceRange === tier.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ketersediaan Stok */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ketersediaan</h4>
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-medium">Hanya produk yang tersedia (Stok &gt; 0)</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area (3 Columns on desktop) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active Filter Pills Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan <span className="font-bold text-slate-900">{filteredProducts.length}</span> produk
              {selectedBrandFilter !== 'all' && (
                <span className="ml-1 text-blue-600 font-semibold">• Merek: {selectedBrandFilter}</span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-blue-600 hover:underline cursor-pointer font-semibold"
              >
                Hapus semua filter
              </button>
            )}
          </div>

          {/* Database Error State: CRITICAL RULE: "Jika database tidak dapat diakses, tampilkan pesan kesalahan yang jelas. Jangan mengganti data database dengan produk palsu." */}
          {dbError && (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base">Gagal Mengakses Database Supabase</h3>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Sistem tidak dapat mengambil data produk dari tabel{' '}
                    <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded">public.phone_products</code>.
                    Sesuai instruksi toko, data produk asli tidak akan diganti dengan data palsu.
                  </p>
                  <p className="text-xs text-amber-700 font-mono mt-1">{dbError}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onOpenDbStatus}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Panduan Setup & Salin SQL
                </button>
                <button
                  onClick={onRefreshDb}
                  className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Coba Hubungkan Lagi
                </button>
              </div>
            </div>
          )}

          {/* Skeleton Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full h-44 bg-slate-200 rounded-xl" />
                  <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                  <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-md w-1/2" />
                  <div className="h-6 bg-slate-200 rounded-md w-2/5 pt-2" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-8 bg-slate-200 rounded-xl" />
                    <div className="h-8 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !dbError && filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-slate-900 text-base">Produk Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500">
                  Tidak ada smartphone atau aksesori yang cocok dengan filter atau kata kunci pencarian Anda.
                </p>
              </div>
              <div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id || product.sku}
                  product={product}
                  onSelect={onSelectProduct}
                  onAskAI={onAskAI}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs font-bold">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
