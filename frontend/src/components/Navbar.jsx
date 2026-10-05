import React from 'react';
import { Menu, Camera, Sparkles, CheckCircle2, ShieldCheck, Bell } from 'lucide-react';

export default function Navbar({ onOpenMobile, onQuickScan, activeTitle }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -mr-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img
          src="/logo.png"
          alt="Logo"
          className="w-8 h-8 object-contain hidden sm:inline-block"
        />
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {activeTitle || 'داشبۆرد'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onQuickScan}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-sky-600 hover:from-brand-700 hover:to-sky-700 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-brand-500/25 transition-all transform active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>سکانکردنی پەڕەی وەڵام</span>
        </button>
      </div>
    </header>
  );
}
