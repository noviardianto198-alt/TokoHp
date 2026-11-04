import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah, STORE_CONFIG } from '../lib/config';
import { UserProfile } from '../lib/auth';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const url = currentUser?.email
        ? `/api/orders?email=${encodeURIComponent(currentUser.email)}`
        : '/api/orders';
      fetch(url)
        .then((r) => r.json())
        .then((res) => {
          if (res?.data) {
            setOrders(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Riwayat Pesanan Saya</h2>
              <p className="text-[11px] text-blue-100">
                {currentUser?.fullName || 'Pelanggan'} • {currentUser?.email}
              </p>
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
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Memuat pesanan Anda...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Pesanan</p>
              <p className="text-xs text-slate-400 mt-1">
                Pesanan yang Anda buat akan tercatat di sini beserta status prosesnya.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-mono">
                      #{ord.order_number}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(ord.created_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      ord.status === 'selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'dikirim'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {ord.status === 'menunggu_konfirmasi'
                      ? 'Menunggu Konfirmasi'
                      : ord.status === 'diproses'
                      ? 'Diproses Toko'
                      : ord.status === 'dikirim'
                      ? 'Sedang Dikirim'
                      : ord.status === 'selesai'
                      ? 'Selesai'
                      : ord.status}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-slate-200/60 text-xs">
                  {ord.items?.map((item: any, idx: number) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-800 font-medium">
                        {item.name} <span className="text-slate-500">({item.quantity}x)</span>
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Total Tagihan:</span>
                  <span className="text-sm font-black text-blue-600">
                    {formatRupiah(ord.total_amount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
