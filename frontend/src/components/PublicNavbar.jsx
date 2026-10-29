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
  Sun,
  Moon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSelector from './LanguageSelector';

export default function PublicNavbar({ onOpenAdminModal, onOpenOMRGuide, onSecretLogoClick }) {
  const { t, isRTL, lang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
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
      const headerOffset = 85;
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

  // Scroll spy to highlight active section in bottom nav and drawer
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
      {/* 1. TOP STICKY HEADER (KRG Official Portal Style Layout) */}
      <header
        className={`sticky top-0 z-40 w-full max-w-full px-3 sm:px-8 py-3.5 sm:py-5 min-h-[66px] sm:min-h-[80px] flex items-center justify-between border-b backdrop-blur-md transition-colors duration-300 ${
          isDark
            ? 'bg-[#060a16]/98 border-slate-800/80 shadow-2xl text-white'
            : 'bg-white/98 border-slate-200/90 shadow-sm text-black'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Right side (RTL start / LTR start): Hamburger Button + Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
          {/* Hamburger Menu Toggle Button with 3 golden horizontal bars */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label="Toggle Navigation Menu"
            className={`w-9.5 h-9.5 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer border ${
              isDark
                ? 'bg-[#0b1329] hover:bg-[#131d3b] border-slate-700/80 hover:border-amber-400/50'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 hover:border-amber-500 shadow-sm'
            }`}
          >
            <div className="flex flex-col justify-center items-center gap-1 sm:gap-1.5 w-4.5 sm:w-6">
              <span
                className={`w-4.5 sm:w-6 h-[2.5px] sm:h-[3px] bg-amber-500 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? 'rotate-45 translate-y-[6.5px] sm:translate-y-[7.5px]' : ''
                }`}
              />
              <span
                className={`w-4.5 sm:w-6 h-[2.5px] sm:h-[3px] bg-amber-500 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-4.5 sm:w-6 h-[2.5px] sm:h-[3px] bg-amber-500 rounded-full transition-all duration-300 ${
                  isDrawerOpen ? '-rotate-45 -translate-y-[6.5px] sm:-translate-y-[7.5px]' : ''
                }`}
              />
            </div>
          </button>

          {/* Official KSC Logo */}
          <div
            onClick={onSecretLogoClick}
            className="relative shrink-0 cursor-pointer"
            title={t('kscEmblem')}
          >
            <img
              src="/logo.png"
              alt="KSC Logo"
              className="h-8.5 sm:h-11 md:h-13 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300 select-none"
            />
          </div>

          {/* Clean Non-Breaking Title */}
          <div className="min-w-0 flex-1">
            {lang === 'en' ? (
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap select-none">
                <span className="font-black text-amber-500 text-xs sm:text-base md:text-lg lg:text-xl tracking-tight">
                  Kurdistan
                </span>
                <span
                  className={`font-black text-xs sm:text-base md:text-lg lg:text-xl tracking-tight transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Competition
                </span>
              </div>
            ) : (
              <span
                className={`block font-black leading-tight select-none whitespace-nowrap text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl tracking-tight transition-colors ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {t('kscEmblem')}
              </span>
            )}
          </div>
        </div>

        {/* Left side (RTL end / LTR end): Sun/Moon Button + Language Pill */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Sun / Moon Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? t('switchToLight') : t('switchToDark')}
            aria-label="Toggle Theme"
            className={`w-9.5 h-9.5 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 cursor-pointer border ${
              isDark
                ? 'bg-[#0b1329] hover:bg-[#131d3b] border-slate-700/80 hover:border-amber-400/50 text-amber-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 hover:border-amber-500 text-slate-800 shadow-sm'
            }`}
          >
            {isDark ? (
              <Sun className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4.5 h-4.5 sm:w-6 sm:h-6 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* Exact Language Selector Pill [ ⌄ کوردی 🌐 ] */}
          <LanguageSelector />
        </div>
      </header>

      {/* 2. SLIDE-OUT NAVIGATION DRAWER (RTL from Right Side / LTR from Left) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside
            className={`fixed top-0 bottom-0 w-[290px] sm:w-[330px] shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-fadeIn ${
              isDark ? 'bg-[#091122] text-slate-100' : 'bg-white text-slate-800'
            } ${
              isRTL
                ? isDark
                  ? 'right-0 border-l border-slate-800'
                  : 'right-0 border-l border-slate-200'
                : isDark
                ? 'left-0 border-r border-slate-800'
                : 'left-0 border-r border-slate-200'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Drawer Top Header */}
            <div>
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isDark ? 'bg-[#060c18] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo.png"
                    alt="KSC Logo"
                    className="h-10 w-auto object-contain rounded-xl drop-shadow-sm shrink-0"
                  />
                  <div>
                    <h2 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {t('kscEmblem')}
                    </h2>
                    <span className="text-[10px] text-amber-500 font-bold block">{t('mainMenu')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme Quick Switcher inside Drawer */}
              <div
                className={`p-3 border-b flex items-center justify-between ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                  {t('themeModeLabel')}
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-300 text-black hover:bg-slate-200 shadow-sm'
                  }`}
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{isDark ? t('lightModeName') : t('darkModeName')}</span>
                </button>
              </div>

              {/* Language Selector inside Drawer */}
              <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className={`text-[10px] font-bold block mb-1.5 px-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('languageSelect')}
                </span>
                <LanguageSelector variant="inline" />
              </div>

              {/* Drawer Navigation List */}
              <div className="p-3 space-y-1">
                <span className={`text-[11px] font-bold px-3 py-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('mainSections')}
                </span>

                <button
                  onClick={() => scrollTo('top')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'home'
                      ? isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Home className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navHome')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => scrollTo('student-search-section', 'student-search-input')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'search'
                      ? isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Search className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navSearch')}</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-500 px-2 py-0.5 rounded-full font-mono font-bold">
                    {t('searchBadge')}
                  </span>
                </button>

                <button
                  onClick={() => scrollTo('schools-ranking-section')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'schools'
                      ? isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navSchools')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => scrollTo('leaderboard-section')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeSection === 'leaderboard'
                      ? isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navLeaderboard')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <div className="pt-3 pb-1">
                  <span className={`text-[11px] font-bold px-3 py-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t('servicesAndTools')}
                  </span>
                </div>

                <button
                  onClick={() => scrollTo('online-exam-section')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <Laptop className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navOnlineExam')}</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-600 px-2 py-0.5 rounded-full font-bold">
                    {t('joinBadge')}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenOMRGuide();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{t('navOMRGuide')}</span>
                  <ArrowIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className={`p-4 border-t space-y-2 ${
                isDark ? 'border-slate-800 bg-[#060c18]' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className={`flex items-center gap-2 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('systemBadge')}</span>
              </div>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('versionBadge')}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly app-like bar) */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 lg:hidden w-full max-w-full px-2 py-1.5 border-t backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? 'bg-[#070c1a]/95 border-slate-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
          {/* 1. سەرەکی (Home) */}
          <button
            type="button"
            onClick={() => scrollTo('top')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 ${
              activeSection === 'home'
                ? isDark
                  ? 'text-amber-400 font-black'
                  : 'text-amber-600 font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeSection === 'home' ? (isDark ? 'bg-amber-400/15' : 'bg-amber-500/15') : ''
              }`}
            >
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
                ? isDark
                  ? 'text-amber-400 font-black'
                  : 'text-amber-600 font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeSection === 'search' ? (isDark ? 'bg-amber-400/15' : 'bg-amber-500/15') : ''
              }`}
            >
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
                ? isDark
                  ? 'text-amber-400 font-black'
                  : 'text-amber-600 font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeSection === 'schools' ? (isDark ? 'bg-amber-400/15' : 'bg-amber-500/15') : ''
              }`}
            >
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
                ? isDark
                  ? 'text-amber-400 font-black'
                  : 'text-amber-600 font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                activeSection === 'leaderboard' ? (isDark ? 'bg-amber-400/15' : 'bg-amber-500/15') : ''
              }`}
            >
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
                ? isDark
                  ? 'text-amber-400 font-black'
                  : 'text-amber-600 font-black'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 font-medium'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-colors ${
                isDrawerOpen ? (isDark ? 'bg-amber-400/15' : 'bg-amber-500/15') : ''
              }`}
            >
              <div className="flex flex-col justify-center items-center gap-0.5 w-4 h-4">
                <span className="w-4 h-[2px] bg-amber-500 rounded-full" />
                <span className="w-4 h-[2px] bg-amber-500 rounded-full" />
                <span className="w-4 h-[2px] bg-amber-500 rounded-full" />
              </div>
            </div>
            <span className="text-[10px] mt-0.5 leading-none">{t('navMenu')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
