import React from 'react';
import { STORE_CONFIG } from '../lib/config';
import {
  Smartphone,
  ShieldCheck,
  Target,
  Compass,
  CheckCircle2,
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';

interface AboutPageProps {
  onOpenChat: () => void;
  onNavigateContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenChat, onNavigateContact }) => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-2">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Profil Perusahaan</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Tentang Toko HP Novi
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Toko HP Novi merupakan toko yang menyediakan berbagai pilihan smartphone dan aksesori dari berbagai merek. Kami berkomitmen memberikan informasi produk yang jelas, harga yang kompetitif, dan pelayanan terbaik kepada pelanggan.
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visi */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Visi Kami</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Menjadi destinasi ritel smartphone dan ekosistem gadget nomor satu yang paling terpercaya, transparan, dan inovatif di Indonesia dengan mengedepankan kepuasan serta kenyamanan setiap pelanggan.
          </p>
        </div>

        {/* Misi */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Misi Kami</h3>
          <ul className="text-sm text-slate-600 space-y-2.5">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Menyediakan produk smartphone dan aksesori 100% orisinal dengan garansi resmi produsen.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Menyajikan informasi spesifikasi, transparansi harga, dan status stok yang akurat.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>Memberikan pelayanan konsultasi pintar berbasis AI serta layanan purna jual yang sigap.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Keunggulan Toko */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Keunggulan Toko HP Novi</h2>
          <p className="text-xs text-slate-400">
            Mengapa ribuan pelanggan mempercayakan kebutuhan smartphone mereka kepada kami
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2.5 backdrop-blur-xs">
            <Award className="w-6 h-6 text-amber-400" />
            <h4 className="font-bold text-base text-white">Garansi Resmi Terjamin</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Semua unit bergaransi resmi Indonesia (TAM, SEIN, iBox, Xiaomi Indonesia, dll.) sehingga klaim garansi sangat mudah.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2.5 backdrop-blur-xs">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <h4 className="font-bold text-base text-white">Didukung Novi AI Assistant</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Asisten AI terlatih membantu pelanggan memilih HP sesuai budget, kebutuhan gaming, atau kamera tanpa bias.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2.5 backdrop-blur-xs">
            <Users className="w-6 h-6 text-emerald-400" />
            <h4 className="font-bold text-base text-white">Pelayanan Personal</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tim support yang ramah dan siap memandu proses pemindahan data, unboxing, maupun penjelasan fitur smartphone baru Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Informasi Kontak */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Informasi Kontak & Layanan</h3>
            <p className="text-xs text-slate-500">Hubungi kami secara langsung untuk pemesanan atau konsultasi</p>
          </div>
          <button
            onClick={onNavigateContact}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Buka Halaman Kontak Lengkap →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp</span>
            </div>
            <p className="text-slate-800 font-semibold">{STORE_CONFIG.whatsappFormatted}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Mail className="w-4 h-4" />
              <span>Email Resmi</span>
            </div>
            <p className="text-slate-800 font-semibold">{STORE_CONFIG.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <MapPin className="w-4 h-4" />
              <span>Alamat Toko</span>
            </div>
            <p className="text-slate-800 font-medium leading-snug">
              {STORE_CONFIG.address.street}, {STORE_CONFIG.address.city}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Clock className="w-4 h-4" />
              <span>Jam Operasional</span>
            </div>
            <p className="text-slate-800 font-medium leading-snug">
              {STORE_CONFIG.operationalHours.weekday}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
