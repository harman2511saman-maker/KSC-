import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, languages } from '../context/LanguageContext';

export default function LanguageSelector({ variant = 'dropdown', className = '' }) {
  const { lang, setLanguage, isRTL } = useLanguage();
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

  // Variant 1: Full inline toggle buttons (great for mobile drawer)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/80 ${className}`}>
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
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 2: Compact sleek dropdown with clean globe icon and typography (no flags)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 text-slate-200 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
      >
        <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-bold">{currentLang.name}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-32 rounded-xl bg-[#091122] border border-slate-700/90 shadow-2xl p-1 z-50 backdrop-blur-xl animate-fadeIn ${
            isRTL ? 'left-0' : 'right-0'
          }`}
        >
          <div className="space-y-0.5">
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
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 font-black'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
