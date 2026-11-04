import React from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../lib/auth';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAdminDashboard?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenAdminDashboard,
}) => {
  if (!isOpen || !currentUser) return null;

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg font-bold">{currentUser.fullName}</h2>
          <p className="text-xs text-blue-100">{currentUser.email}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Hak Akses Akun:</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isAdmin ? 'Administrator Toko' : 'Pelanggan'}
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Terverifikasi:</span>
              </span>
              <span className="font-semibold text-slate-800">{currentUser.email}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Status Akun:</span>
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif Terhubung</span>
              </span>
            </div>
          </div>

          {isAdmin && onOpenAdminDashboard && (
            <button
              onClick={() => {
                onClose();
                onOpenAdminDashboard();
              }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Buka Dashboard Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
