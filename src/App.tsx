import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneProduct,
  fetchActivePhoneProducts,
  fetchProductBySku,
} from './lib/supabase';
import { STORE_CONFIG, formatRupiah } from './lib/config';
import { getCurrentUser, logoutUser, UserProfile } from './lib/auth';
import { Navbar, NavTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CatalogView } from './components/CatalogView';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ChatbotModal } from './components/ChatbotModal';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardView, AdminTab } from './components/AdminDashboardView';
import { CartModal, CartItem } from './components/CartModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import {
  Sparkles,
  Smartphone,
  ShieldCheck,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Database,
  AlertTriangle,
  RefreshCw,
  Shield,
  ShoppingBag,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [products, setProducts] = useState<PhoneProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Customer Cart & Orders State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('tokohpnovi_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Filters
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels
  const [selectedProduct, setSelectedProduct] = useState<PhoneProduct | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [isDbStatusOpen, setIsDbStatusOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check active user session on start
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('tokohpnovi_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Gagal menyimpan keranjang ke local storage:', e);
    }
  }, [cart]);

  // Fetch products from Supabase
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setDbError(null);

    const { data, error } = await fetchActivePhoneProducts();

    if (error) {
      setDbError(error);
      setProducts([]);
    } else if (data) {
      setProducts(data);
      setDbError(null);
    }
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Tab Navigation with presets
  const handleNavigate = (tab: NavTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'smartphones') {
      setSelectedCategoryFilter('Smartphone');
      setSelectedBrandFilter('all');
    } else if (tab === 'accessories') {
      setSelectedCategoryFilter('Aksesori');
      setSelectedBrandFilter('all');
    } else if (tab === 'catalog') {
      setSelectedCategoryFilter('all');
      setSelectedBrandFilter('all');
    }
  };

  // Quick brand select from Hero
  const handleSelectBrand = (brand: string) => {
    setSelectedBrandFilter(brand);
    setSelectedCategoryFilter('all');
    setCurrentTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select product with real-time SKU lookup from backend
  const handleSelectProduct = async (product: PhoneProduct) => {
    setSelectedProduct(product);
    if (product.sku) {
      const { data } = await fetchProductBySku(product.sku);
      if (data) {
        setSelectedProduct(data);
      }
    }
  };

  // Trigger AI assistant asking about a specific product
  const handleAskAIAboutProduct = (product: PhoneProduct) => {
    const prompt = `Halo Novi AI, saya tertarik dengan ${product.brand} ${product.name}. Bisakah tolong jelaskan ringkasan keunggulannya, harga resmi, dan ketersediaan stoknya saat ini di Toko HP Novi?`;
    setChatInitialPrompt(prompt);
    setIsChatOpen(true);
  };

  // Cart operations
  const handleAddToCart = (product: PhoneProduct) => {
    if (Number(product.stock) <= 0) {
      addToast('error', `Maaf, stok produk ${product.name} sedang habis.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    addToast('success', `${product.name} berhasil ditambahkan ke keranjang belanja.`);
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    addToast('info', 'Produk dihapus dari keranjang.');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Auth operations
  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    addToast(
      'success',
      `Selamat datang, ${user.fullName}! Berhasil masuk sebagai ${
        user.role === 'admin' ? 'Administrator' : 'Pelanggan'
      }.`
    );

    // If logging in as admin, redirect to admin dashboard
    if (user.role === 'admin') {
      setCurrentTab('admin');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentTab('home');
    addToast('info', 'Anda telah berhasil keluar dari akun (Logout).');
  };

  // Featured and newest products for home page
  const featuredProducts = products.slice(0, 4);
  const latestProducts = [...products]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 4);

  const isDbConnected = Boolean(!dbError && products.length > 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenChat={() => {
          setChatInitialPrompt(undefined);
          setIsChatOpen(true);
        }}
        onOpenDbStatus={() => setIsDbStatusOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDbConnected={isDbConnected}
        productCount={products.length}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onOpenCart={() => setIsCartModalOpen(true)}
        cartCount={totalCartCount}
        onOpenOrders={() => setIsOrdersModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ========================================================================= */}
        {/* A. ADMIN DASHBOARD & MANAGEMENT (Protected Route) */}
        {/* ========================================================================= */}
        {currentTab.startsWith('admin') && (
          <div className="animate-in fade-in duration-200">
            {currentUser?.role === 'admin' ? (
              <AdminDashboardView
                initialTab={
                  currentTab === 'admin_products'
                    ? 'products'
                    : currentTab === 'admin_categories'
                    ? 'categories'
                    : currentTab === 'admin_brands'
                    ? 'brands'
                    : currentTab === 'admin_stock'
                    ? 'stock'
                    : currentTab === 'admin_sql'
                    ? 'sql'
                    : 'overview'
                }
                onNavigateToCatalog={() => handleNavigate('catalog')}
              />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Akses Terbatas: Administrator</h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Halaman Dashboard dan Manajemen Stok Toko HP Novi memerlukan hak akses administrator. Silakan masuk menggunakan akun admin.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Masuk Sebagai Admin
                  </button>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="w-full py-2.5 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* B. BERANDA (HOME) */}
        {/* ========================================================================= */}
        {currentTab === 'home' && (
          <div className="space-y-14 animate-in fade-in duration-200">
            {/* Hero Section */}
            <HeroSection
              onShopNow={() => handleNavigate('catalog')}
              onOpenChat={() => {
                setChatInitialPrompt(undefined);
                setIsChatOpen(true);
              }}
              onSelectBrand={handleSelectBrand}
            />

            {/* Produk Unggulan Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Produk Unggulan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pilihan smartphone paling diminati dengan performa teruji
                  </p>
                </div>
                <button
                  onClick={() => handleNavigate('catalog')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Katalog Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoadingProducts && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse"
                    >
                      <div className="w-full h-44 bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                      <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                      <div className="h-6 bg-slate-200 rounded-md w-2/5" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingProducts && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featuredProducts.map((p) => (
                    <ProductCard
                      key={p.id || p.sku}
                      product={p}
                      onSelect={handleSelectProduct}
                      onAskAI={handleAskAIAboutProduct}
                    />
                  ))}
                </div>
              )}

              {/* Database Error Banner if Supabase connection fails */}
              {!isLoadingProducts && dbError && (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Database Supabase Belum Terhubung</h4>
                      <p className="text-xs text-amber-800">
                        {dbError} - Data produk tidak dapat ditampilkan tanpa koneksi database asli.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDbStatusOpen(true)}
                    className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    Buka Panduan Setup
                  </button>
                </div>
              )}
            </section>

            {/* Produk Terbaru Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Produk Terbaru
                  </h2>
                  <p className="text-xs text-slate-500">
                    Koleksi smartphone dan perlengkapan resmi terbaru yang baru tiba
                  </p>
                </div>
                <button
                  onClick={() => handleNavigate('catalog')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Semua Seri</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isLoadingProducts && products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {latestProducts.map((p) => (
                    <ProductCard
                      key={p.id || p.sku}
                      product={p}
                      onSelect={handleSelectProduct}
                      onAskAI={handleAskAIAboutProduct}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* C. KATALOG PRODUK / SMARTPHONE / AKSESORI */}
        {/* ========================================================================= */}
        {(currentTab === 'catalog' ||
          currentTab === 'smartphones' ||
          currentTab === 'accessories') && (
          <div className="animate-in fade-in duration-200">
            <CatalogView
              products={products}
              isLoading={isLoadingProducts}
              dbError={dbError}
              onRefreshDb={loadProducts}
              onOpenDbStatus={() => setIsDbStatusOpen(true)}
              onSelectProduct={handleSelectProduct}
              onAskAI={handleAskAIAboutProduct}
              selectedBrandFilter={selectedBrandFilter}
              onSelectBrandFilter={setSelectedBrandFilter}
              selectedCategoryFilter={selectedCategoryFilter}
              onSelectCategoryFilter={setSelectedCategoryFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* D. TENTANG KAMI */}
        {/* ========================================================================= */}
        {currentTab === 'about' && (
          <div className="animate-in fade-in duration-200">
            <AboutPage
              onOpenChat={() => {
                setChatInitialPrompt(undefined);
                setIsChatOpen(true);
              }}
              onNavigateContact={() => handleNavigate('contact')}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* E. KONTAK */}
        {/* ========================================================================= */}
        {currentTab === 'contact' && (
          <div className="animate-in fade-in duration-200">
            <ContactPage
              onOpenChat={() => {
                setChatInitialPrompt(undefined);
                setIsChatOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Floating Novi AI Assistant Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            setChatInitialPrompt(undefined);
            setIsChatOpen(true);
          }}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold text-sm shadow-xl shadow-blue-600/35 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-400/40"
        >
          <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden sm:inline">Tanya Novi AI</span>
          <span className="sm:hidden">AI</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
        </button>
      </div>

      {/* Modals & Dialogs */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAskAI={handleAskAIAboutProduct}
        onAddToCart={handleAddToCart}
      />

      <ChatbotModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        products={products}
        isDbConnected={isDbConnected}
        dbError={dbError}
        initialPrompt={chatInitialPrompt}
        onSelectProduct={handleSelectProduct}
      />

      <DatabaseStatusModal
        isOpen={isDbStatusOpen}
        onClose={() => setIsDbStatusOpen(false)}
        isDbConnected={isDbConnected}
        dbError={dbError}
        productCount={products.length}
        onRefresh={loadProducts}
      />

      {/* Supabase Authentication Modal (Login & Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Shopping Cart Modal */}
      <CartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onOrderCreated={(newOrder) => {
          addToast('success', `Pesanan #${newOrder.order_number} berhasil dibuat!`);
        }}
      />

      {/* Customer Orders History Modal */}
      <CustomerOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAdminDashboard={() => handleNavigate('admin')}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Footer */}
      <footer className="mt-16 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand & Slogan */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-black text-lg tracking-tight">
                    Toko HP <span className="text-blue-400">Novi</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {STORE_CONFIG.slogan}
              </p>
              <p className="text-xs text-slate-500">
                Pusat belanja smartphone dan aksesori resmi bergaransi dengan layanan konsultasi pintar Novi AI Assistant.
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Navigasi Cepat
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Beranda
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('catalog')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Katalog Semua Produk
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('smartphones')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Smartphone Resmi
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('accessories')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Aksesori & Charger
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('about')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Tentang Kami
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('contact')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Kontak Toko
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Merek Populer */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Merek Populer
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {['Samsung', 'Apple', 'Xiaomi', 'POCO', 'OPPO', 'vivo'].map((brand) => (
                  <li key={brand}>
                    <button
                      onClick={() => handleSelectBrand(brand)}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      {brand} Official
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Informasi Kontak & Jam Toko */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                Kontak & Lokasi
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{STORE_CONFIG.address.street}, {STORE_CONFIG.address.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 font-semibold text-slate-300"
                  >
                    {STORE_CONFIG.whatsappFormatted}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{STORE_CONFIG.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{STORE_CONFIG.operationalHours.weekday}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} {STORE_CONFIG.brandName}. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDbStatusOpen(true)}
                className="hover:text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Supabase PostgreSQL Integration</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
