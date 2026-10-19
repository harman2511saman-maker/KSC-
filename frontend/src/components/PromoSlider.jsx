import React, { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, ChevronRight, ChevronLeft, Award, Megaphone } from 'lucide-react';

export default function PromoSlider({ slides: propSlides }) {
  const defaultSlides = [
    {
      id: 1,
      badge: 'سپۆنسەری فەرمی',
      title: 'پاڵپشتی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC)',
      description: 'بەشداری لە بەهێزترین پێشبڕکێی زانستی و خوێندنی کوردستان • دیاری و بڕوانامەی شایستە بۆ قوتابخانە و قوتابییە یەکەمەکان',
      tag: 'KSC VIP',
      link: 'https://t.me/KurdishOMR',
      link_text: 'پەیوەندی لە تێلیگرام',
      bg_gradient: 'from-emerald-700 via-emerald-800 to-slate-900',
      accent_color: 'emerald'
    },
    {
      id: 2,
      badge: 'ڕێنمایی تاقیکردنەوە',
      title: 'سیستەمی سکان و پشکنینی ئەلیکترۆنیی فۆڕمی وەڵام',
      description: 'تەنها یەک بازنە بە قەڵەمی جافی تۆخ پڕبکەرەوە • ئەنجامەکان بە شێوازی دەستبەجێ بە ژیری دەستکرد شیکاری دەکرێن',
      tag: 'OMR GUIDE',
      link: '#',
      link_text: 'خوێندنەوەی یاساکان',
      bg_gradient: 'from-amber-600 via-amber-800 to-slate-950',
      accent_color: 'amber'
    },
    {
      id: 3,
      badge: 'ڕێکلام و هاوبەشی',
      title: 'دەرگای سپۆنسەری و هاوبەشی کراوەیە بۆ کۆمپانیا و ناوەندەکان',
      description: 'بۆ ناساندنی براندەکەت بە دەیان هەزار قوتابی و مامۆستا لە سەرانسەری هەرێمی کوردستان، پەیوەندیمان پێوە بکەن',
      tag: 'SPONSOR',
      link: 'https://wa.me/HarmanGaraway',
      link_text: 'پەیوەندی لە وەتسئاپ',
      bg_gradient: 'from-indigo-700 via-slate-900 to-slate-950',
      accent_color: 'indigo'
    }
  ];

  const slides = (propSlides && propSlides.length > 0) ? propSlides : defaultSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotate slides every 5.5 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      dir="rtl"
    >
      {/* Slide Card matching requested promo banner style */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${currentSlide.bg_gradient || 'from-emerald-700 via-emerald-800 to-slate-900'} border border-white/15 shadow-2xl overflow-hidden transition-all duration-500`}
      >
        {/* Ambient Decorative Lighting */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] space-y-4">
          
          {/* Top Tag & Emblem */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentSlide.badge || 'ڕێکلام'}</span>
              </span>
              {currentSlide.tag && (
                <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/80 font-mono text-[10px] font-bold border border-white/10 hidden sm:inline-block">
                  {currentSlide.tag}
                </span>
              )}
            </div>

            <img
              src="/logo.png"
              alt="KSC"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md rounded-lg"
            />
          </div>

          {/* Center Main Text */}
          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-md">
              {currentSlide.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl font-medium">
              {currentSlide.description}
            </p>
          </div>

          {/* Bottom Bar: Action link & Tag */}
          <div className="flex items-center justify-between pt-3 border-t border-white/15">
            {currentSlide.link && currentSlide.link !== '#' ? (
              <a
                href={currentSlide.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all border border-white/20 shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentSlide.link_text || 'کردنەوەی بەستەر'}</span>
              </a>
            ) : (
              <span className="text-[11px] text-white/70 font-medium">
                {currentSlide.link_text || 'پلاتفۆرمی فەرمی KSC'}
              </span>
            )}

            <span className="text-xs font-bold text-white/80">
              {currentSlide.badge || 'ڕێکلام'}
            </span>
          </div>

        </div>

      </div>

      {/* Pagination Indicators (Dots: • ▬ •) */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`سڵایدی ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx
                  ? 'w-7 h-2 bg-emerald-400 shadow-lg shadow-emerald-400/50'
                  : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
