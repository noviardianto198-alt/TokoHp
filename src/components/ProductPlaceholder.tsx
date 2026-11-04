import React from 'react';
import { Smartphone, Headphones, ShieldCheck, Cpu } from 'lucide-react';

interface ProductPlaceholderProps {
  category?: string;
  brand: string;
  name: string;
  color?: string | null;
  ram?: number | null;
  storage?: number | null;
}

export const ProductPlaceholder: React.FC<ProductPlaceholderProps> = ({
  category = 'Smartphone',
  brand,
  color,
  ram,
  storage,
}) => {
  const isAccessory = category.toLowerCase().includes('aksesori') || category.toLowerCase().includes('charger');

  return (
    <div className="relative w-full h-48 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200/80 rounded-t-xl flex flex-col items-center justify-center p-4 overflow-hidden group-hover:from-blue-50 group-hover:to-slate-100 transition-colors duration-300">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Brand Watermark Badge */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase text-slate-700 shadow-xs border border-slate-200/60">
        {brand}
      </div>

      {/* RAM / ROM Badge if available */}
      {ram && storage && (
        <div className="absolute top-3 right-3 bg-blue-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>{ram}/{storage}GB</span>
        </div>
      )}

      {/* Device Silhouette Graphic */}
      <div className="relative flex flex-col items-center justify-center">
        {isAccessory ? (
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-slate-200/80 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform duration-300">
            <Headphones className="w-10 h-10" />
          </div>
        ) : (
          <div className="relative w-24 h-36 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 p-1.5 shadow-lg border border-slate-700/60 group-hover:scale-105 transition-transform duration-300">
            {/* Screen bezel */}
            <div className="w-full h-full rounded-[12px] bg-slate-950 flex flex-col items-center justify-between p-2 relative overflow-hidden">
              {/* Dynamic camera punch-hole */}
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />

              {/* Center brand logo accent */}
              <div className="flex flex-col items-center opacity-70">
                <Smartphone className="w-6 h-6 text-blue-400 stroke-[1.5]" />
                <span className="text-[8px] text-slate-400 font-medium tracking-wider mt-1 uppercase">
                  {brand}
                </span>
              </div>

              {/* Bottom bar indicator */}
              <div className="w-8 h-1 rounded-full bg-slate-800" />
            </div>
          </div>
        )}
      </div>

      {/* Color tag if present */}
      {color && (
        <div className="absolute bottom-2 inset-x-0 text-center">
          <span className="text-[11px] font-medium text-slate-500 bg-white/70 px-2 py-0.5 rounded-full backdrop-blur-xs border border-slate-200/50">
            {color}
          </span>
        </div>
      )}
    </div>
  );
};
