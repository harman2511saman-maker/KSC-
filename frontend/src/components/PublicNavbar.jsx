import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Trophy,
  Users,
  Menu,
  X,
  Laptop,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  GraduationCap,
  Building2
} from 'lucide-react';

export default function PublicNavbar({ onOpenAdminModal, onOpenOMRGuide, onSecretLogoClick }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Smooth scroll handler with header offset & input focus
  const scrollTo = (sectionId, focusInputId = null) => {
    setIsDrawerOpen(false);

    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 75;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      if (focusInputId) {
        setTimeout(() => {
          const input = document.getElementById(focusInputId);
          if (input) {
            input.focus();
            input.classList.add('ring-2', 'ring-amber-400');
            setTimeout(() => input.classList.remove('ring-2', 'ring-amber-400'), 1500);
          }
        }, 400);
      }
    }
  };

  // Scroll spy to highlight active section in bottom nav and header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset;

      const searchEl = document.getElementById('student-search-section');
      const schoolsEl = document.getElementById('schools-ranking-section');
      const leaderboardEl = document.getElementById('leaderboard-section');

      const searchTop = searchEl ? searchEl.offsetTop - 150 : 300;
      const schoolsTop = schoolsEl ? schoolsEl.offsetTop - 150 : 800;
      const leaderboardTop = leaderboardEl ? leaderboardEl.offsetTop - 150 : 1500;

      if (scrollY < searchTop) {
        setActiveSection('home');
      } else if (scrollY >= searchTop && scrollY < schoolsTop) {
        setActiveSection('search');
      } else if (scrollY >= schoolsTop && scrollY < leaderboardTop) {
        setActiveSection('schools');
      } else {
        setActiveSection('leaderboard');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* 1. TOP STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shadow-2xl transition-all">
        {/* Right side (RTL start): Logo & Site Title */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-sm pointer-events-none" />
            <img
              src="/logo.png"
              alt="لۆگۆی فەرمیی پێشبڕکێی قوتابیانی کوردستان"
              onClick={onSecretLogoClick}
              title="پلاتفۆرمی کوردستان"
              className="relative h-11 sm:h-14 w-auto object-contain rounded-xl drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)] hover:scale-105 transition-transform duration-300 select-none cursor-pointer"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-lg font-black text-white leading-tight truncate">
              پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-400 font-bold flex items-center gap-1.5 mt-0.5 truncate">
              <span>سەکۆی نیشتمانی بۆ ڕیزبەندی و ئەنجامەکان</span>
              <span className="text-slate-500 font-normal hidden md:inline">• (KSC)</span>
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (Large screens) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => scrollTo('top')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'home'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>سەرەکی</span>
          </button>

          <button
            onClick={() => scrollTo('student-search-section', 'student-search-input')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'search'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>پشکنینی ئەنجام</span>
          </button>

          <button
            onClick={() => scrollTo('schools-ranking-section')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'schools'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>قوتابخانەکان</span>
          </button>

          <button
            onClick={() => scrollTo('leaderboard-section')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'leaderboard'
                ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ڕیزبەندی گشتی</span>
          </button>

          <button
            onClick={() => scrollTo('online-exam-section')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>تاقیکردنەوە</span>
          </button>

          <button
            onClick={onOpenOMRGuide}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>ڕێبەری OMR</span>
          </button>
        </nav>

        {/* Left side (RTL end): Actions & Mobile Hamburger */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Menu Toggle Button (Visible on mobile/tablet) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label="کردنەوەی مینو"
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 active:scale-90 transition-all shadow-md flex items-center justify-center"
          >
            {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 2. MOBILE SLIDE-OUT DRAWER (RTL from Right Side) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside
            className="fixed top-0 right-0 bottom-0 w-[290px] sm:w-[330px] bg-[#091122] border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-fadeIn"
            dir="rtl"
          >
            {/* Drawer Top Header */}
            <div>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#060c18]">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="KSC"
                    className="h-9 w-auto object-contain rounded-lg drop-shadow"
                  />
                  <div>
                    <h2 className="text-xs font-black text-white">پلاتفۆرمی کوردستان</h2>
                    <span className="text-[10px] text-amber-400 font-bold block">مینیوی سەرەکی پلاتفۆرم</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation List */}
              <div className="p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 px-3 py-1.5 block">
                  بەشە سەرەکییەکان
                </span>

                <button
                  onClick={() => scrollTo('top')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'home'
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Home className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1 text-right">پەڕەی سەرەکی</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => scrollTo('student-search-section', 'student-search-input')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'search'
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Search className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="flex-1 text-right">پشکنینی ئەنجامی قوتابی</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                    لێگەڕین
                  </span>
                </button>

                <button
                  onClick={() => scrollTo('schools-ranking-section')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'schools'
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="flex-1 text-right">ڕیزبەندی قوتابخانەکان</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => scrollTo('leaderboard-section')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'leaderboard'
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="flex-1 text-right">ڕیزبەندی سەرجەم قوتابیان</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <div className="pt-3 pb-1">
                  <span className="text-[11px] font-bold text-slate-400 px-3 py-1 block">
                    خزمەتگوزاری و ئامرازەکان
                  </span>
                </div>

                <button
                  onClick={() => scrollTo('online-exam-section')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all"
                >
                  <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="flex-1 text-right">تاقیکردنەوەی ئۆنلاین</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                    بەشداربوون
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenOMRGuide();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all"
                >
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1 text-right">ڕێنمایی پڕکردنەوەی فۆڕمی OMR</span>
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#060c18] space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>سیستەمی نیشتمانیی وەڵامدانەوەی OMR</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                KSC Official Portal • Version 2.0
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly app-like bar) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#070c1a]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
        dir="rtl"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
          {/* 1. سەرەکی (Home) */}
          <button
            type="button"
            onClick={() => scrollTo('top')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeSection === 'home'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeSection === 'home' ? 'bg-amber-400/15' : ''}`}>
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">سەرەکی</span>
          </button>

          {/* 2. پشکنین (Search) */}
          <button
            type="button"
            onClick={() => scrollTo('student-search-section', 'student-search-input')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeSection === 'search'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeSection === 'search' ? 'bg-amber-400/15' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">پشکنین</span>
          </button>

          {/* 3. قوتابخانەکان (Schools) */}
          <button
            type="button"
            onClick={() => scrollTo('schools-ranking-section')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeSection === 'schools'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeSection === 'schools' ? 'bg-amber-400/15' : ''}`}>
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">قوتابخانە</span>
          </button>

          {/* 4. قوتابیان (Leaderboard) */}
          <button
            type="button"
            onClick={() => scrollTo('leaderboard-section')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeSection === 'leaderboard'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeSection === 'leaderboard' ? 'bg-amber-400/15' : ''}`}>
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">قوتابیان</span>
          </button>

          {/* 5. مینو (Full Drawer Menu) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              isDrawerOpen
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${isDrawerOpen ? 'bg-amber-400/15' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 leading-none">مینو</span>
          </button>
        </div>
      </nav>
    </>
  );
}

