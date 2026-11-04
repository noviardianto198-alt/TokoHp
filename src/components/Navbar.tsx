import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Search,
  Menu,
  X,
  Database,
  PhoneCall,
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Layers,
  RotateCcw,
  Tag,
  Settings,
  Shield,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { STORE_CONFIG } from '../lib/config';
import { UserProfile } from '../lib/auth';

export type NavTab =
  | 'home'
  | 'catalog'
  | 'smartphones'
  | 'accessories'
  | 'about'
  | 'contact'
  | 'admin'
  | 'admin_products'
  | 'admin_categories'
  | 'admin_brands'
  | 'admin_stock'
  | 'admin_sql';

interface NavbarProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenChat: () => void;
  onOpenDbStatus: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDbConnected: boolean;
  productCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenOrders: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenChat,
  onOpenDbStatus,
  searchQuery,
  onSearchChange,
  isDbConnected,
  productCount,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenCart,
  cartCount,
  onOpenOrders,
  onOpenProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'admin';

  const handleNavClick = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      {/* Top micro bar for slogan, database status & contact */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-400">{STORE_CONFIG.brandName}</span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">{STORE_CONFIG.slogan}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Database status indicator button */}
            <button
              onClick={onOpenDbStatus}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Periksa Koneksi Database Supabase"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Supabase:{' '}
                {isDbConnected ? (
                  <span className="text-emerald-400 font-semibold">Aktif ({productCount})</span>
                ) : (
                  <span className="text-amber-400 font-semibold">Periksa Status</span>
                )}
              </span>
            </button>

            <span className="text-slate-700 hidden md:inline">|</span>

            <a
              href={`https://wa.me/${STORE_CONFIG.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>{STORE_CONFIG.whatsappFormatted}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick(isAdmin ? 'admin' : 'home')}
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-slate-900 block leading-tight">
                Toko HP <span className="text-blue-600">Novi</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight block">
                {isAdmin ? 'Dashboard Manajemen Admin' : 'Solusi Kebutuhan Smartphone'}
              </span>
            </div>
          </div>

          {/* Center Search Bar (Desktop) - show in public/customer view */}
          {!isAdmin && (
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari smartphone, spesifikasi, atau aksesori..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    if (currentTab !== 'catalog' && currentTab !== 'smartphones' && currentTab !== 'accessories') {
                      onNavigate('catalog');
                    }
                  }}
                  className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-full border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation Links based on User Role */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-bold text-slate-700">
            {/* If NOT LOGGED IN or LOGGED IN AS CUSTOMER */}
            {!isAdmin ? (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    currentTab === 'home' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  Beranda
                </button>
                <button
                  onClick={() => handleNavClick('catalog')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    currentTab === 'catalog' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  Produk
                </button>

                {currentUser && (
                  <button
                    onClick={onOpenOrders}
                    className="px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Pesanan Saya
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('about')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    currentTab === 'about' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  Tentang Kami
                </button>
                <button
                  onClick={() => handleNavClick('contact')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                    currentTab === 'contact' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  Kontak
                </button>
              </>
            ) : (
              /* If LOGGED IN AS ADMIN */
              <>
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard Admin</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin_products')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_products' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Produk</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin_categories')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_categories' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kategori</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin_brands')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_brands' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Merek</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin_stock')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_stock' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Manajemen Stok</span>
                </button>
                <button
                  onClick={() => handleNavClick('admin_sql')}
                  className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    currentTab === 'admin_sql' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Pengaturan</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Cart Button (Always accessible for customer orders) */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* AI Assistant Chat Trigger */}
            <button
              onClick={onOpenChat}
              className="relative group inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Novi AI</span>
            </button>

            {/* AUTH BUTTONS SECTION */}
            {!currentUser ? (
              /* A. Menu Pengguna Belum Login: Tampilkan Login dan Daftar */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Daftar</span>
                </button>
              </div>
            ) : (
              /* D. Menu Setelah Login (Pelanggan / Admin) */
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenProfile}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Profil Akun"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[90px] truncate hidden md:inline">
                    {currentUser.fullName}
                  </span>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                      Admin
                    </span>
                  )}
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Keluar (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {!isAdmin && (
          <div className="lg:hidden pb-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari smartphone atau aksesori..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  if (currentTab !== 'catalog' && currentTab !== 'smartphones' && currentTab !== 'accessories') {
                    onNavigate('catalog');
                  }
                }}
                className="w-full bg-slate-100 text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-1.5 animate-in slide-in-from-top-4 duration-200">
          {!isAdmin ? (
            <>
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'home' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Beranda
              </button>
              <button
                onClick={() => handleNavClick('catalog')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'catalog' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Semua Produk
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    onOpenOrders();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Pesanan Saya
                </button>
              )}

              <button
                onClick={() => handleNavClick('about')}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700"
              >
                Tentang Kami
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700"
              >
                Kontak
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Dashboard Admin
              </button>
              <button
                onClick={() => handleNavClick('admin_products')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin_products' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Manajemen Produk
              </button>
              <button
                onClick={() => handleNavClick('admin_categories')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin_categories' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Kategori
              </button>
              <button
                onClick={() => handleNavClick('admin_brands')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin_brands' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Merek
              </button>
              <button
                onClick={() => handleNavClick('admin_stock')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin_stock' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Manajemen Stok
              </button>
              <button
                onClick={() => handleNavClick('admin_sql')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold ${
                  currentTab === 'admin_sql' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-700'
                }`}
              >
                Pengaturan & Skrip SQL
              </button>
            </>
          )}

          {/* Mobile Auth actions */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold text-blue-600 border border-blue-600 rounded-xl"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 text-center text-xs font-bold text-white bg-slate-900 rounded-xl"
                >
                  Daftar
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onOpenProfile();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-800 rounded-xl hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Profil: {currentUser.fullName}</span>
                  <span className="text-[10px] text-blue-600 uppercase font-black">
                    {currentUser.role}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 rounded-xl hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
