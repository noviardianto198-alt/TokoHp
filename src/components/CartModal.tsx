import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  MapPin,
  User,
  AlertCircle,
} from 'lucide-react';
import { PhoneProduct } from '../lib/supabase';
import { formatRupiah, STORE_CONFIG } from '../lib/config';
import { UserProfile } from '../lib/auth';

export interface CartItem {
  product: PhoneProduct;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentUser: UserProfile | null;
  onOrderCreated: (order: any) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onOrderCreated,
}) => {
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Keranjang belanja Anda masih kosong.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Nama lengkap penerima wajib diisi.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Nomor WhatsApp / telepon aktif wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id,
        sku: i.product.sku,
        name: i.product.name,
        brand: i.product.brand,
        price: i.product.price,
        quantity: i.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: currentUser?.email || '',
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || 'Ambil langsung di Toko HP Novi',
          items: itemsPayload,
          totalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pesanan.');
      }

      // Pre-fill WhatsApp confirmation message
      const itemsText = cart
        .map((i) => `- ${i.product.brand} ${i.product.name} (${i.quantity}x) = ${formatRupiah(Number(i.product.price) * i.quantity)}`)
        .join('\n');

      const waMsg = encodeURIComponent(
        `Halo Admin Toko HP Novi,\n\nSaya telah membuat pesanan baru:\n*Nomor Pesanan:* ${data.data.order_number}\n*Nama Pemesan:* ${customerName}\n*No. HP:* ${customerPhone}\n*Alamat:* ${customerAddress || 'Ambil di Toko'}\n\n*Daftar Produk:*\n${itemsText}\n\n*Total Tagihan:* ${formatRupiah(totalAmount)}\n\nMohon konfirmasi ketersediaan dan metode pembayaran. Terima kasih!`
      );

      onClearCart();
      onOrderCreated(data.data);
      onClose();

      // Open WhatsApp chat in background
      window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${waMsg}`, '_blank');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal checkout pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Keranjang Belanja</h2>
              <p className="text-[11px] text-blue-100">{cart.length} item smartphone & aksesori</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Keranjang Belanja Kosong</p>
              <p className="text-xs text-slate-400 mt-1">Pilih smartphone atau aksesori favorit Anda dari katalog.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Items List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {cart.map((item) => (
                  <div key={item.product.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 block line-clamp-1">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] text-blue-600 font-bold block">
                        {formatRupiah(item.product.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        SKU: {item.product.sku}
                      </span>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1 text-slate-400 hover:text-red-600 ml-1 cursor-pointer"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Total Pembayaran:</span>
                <span className="text-lg font-black text-blue-600">{formatRupiah(totalAmount)}</span>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Informasi Pemesan & Pengiriman
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Penerima <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 08123456789"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alamat Pengiriman
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <textarea
                      rows={2}
                      placeholder="Alamat lengkap tujuan kirim atau tulis 'Ambil Langsung di Toko HP Novi'"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses Pesanan...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      <span>Konfirmasi & Kirim Pesanan via WhatsApp</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
