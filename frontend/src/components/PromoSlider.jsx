import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, MessageCircle, Send, Phone, Globe } from 'lucide-react';
import { getUploadUrl } from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
      links: [
        { id: 1, title: 'پەیوەندی لە تێلیگرام', url: 'https://t.me/KurdishOMR' }
      ],
      image_url: '',
      image_mode: 'side',
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
      links: [
        { id: 1, title: 'خوێندنەوەی یاساکان', url: '#' }
      ],
      image_url: '',
      image_mode: 'side',
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
      links: [
        { id: 1, title: 'پەیوەندی لە وەتسئاپ', url: 'https://wa.me/HarmanGaraway' }
      ],
      image_url: '',
      image_mode: 'side',
      bg_gradient: 'from-indigo-700 via-slate-900 to-slate-950',
      accent_color: 'indigo'
    }
  ];

  const slides = (propSlides && propSlides.length > 0) ? propSlides : defaultSlides;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchOffset, setTouchOffset] = useState(0);
  const { isDark } = useTheme();
  const { isRTL, translateDyn } = useLanguage();

  // Touch Swipe Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // Mouse Drag Refs for desktop
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);

  // Auto rotate slides every 6 seconds when not paused
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      goToNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // TOUCH GESTURE HANDLERS (Mobile / iPad Swipe Support)
  const handleTouchStart = (e) => {
    setIsPaused(true);
    isSwiping.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only apply horizontal drag if user is swiping horizontally more than vertically
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setTouchOffset(deltaX * 0.4); // Subtle rubber-band visual feedback
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    setTouchOffset(0);

    const deltaX = touchStartX.current - touchEndX.current;
    // 40px threshold to trigger slide change
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        // Swiped left
        goToNext();
      } else {
        // Swiped right
        goToPrev();
      }
    }

    setTimeout(() => setIsPaused(false), 2000);
  };

  // MOUSE DRAG HANDLERS (Desktop Drag Support)
  const handleMouseDown = (e) => {
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current) return;
    const diff = e.clientX - mouseStartX.current;
    setTouchOffset(diff * 0.3);
  };

  const handleMouseUp = (e) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setTouchOffset(0);
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTimeout(() => setIsPaused(false), 2000);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  // Helper to resolve links (supports new multi-link array or legacy link/link_text)
  const getSlideLinks = (slide) => {
    if (slide?.links && Array.isArray(slide.links) && slide.links.length > 0) {
      const valid = slide.links.filter((l) => l && l.url && l.url.trim() !== '');
      if (valid.length > 0) return valid;
    }
    if (slide?.link && slide.link !== '#' && slide.link.trim() !== '') {
      return [{ id: 'legacy-1', title: slide.link_text || 'کردنەوەی بەستەر', url: slide.link }];
    }
    return [];
  };

  const renderLinkIcon = (link) => {
    const url = (link?.url || '').toLowerCase();
    const text = (link?.title || link?.text || '').toLowerCase();

    if (url.includes('snapchat') || text.includes('سناپ')) {
      return (
        <svg className="w-3.5 h-3.5 fill-current text-yellow-300" viewBox="0 0 24 24">
          <path d="M12.016 2.013c-3.79 0-6.108 2.502-6.108 5.767 0 1.09.28 2.213.67 3.012.18.368.21.57.06.82-.18.3-.59.51-.88.66-.43.22-.9.41-1.34.66-.6.34-.84.77-.84 1.34 0 .97.86 1.62 1.76 1.83.47.11.96.12 1.44.15.35.02.5.15.54.49.07.61.27 1.15.7 1.6.58.6 1.38.86 2.18.99.37.06.67.2.82.55.22.52.62.8 1.18.8h.04c.56 0 .96-.28 1.18-.8.15-.35.45-.49.82-.55.8-.13 1.6-.39 2.18-.99.43-.45.63-.99.7-1.6.04-.34.19-.47.54-.49.48-.03.97-.04 1.44-.15.9-.21 1.76-.86 1.76-1.83 0-.57-.24-1-.84-1.34-.44-.25-.91-.44-1.34-.66-.29-.15-.7-.36-.88-.66-.15-.25-.12-.452.06-.82.39-.799.67-1.922.67-3.012 0-3.265-2.318-5.767-6.108-5.767z" />
        </svg>
      );
    }
    if (url.includes('wa.me') || url.includes('whatsapp') || text.includes('واتس') || text.includes('وەتس')) {
      return <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />;
    }
    if (url.includes('t.me') || url.includes('telegram') || text.includes('تێلیگرام')) {
      return <Send className="w-3.5 h-3.5 text-sky-300" />;
    }
    if (url.startsWith('tel:') || text.includes('پەیوەندی') || text.includes('تەلەفۆن')) {
      return <Phone className="w-3.5 h-3.5 text-amber-300" />;
    }
    if (url.includes('http://') || url.includes('https://')) {
      return <ExternalLink className="w-3.5 h-3.5 text-amber-300" />;
    }
    return <Globe className="w-3.5 h-3.5 text-amber-300" />;
  };

  const activeLinks = getSlideLinks(currentSlide);
  const hasImage = Boolean(currentSlide.image_url && currentSlide.image_url.trim() !== '');
  const showBgImage = hasImage && (currentSlide.image_mode === 'background' || currentSlide.image_mode === 'both');
  const showSideImage = hasImage && currentSlide.image_mode !== 'background';

  return (
    <div
      className="relative w-full overflow-hidden select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isMouseDown.current = false;
        setTouchOffset(0);
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Slide Card Container with Touch Swipe Listeners */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          transform: touchOffset ? `translateX(${touchOffset}px)` : 'translateX(0)',
          touchAction: 'pan-y'
        }}
        className={`relative rounded-3xl p-4 sm:p-8 ${
          isDark
            ? `bg-gradient-to-br ${currentSlide.bg_gradient || 'from-emerald-700 via-emerald-800 to-slate-900'} border border-white/20 shadow-2xl text-white`
            : 'bg-white border-2 border-slate-200 shadow-xl text-black'
        } overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing`}
      >
        {/* Background Image Overlay (if configured) */}
        {showBgImage && (
          <div
            className={`absolute inset-0 bg-cover bg-center mix-blend-overlay pointer-events-none transition-all duration-500 scale-105 ${
              isDark ? 'opacity-30' : 'opacity-10'
            }`}
            style={{ backgroundImage: `url(${getUploadUrl(currentSlide.image_url)})` }}
          />
        )}

        {/* Ambient Decorative Lighting */}
        {isDark && (
          <>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <div className="relative z-10 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] space-y-4 pointer-events-auto">
          
          {/* Top Tag & Emblem */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-sm border ${
                  isDark
                    ? 'bg-black/40 backdrop-blur-md border-white/20 text-white'
                    : 'bg-amber-100 border-amber-300 text-amber-950 font-black'
                }`}
              >
                <span>{translateDyn(currentSlide.badge || 'ڕێکلام')}</span>
              </span>
              {currentSlide.tag && (
                <span
                  className={`px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold border hidden sm:inline-block ${
                    isDark
                      ? 'bg-white/10 text-white/80 border-white/10'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  {currentSlide.tag}
                </span>
              )}
            </div>

            <img
              src="/logo.png"
              alt="KSC"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md rounded-lg pointer-events-none"
            />
          </div>

          {/* Center Main Text & Optional Side Image */}
          <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 my-1">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3
                className={`text-lg sm:text-2xl font-black leading-snug break-words whitespace-pre-line ${
                  isDark ? 'text-white drop-shadow-md' : 'text-black'
                }`}
              >
                {translateDyn(currentSlide.title)}
              </h3>
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-2xl font-medium break-words whitespace-pre-line ${
                  isDark ? 'text-slate-200/90' : 'text-slate-800'
                }`}
              >
                {translateDyn(currentSlide.description)}
              </p>
            </div>

            {showSideImage && (
              <div className="shrink-0 self-center sm:self-auto group/img">
                <img
                  src={getUploadUrl(currentSlide.image_url)}
                  alt={currentSlide.title || 'Slide Image'}
                  className={`w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-32 object-cover rounded-2xl border-2 shadow-xl pointer-events-none transition-transform duration-300 group-hover/img:scale-105 ${
                    isDark ? 'border-white/30 bg-black/30 backdrop-blur-sm' : 'border-slate-300 bg-slate-50'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Bottom Bar: Multi-Links & Tag */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
              isDark ? 'border-white/15' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {activeLinks.length > 0 ? (
                activeLinks.map((lnk, idx) => (
                  <a
                    key={lnk.id || idx}
                    href={lnk.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl active:scale-95 text-xs font-bold transition-all border shadow-md ${
                      isDark
                        ? 'bg-white/15 hover:bg-white/25 text-white border-white/20 backdrop-blur-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-black border-slate-300 font-bold'
                    }`}
                  >
                    {renderLinkIcon(lnk)}
                    <span>{translateDyn(lnk.title || lnk.text || 'کردنەوەی بەستەر')}</span>
                  </a>
                ))
              ) : (
                <span className={`text-[11px] font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {translateDyn(currentSlide.link_text || 'پلاتفۆرمی فەرمی KSC')}
                </span>
              )}
            </div>

            <span className={`text-xs font-bold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
              {translateDyn(currentSlide.badge || 'KSC Platform')}
            </span>
          </div>

        </div>

      </div>

      {/* Pagination Indicators (Clickable Dots) */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`سلایدی ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx
                  ? 'w-7 h-2 bg-amber-400 shadow-lg shadow-amber-400/50'
                  : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
