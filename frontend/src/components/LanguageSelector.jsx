import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, languages } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function LanguageSelector({ variant = 'dropdown', className = '' }) {
  const { lang, setLanguage, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Variant 1: Full inline toggle buttons (for drawer)
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isDark ? 'bg-slate-900/90 border-slate-700/80' : 'bg-slate-100 border-slate-200'
        } ${className}`}
      >
        {languages.map((item) => {
          const isActive = item.code === lang;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLanguage(item.code)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 2: Exact Pill shape as KRG official portal [ ⌄ کوردی 🌐 ]
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Language"
        className={`h-9 sm:h-11 px-2.5 sm:px-4 rounded-full border text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
          isDark
            ? 'bg-[#0b1329] hover:bg-[#131d3b] border-slate-700/80 hover:border-amber-400/50 text-white'
            : 'bg-slate-100 hover:bg-slate-200 border-slate-300 hover:border-amber-500 text-slate-800 shadow-sm'
        }`}
      >
        {isRTL ? (
          <>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-amber-500' : isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            />
            <span>{currentLang.name}</span>
            <Globe className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 shrink-0" />
          </>
        ) : (
          <>
            <Globe className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 shrink-0" />
            <span>{currentLang.name}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-amber-500' : isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-32 rounded-2xl border shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-fadeIn ${
            isDark
              ? 'bg-[#091122] border-slate-700/90 text-white'
              : 'bg-white border-slate-200 shadow-xl text-slate-800'
          } ${isRTL ? 'left-0' : 'right-0'}`}
        >
          <div className="space-y-1">
            {languages.map((item) => {
              const isActive = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 font-black'
                        : 'bg-amber-500/15 text-amber-700 border border-amber-500/30 font-black'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
