import React, { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Trophy,
  Users,
  X,
  Laptop,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Building2,
  Sun
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function PublicNavbar({ onOpenAdminModal, onOpenOMRGuide, onSecretLogoClick }) {
  const { t, isRTL, lang } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

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
      {/* 1. TOP STICKY HEADER (KRG Official Government Portal Design) */}
      <header
        className="sticky top-0 z-40 bg-[#060a16]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl transition-all"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Right side (RTL start): Hamburger Button + Circular Emblem + Clean Bold Title */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Hamburger Menu Toggle Button with 3 golden horizontal bars */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label="Toggle Navigation Menu"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0b1329] hover:bg-[#131d3b] border border-slate-700/80 hover:border-amber-400/50 flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <div className="flex flex-col justify-center items-center gap-1 w-5">
              <span
                className={`w-5 h-[2.5px] bg-amber-400 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? 'rotate-45 translate-y-[6.5px]' : ''
                }`}
              />
              <span
                className={`w-5 h-[2.5px] bg-amber-400 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-[2.5px] bg-amber-400 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
                }`}
              />
            </div>
          </button>

          {/* Official Emblem Logo (Circular badge with golden border ring) */}
          <div
            onClick={onSecretLogoClick}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-amber-400 p-0.5 bg-white shadow-[0_0_12px_rgba(245,158,11,0.3)] flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
            title={t('kscEmblem')}
          >
            <img
              src="/logo.png"
              alt="KSC Emblem"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          {/* Clean prominent Title */}
          <span className="text-sm sm:text-lg md:text-xl font-black text-white tracking-wide truncate select-none">
            {t('kscEmblem')}
          </span>
        </div>

        {/* Left side (RTL end): Sun Button + Language Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Sun / Theme Button */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('student-search-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            title="Search"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#0b1329] hover:bg-[#131d3b] border border-slate-700/80 hover:border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <Sun className="w-5 h-5 text-amber-400" />
          </button>

          {/* Exact Language Selector Pill [ ⌄ کوردی 🌐 ] */}
          <LanguageSelector />
        </div>
      </header>

      {/* 2. SLIDE-OUT NAVIGATION DRAWER (RTL from Right Side / LTR from Left) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside
            className={`fixed top-0 bottom-0 w-[290px] sm:w-[330px] bg-[#091122] shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-fadeIn ${
              isRTL ? 'right-0 border-l border-slate-800' : 'left-0 border-r border-slate-800'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Drawer Top Header */}
            <div>
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#060c18]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full border-2 border-amber-400 p-0.5 bg-white shadow-sm flex items-center justify-center shrink-0">
                    <img
                      src="/logo.png"
                      alt="KSC"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-white">{t('kscEmblem')}</h2>
                    <span className="text-[10px] text-amber-400 font-bold block">{t('mainMenu')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Language Selector inside Drawer */}
              <div className="p-3 border-b border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 px-1">
                  {t('languageSelect')}
                </span>
                <LanguageSelector variant="inline" />
              </div>

              {/* Drawer Navigation List */}
              <div className="p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 px-3 py-1.5 block">
                  {t('mainSections')}
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
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navHome')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-500" />
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
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navSearch')}</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                    {t('searchBadge')}
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
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navSchools')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-500" />
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
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navLeaderboard')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <div className="pt-3 pb-1">
                  <span className="text-[11px] font-bold text-slate-400 px-3 py-1 block">
                    {t('servicesAndTools')}
                  </span>
                </div>

                <button
                  onClick={() => scrollTo('online-exam-section')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all"
                >
                  <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navOnlineExam')}</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                    {t('joinBadge')}
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
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navOMRGuide')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#060c18] space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('systemBadge')}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {t('versionBadge')}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly app-like bar) */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#070c1a]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
        dir={isRTL ? 'rtl' : 'ltr'}
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
            <span className="text-[10px] mt-0.5 leading-none">{t('navHome')}</span>
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
            <span className="text-[10px] mt-0.5 leading-none">{t('navSearch')}</span>
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
            <span className="text-[10px] mt-0.5 leading-none">{t('navSchools')}</span>
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
            <span className="text-[10px] mt-0.5 leading-none">{t('navLeaderboard')}</span>
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
              <div className="flex flex-col justify-center items-center gap-0.5 w-4 h-4">
                <span className="w-4 h-[2px] bg-amber-400 rounded-full" />
                <span className="w-4 h-[2px] bg-amber-400 rounded-full" />
                <span className="w-4 h-[2px] bg-amber-400 rounded-full" />
              </div>
            </div>
            <span className="text-[10px] mt-0.5 leading-none">{t('navMenu')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
