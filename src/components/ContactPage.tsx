import React, { useState } from 'react';
import { STORE_CONFIG, getWhatsAppGeneralUrl } from '../lib/config';
import {
  PhoneCall,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface ContactPageProps {
  onOpenChat: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onOpenChat }) => {
  const [customerName, setCustomerName] = useState('');
  const [inquiryType, setInquiryType] = useState('Pertanyaan Produk & Stok');
  const [message, setMessage] = useState('');

  const handleSendWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = STORE_CONFIG.whatsappNumber.replace(/[^0-9]/g, '');
    const fullText = `Halo Toko HP Novi, perkenalkan saya ${customerName || 'Pelanggan'}.\nKategori: ${inquiryType}\nPesan: ${message || 'Saya ingin konsultasi seputar pembelian smartphone.'}`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
          <span>Hubungi Kami</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Kontak Resmi Toko HP Novi
        </h1>
        <p className="text-sm text-slate-600">
          Ada pertanyaan mengenai spesifikasi produk, ketersediaan stok, atau garansi? Tim kami dan Novi AI siap membantu Anda dengan senang hati.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards (Left) */}
        <div className="lg:col-span-1 space-y-4">
          {/* WhatsApp Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp</h4>
                <p className="text-base font-extrabold text-slate-900">{STORE_CONFIG.whatsappFormatted}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Respon cepat untuk pemesanan, ketersediaan stok, dan klaim garansi.
            </p>
            <a
              href={getWhatsAppGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp Langsung</span>
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</h4>
                <p className="text-sm font-bold text-slate-900">{STORE_CONFIG.email}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Untuk kerja sama bisnis, pengadaan kantor, atau feedback layanan.
            </p>
          </div>

          {/* Alamat Toko */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Toko</h4>
                <p className="text-sm font-bold text-slate-900">
                  {STORE_CONFIG.address.street}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              {STORE_CONFIG.address.city}, {STORE_CONFIG.address.province} {STORE_CONFIG.address.postalCode}, {STORE_CONFIG.address.country}
            </p>
          </div>

          {/* Jam Operasional */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jam Operasional</h4>
                <p className="text-xs font-bold text-slate-800">{STORE_CONFIG.operationalHours.weekday}</p>
                <p className="text-xs text-slate-600">{STORE_CONFIG.operationalHours.weekend}</p>
              </div>
            </div>
            <p className="text-[11px] text-blue-600 font-medium pt-1">
              {STORE_CONFIG.operationalHours.note}
            </p>
          </div>
        </div>

        {/* Interactive Contact & WhatsApp Form (Right) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Kirim Pesan ke Toko</h3>
                <p className="text-xs text-slate-500">
                  Formulir ini akan otomatis menyiapkan pesan WhatsApp untuk dikirim ke admin toko kami.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenChat}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Atau Tanya Novi AI</span>
              </button>
            </div>

            <form onSubmit={handleSendWhatsapp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Topik Pertanyaan</label>
                <select
                  value={inquiryType}
                  onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="Pertanyaan Produk & Stok">Pertanyaan Produk & Stok</option>
                  <option value="Pemesanan Unit Baru">Pemesanan Unit Baru</option>
                  <option value="Klaim Garansi & Servis">Klaim Garansi & Servis</option>
                  <option value="Aksesori & Perlengkapan">Aksesori & Perlengkapan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detail Pesan</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan produk yang Anda cari atau pertanyaan seputar pembelian..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesan via WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
