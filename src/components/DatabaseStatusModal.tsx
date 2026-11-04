import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Server,
  Terminal,
} from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../lib/schema-sql';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDbConnected: boolean;
  dbError: string | null;
  productCount: number;
  onRefresh: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  isDbConnected,
  dbError,
  productCount,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Status Database Supabase</h3>
              <p className="text-xs text-slate-400">
                Toko HP Novi • Backend Server Supabase PostgreSQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status Alert Banner */}
          {isDbConnected ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-emerald-900">Database Berhasil Terhubung!</h4>
                <p className="text-emerald-700 text-xs leading-relaxed">
                  Server backend berhasil terhubung ke database Supabase Anda melalui kredensial{' '}
                  <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">SUPABASE_URL</code> dan{' '}
                  <code className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code>.
                </p>
                <div className="pt-1 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    Tabel <code className="font-mono">public.phone_products</code> aktif dengan {productCount} produk.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900">Database Belum Dapat Diakses</h4>
                <p className="text-amber-800 text-xs leading-relaxed">
                  {dbError ||
                    'Server belum dapat mengakses tabel public.phone_products. Pastikan secrets SUPABASE_URL dan SUPABASE_ANON_KEY sudah tersimpan di Google AI Studio, dan tabel phone_products sudah dibuat di Supabase.'}
                </p>
              </div>
            </div>
          )}

          {/* Server Integration Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Arsitektur Akses Database Aman (Server-Side)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Endpoint Katalog</span>
                <code className="font-bold text-blue-700 text-xs">GET /api/products</code>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Endpoint Pencarian</span>
                <code className="font-bold text-blue-700 text-xs">GET /api/products/search</code>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Endpoint Detail SKU</span>
                <code className="font-bold text-blue-700 text-xs">GET /api/products/sku/:sku</code>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">AI Assistant Context</span>
                <code className="font-bold text-blue-700 text-xs">POST /api/chat (RAG)</code>
              </div>
            </div>
          </div>

          {/* Quick Setup Instructions & SQL Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Skrip SQL Otomatis (Tabel + RLS + 23 Produk Resmi)</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-slate-900 text-slate-200 text-[11px] rounded-xl overflow-x-auto max-h-40 font-mono leading-tight">
                {SUPABASE_SETUP_SQL.slice(0, 480)}...
              </pre>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jika tabel belum ada, buka dashboard Supabase Anda di tab <strong>SQL Editor</strong>,
              tempelkan skrip di atas, lalu klik <strong>Run</strong> untuk menginisialisasi tabel
              dan data resmi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Cek Ulang Koneksi</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
