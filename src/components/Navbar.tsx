import React, { useState } from 'react';
import {
  Smartphone,
  Sparkles,
  Search,
  Menu,
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  ShoppingBag,
} from 'lucide-react';
import { STORE_CONFIG } from '../lib/config';

export type NavTab = 'home' | 'catalog' | 'smartphones' | 'accessories' | 'about' | 'contact';

interface NavbarProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onOpenChat: () => void;
  onOpenDbStatus: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDbConnected: boolean;
  productCount: number;
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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      {/* Top micro bar for slogan & contact */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-400">{STORE_CONFIG.brandName}</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
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
                  <span className="text-amber-400 font-semibold">Perlu Konfigurasi</span>
                )}
              </span>
            </button>

            <span className="text-slate-600 hidden md:inline">|</span>

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
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
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
                Solusi Kebutuhan Smartphone
              </span>
            </div>
          </div>

          {/* Center Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari merk, tipe smartphone, atau aksesori..."
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

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-bold text-slate-700">
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
              Semua Produk
            </button>
            <button
              onClick={() => handleNavClick('smartphones')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                currentTab === 'smartphones' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
              }`}
            >
              Smartphone
            </button>
            <button
              onClick={() => handleNavClick('accessories')}
              className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                currentTab === 'accessories' ? 'text-blue-600 bg-blue-50' : 'hover:bg-slate-100'
              }`}
            >
              Aksesori
            </button>
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
          </nav>

          {/* AI Assistant CTA Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChat}
              className="relative group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform duration-300" />
              <span>Novi AI Assistant</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

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

        {/* Mobile Search Input */}
        <div className="lg:hidden pb-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari merk atau tipe smartphone..."
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
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 animate-in slide-in-from-top-4 duration-200">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'home' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Beranda
          </button>
          <button
            onClick={() => handleNavClick('catalog')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'catalog' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Semua Produk
          </button>
          <button
            onClick={() => handleNavClick('smartphones')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'smartphones' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Smartphone
          </button>
          <button
            onClick={() => handleNavClick('accessories')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'accessories' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Aksesori
          </button>
          <button
            onClick={() => handleNavClick('about')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'about' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Tentang Kami
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold ${
              currentTab === 'contact' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
            }`}
          >
            Kontak
          </button>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenDbStatus();
                setMobileMenuOpen(false);
              }}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1.5"
            >
              <Database className="w-4 h-4" />
              <span>Status Supabase PostgreSQL</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
