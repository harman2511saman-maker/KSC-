import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if user has already seen the splash in this session
    const hasSeen = sessionStorage.getItem('ksc_splash_seen');
    if (hasSeen) {
      if (onFinish) onFinish();
      return;
    }

    // Show splash screen
    setVisible(true);

    // Smoothly animate progress bar to 100%
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            handleDismiss();
          }, 350);
          return 100;
        }
        return Math.min(100, prev + 2);
      });
    }, 25);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('ksc_splash_seen', 'true');
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 500); // 500ms fade transition
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 bg-[#070b14] select-none transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      dir="rtl"
    >
      {/* Ambient background light gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header: Skip button */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>پلاتفۆرمی فەرمی نیشتمانی</span>
        </div>

        <button
          onClick={handleDismiss}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-full transition-all duration-200"
        >
          <span>تێپەڕاندن</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Center Content: Logo & Titles */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-lg px-4">
        {/* Glow behind the emblem */}
        <div className="relative mb-6 group">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-sky-500/25 blur-2xl opacity-85 animate-pulse pointer-events-none" />
          <img
            src="/logo.png"
            alt="KSC Kurdistan Students Competition Official Emblem"
            className="relative max-w-[260px] sm:max-w-[320px] w-full h-auto object-contain drop-shadow-[0_10px_35px_rgba(245,158,11,0.35)]"
          />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-md">
          پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-amber-400/90 mt-2">
          Kurdistan Students Competition • (KSC)
        </p>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-sm">
          سەکۆی پێشکەوتووی نیشتمانی بۆ بەڕێوەبردن، پشکنینی فۆڕم و بڵاوکردنەوەی ئەنجامەکان
        </p>
      </div>

      {/* Bottom Loading Progress Bar */}
      <div className="w-full max-w-sm z-10 pb-4 space-y-2.5">
        <div
          dir="ltr"
          className="w-full h-3 sm:h-3.5 bg-slate-900/90 rounded-full border border-amber-500/40 p-0.5 shadow-inner relative overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-100 ease-out shadow-[0_0_16px_rgba(245,158,11,0.8)] relative"
            style={{ width: `${progress}%` }}
          >
            {/* Glowing tip light */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-amber-300/80 px-1 font-mono font-bold">
          <span className="flex items-center gap-1.5 font-kurdish text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>بارکردنی سیستەم...</span>
          </span>
          <span className="text-amber-400 text-xs font-black">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
