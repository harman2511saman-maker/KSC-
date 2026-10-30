import React, { useState, useEffect } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PWAInstallPrompt() {
  const { lang, isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('ksc_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIPhoneOrIPad);

    // 3. Listen for Android/Chrome/Edge native install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOpenInstall = () => {
      setIsDismissed(false);
      const isIPhoneOrIPad = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIPhoneOrIPad) {
        setShowIOSGuide(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        alert(
          lang === 'en'
            ? 'Open your browser menu (⋮) and tap "Install app" or "Add to Home screen".'
            : lang === 'ar'
            ? 'افتح قائمة المتصفح (⋮) واضغط على "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
            : 'مینووی وێبگەڕەکەت (⋮) بکەرەوە و کلیک لەسەر "Install app" یان "Add to Home screen" بکە.'
        );
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('ksc-open-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('ksc-open-install', handleOpenInstall);
    };
  }, []);

  // Do not show if already in installed app or dismissed for this session
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only show if deferredPrompt is available (Android/PC) OR if user is on iOS
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('ksc_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Bottom Install Badge */}
      <div
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 max-w-sm animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="bg-[#0b1329]/95 backdrop-blur-xl border border-amber-500/40 p-3 sm:p-3.5 rounded-2xl shadow-2xl shadow-black/80 flex items-center justify-between gap-3 text-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shrink-0 shadow-md">
              <img
                src="/pwa-192x192.png"
                alt="KSC App Icon"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                <span>{lang === 'en' ? 'Install KSC App' : lang === 'ar' ? 'تثبيت تطبيق KSC' : 'دابەزاندنی ئەپی KSC'}</span>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {lang === 'en'
                  ? 'Faster access & full-screen exams'
                  : lang === 'ar'
                  ? 'دخول أسرع وشاشة كاملة للامتحانات'
                  : 'خێراتر و شاشەی تەواو بۆ تاقیکردنەوە'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Install' : lang === 'ar' ? 'تثبيت' : 'دابەزاندن'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={lang === 'en' ? 'Close' : 'داخستن'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSGuide(false);
          }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">
                  {lang === 'en'
                    ? 'Install on iPhone / iPad'
                    : lang === 'ar'
                    ? 'التثبيت على آيفون / آيباد'
                    : 'دابەزاندن لەسەر ئایفۆن و ئایپاد'}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-black">
                  1
                </div>
                <div>
                  <span className="font-black text-white block">
                    {lang === 'en'
                      ? 'Tap the Share Button'
                      : lang === 'ar'
                      ? 'اضغط على زر المشاركة (Share)'
                      : 'کلیک لەسەر دوگمەی Share بکە'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Located at the bottom bar of Safari [ ⎋ ]'
                      : lang === 'ar'
                      ? 'موجود في الشريط السفلي لمتصفح سفاري [ ⎋ ]'
                      : 'لە بەشی خوارەوەی وێبگەڕی Safari وێنۆکەی چوارگۆشەی تیردار [ ⎋ ]'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-black">
                  2
                </div>
                <div>
                  <span className="font-black text-white block">
                    {lang === 'en'
                      ? 'Select "Add to Home Screen"'
                      : lang === 'ar'
                      ? 'اختر "إضافة إلى الصفحة الرئيسية"'
                      : 'هەڵبژاردنی "Add to Home Screen"'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Scroll down the share sheet and tap Add [+]'
                      : lang === 'ar'
                      ? 'مرر للأسفل واضغط على زر الإضافة [+]'
                      : 'کەمێک بڕۆ خوارەوە و کلیک لەسەر زیادکردن بۆ پەڕەی سەرەکی [+] بکە'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                {lang === 'en' ? 'Got it' : lang === 'ar' ? 'فهمت' : 'تێگەیشتم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
