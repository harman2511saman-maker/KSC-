import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext(null);

export const languages = [
  { code: 'ku', name: 'کوردی', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'عربي', dir: 'rtl' }
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('ksc_language') || 'ku';
  });

  const isRTL = lang !== 'en';

  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
    document.body.dir = dir;

    // Apply clean font styling depending on language
    if (lang === 'en') {
      document.body.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    } else {
      document.body.style.fontFamily = "'KJino', 'HSAlBasimA', 'NRT', 'Vazirmatn', 'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif";
    }

    localStorage.setItem('ksc_language', lang);
  }, [lang, isRTL]);

  const setLanguage = (newLang) => {
    if (['ku', 'en', 'ar'].includes(newLang)) {
      setLang(newLang);
    }
  };

  const t = (key, defaultText = '') => {
    const dict = translations[lang] || translations.ku;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to Kurdish or English or provided default
    return translations.ku[key] || translations.en[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, isRTL, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: 'ku',
      isRTL: true,
      setLanguage: () => {},
      t: (k, d) => translations.ku[k] || d || k,
      languages
    };
  }
  return context;
};
