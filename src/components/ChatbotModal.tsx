import React, { useState, useRef, useEffect } from 'react';
import { PhoneProduct } from '../lib/supabase';
import { formatRupiah, getWhatsAppProductUrl } from '../lib/config';
import { ProductPlaceholder } from './ProductPlaceholder';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Info,
  MessageCircle,
  Cpu,
  HardDrive,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  matchedProducts?: PhoneProduct[];
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: PhoneProduct[];
  isDbConnected: boolean;
  dbError: string | null;
  initialPrompt?: string;
  onSelectProduct?: (product: PhoneProduct) => void;
}

const QUICK_PROMPTS = [
  'Cari HP murah',
  'HP untuk gaming',
  'HP untuk fotografi',
  'HP di bawah Rp3 juta',
  'Cek stok produk',
];

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  isOpen,
  onClose,
  products,
  isDbConnected,
  dbError,
  initialPrompt,
  onSelectProduct,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Halo! Saya Novi AI Assistant, asisten resmi Toko HP Novi. Ada yang bisa saya bantu hari ini? Anda dapat bertanya harga, cek stok, rekomendasi HP gaming/fotografi, atau membandingkan smartphone dari katalog resmi kami.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Handle external initial prompt (e.g. from "Tanya AI tentang produk ini")
  useEffect(() => {
    if (initialPrompt && isOpen) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage(null);

    // If database is not connected and we have no products
    if (!isDbConnected || products.length === 0) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            content: `Mohon maaf, saat ini sistem belum dapat terhubung ke database produk Supabase (${
              dbError || 'koneksi belum siap'
            }). Sebagai asisten resmi, saya hanya boleh memberikan informasi harga, stok, dan spesifikasi yang valid dari database. Mohon pastikan database Supabase sudah aktif.`,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          clientProducts: products,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses jawaban dari AI server.');
      }

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date(),
        matchedProducts: data.matchedProducts || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Terjadi gangguan jaringan.');
      setMessages((prev) => [
        ...prev,
        {
          id: `model-err-${Date.now()}`,
          role: 'model',
          content:
            'Maaf, terjadi gangguan saat menghubungkan ke Novi AI Assistant. Silakan coba kembali sesaat lagi.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content:
          'Riwayat percakapan telah dibersihkan. Silakan tanyakan informasi seputar produk Toko HP Novi!',
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-lg h-[90vh] sm:h-[650px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-blue-300 shadow-inner">
              <Bot className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">Novi AI Assistant</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Solusi kebutuhan smartphone Anda • Data Real Database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearChat}
              title="Bersihkan Percakapan"
              className="p-2 text-blue-200 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup"
              className="p-2 text-blue-200 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Grounding Status Badge */}
        <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600">
            {isDbConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terhubung ke {products.length} produk katalog aktif</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800 font-medium">Database belum terhubung</span>
              </>
            )}
          </div>
          <span className="text-slate-400 text-[10px]">Model: Gemini 3.8 Flash</span>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900 text-blue-200'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="max-w-[85%] space-y-2">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs whitespace-pre-line'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Render interactive product cards if returned from database */}
                {msg.role === 'model' && msg.matchedProducts && msg.matchedProducts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
                    {msg.matchedProducts.map((p) => {
                      const isOutOfStock = Number(p.stock) <= 0;
                      const waUrl = getWhatsAppProductUrl(p.name, p.sku);

                      return (
                        <div
                          key={p.id || p.sku}
                          className="bg-white rounded-xl border border-blue-200/80 p-2.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-blue-600 uppercase tracking-wider">{p.brand}</span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full font-semibold ${
                                  isOutOfStock ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {isOutOfStock ? 'Habis' : `Stok: ${p.stock}`}
                              </span>
                            </div>

                            <h5 className="font-bold text-xs text-slate-900 line-clamp-1" title={p.name}>
                              {p.name}
                            </h5>

                            {p.ram_gb && p.storage_gb && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                <span>{p.ram_gb}/{p.storage_gb}GB</span>
                                <span>•</span>
                                <span>{p.color || 'Resmi'}</span>
                              </div>
                            )}

                            <div className="text-xs font-black text-blue-900">
                              {formatRupiah(p.price)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-2 mt-1 border-t border-slate-100">
                            {onSelectProduct && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectProduct(p);
                                  onClose();
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold text-center cursor-pointer transition-colors"
                              >
                                Detail
                              </button>
                            )}
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1"
                            >
                              <MessageCircle className="w-2.5 h-2.5" />
                              <span>Pesan</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-900 text-blue-200 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Novi AI sedang memeriksa katalog database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Pills */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Pertanyaan Cepat:</div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((promptText, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(promptText)}
                disabled={isLoading}
                className="shrink-0 text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanyakan harga, spesifikasi, atau rekomendasi..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            aria-label="Kirim Pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
