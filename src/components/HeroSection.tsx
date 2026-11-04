import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgePercent,
  Truck,
  Headphones,
  CheckCircle2,
  Smartphone,
  Cpu,
  Layers,
} from 'lucide-react';
import { STORE_CONFIG } from '../lib/config';

interface HeroSectionProps {
  onShopNow: () => void;
  onOpenChat: () => void;
  onSelectBrand: (brand: string) => void;
}

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

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopNow,
  onOpenChat,
  onSelectBrand,
}) => {
  return (
    <div className="space-y-12">
      {/* Main Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 border border-slate-800 shadow-2xl">
        {/* Decorative lighting & glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Katalog Resmi Toko HP Novi • Garansi Resmi 100%</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
            Temukan Smartphone <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">Impianmu</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
            Pilihan smartphone terbaik dari berbagai merek dengan harga kompetitif dan pelayanan terpercaya.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onShopNow}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <span>Belanja Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-sm border border-white/20 transition-all backdrop-blur-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Tanya AI Assistant</span>
            </button>
          </div>

          {/* Micro trust indicators */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Unit Original</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garansi Resmi Indonesia</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Konsultasi AI & CS Ramah</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Categories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Kategori Merek</h2>
            <p className="text-xs text-slate-500">Pilih merek favorit untuk menyaring katalog produk</p>
          </div>
          <button
            onClick={() => onSelectBrand('all')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Lihat Semua Merek →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className="group p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {brand}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 flex items-center justify-between shadow-md">
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Promo Spesial Minggu Ini
            </span>
            <h3 className="text-xl sm:text-2xl font-black">Diskon Paket Aksesori 15%</h3>
            <p className="text-xs text-blue-100 max-w-xs">
              Dapatkan charger fast charging 65W & kabel braided dengan harga bundling setiap pembelian smartphone.
            </p>
            <div className="pt-2">
              <button
                onClick={onShopNow}
                className="px-4 py-2 bg-white text-blue-900 font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Cek Promo Sekarang
              </button>
            </div>
          </div>
          <BadgePercent className="w-24 h-24 text-white/10 shrink-0 hidden sm:block" />
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 sm:p-8 flex items-center justify-between shadow-md border border-slate-800">
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Fitur AI Cerdas
            </span>
            <h3 className="text-xl sm:text-2xl font-black">Bingung Pilih HP?</h3>
            <p className="text-xs text-slate-300 max-w-xs">
              Tanyakan budget dan kebutuhan Anda ke Novi AI Assistant untuk rekomendasi terbaik secara instan.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenChat}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Mulai Konsultasi AI
              </button>
            </div>
          </div>
          <Sparkles className="w-24 h-24 text-white/10 shrink-0 hidden sm:block" />
        </div>
      </section>

      {/* Keunggulan Toko Section */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Keunggulan Toko HP Novi</h2>
          <p className="text-xs text-slate-500">
            Komitmen kami untuk memberikan pengalaman berbelanja gadget terbaik dan terpercaya
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">100% Produk Original</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Seluruh smartphone dan aksesori dijamin 100% orisinal dengan garansi resmi produsen di Indonesia.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BadgePercent className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Harga Kompetitif</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Harga bersaing dan transparan dengan berbagai penawaran promo menarik dan bonus spesial.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Novi AI Assistant</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dukungan AI pintar untuk rekomendasi spesifikasi, cek harga, dan ketersediaan stok secara real-time.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Pelayanan Ramah & Cepat</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Customer service responsif via WhatsApp siap membantu pertanyaan teknis maupun pemesanan unit Anda.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
