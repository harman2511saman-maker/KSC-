import React, { useState, useEffect } from 'react';
import { Megaphone, X, ChevronLeft } from 'lucide-react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function AnnouncementBar({ initialSettings }) {
  const { isRTL } = useLanguage();
  const [announcement, setAnnouncement] = useState(initialSettings?.announcement || null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem('ksc_announcement_dismissed')) {
      setDismissed(true);
      return;
    }

    if (!announcement) {
      api.get('/competitions/settings')
        .then((res) => {
          if (res.data?.announcement) {
            setAnnouncement(res.data.announcement);
          }
        })
        .catch(() => {});
    }
  }, []);

  if (dismissed || !announcement || !announcement.enabled) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('ksc_announcement_dismissed', 'true');
  };

  return (
    <div
      className="relative z-30 w-full max-w-full overflow-hidden bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white px-3 sm:px-6 py-2.5 shadow-md border-b border-amber-400/30 select-none animate-fadeIn"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 text-amber-300 text-[11px] font-black shrink-0 shadow-inner border border-amber-400/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{announcement.badge || 'ئاگاداری'}</span>
          </span>
          <p className="text-amber-50 drop-shadow-sm font-medium text-xs sm:text-sm leading-relaxed break-words">
            {announcement.text}
          </p>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="داخستن"
          className="p-1 rounded-lg text-amber-100 hover:text-white hover:bg-black/20 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
