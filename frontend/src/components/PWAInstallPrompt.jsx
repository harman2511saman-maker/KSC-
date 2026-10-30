import React, { useState, useEffect } from 'react';
import { Download, X, Share2, Smartphone, CheckCircle2, Monitor, ArrowDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PWAInstallPrompt() {
  const { lang, isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('ksc_install_banner_dismissed') === 'true';
  });

  useEffect(() => {
    // 1. Detect if running inside installed standalone app
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    // 2. Detect iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIPhoneOrIPad);

    // 3. Listen for Android/Chrome beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. Custom event triggered from menu button
    const handleOpenInstall = () => {
      setShowInstallModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('ksc-open-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('ksc-open-install', handleOpenInstall);
    };
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showInstallModal) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [showInstallModal]);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setShowInstallModal(false);
      }, 2000);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('ksc_install_banner_dismissed', 'true');
  };

  // Render banner only when not standalone and not dismissed
  return (
    <>
      {/* 1. Floating Bottom Banner (Dismissable, does not show if standalone or dismissed) */}
      {!isStandalone && !isDismissed && (deferredPrompt || isIOS) && !showInstallModal && (
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
                  <span>
                    {lang === 'en'
                      ? 'Install KSC App'
                      : lang === 'ar'
                      ? 'تثبيت تطبيق KSC'
                      : 'دابەزاندنی ئەپی KSC'}
                  </span>
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
                onClick={() => setShowInstallModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Install' : lang === 'ar' ? 'تثبيت' : 'دابەزاندن'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={lang === 'en' ? 'Close' : 'داخستن'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Full Dedicated App Installation Modal (Always opens when clicked from menu or banner) */}
      {showInstallModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          dir={isRTL ? 'rtl' : 'ltr'}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInstallModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 space-y-5 shadow-2xl text-slate-100 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                  <img
                    src="/pwa-192x192.png"
                    alt="KSC Official App Logo"
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'en'
                      ? 'Install KSC Official App'
                      : lang === 'ar'
                      ? 'تثبيت تطبيق KSC الرسمي'
                      : 'دابەزاندنی ئەپی فەرمیی KSC'}
                  </h3>
                  <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                    {lang === 'en'
                      ? 'Android • iPhone • Windows'
                      : 'ئایفۆن • گالاکسی • کۆمپیوتەر'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={lang === 'en' ? 'Close' : 'داخستن'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content per Platform */}
            {isStandalone ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-black text-white">
                  {lang === 'en' ? 'App Already Installed' : lang === 'ar' ? 'التطبيق مثبت بالفعل' : 'ئەپەکە پێشتر دابەزێنراوە'}
                </h4>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'You are currently using the installed KSC application.'
                    : lang === 'ar'
                    ? 'أنت تستخدم حالياً تطبيق KSC المثبت.'
                    : 'ئێستا تۆ لەناو ئەپی دابەزێنراوی فەرمیی KSC کار دەکەیت.'}
                </p>
              </div>
            ) : installSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-white">
                  {lang === 'en' ? 'Successfully Installed!' : 'پیرۆزە! ئەپەکە بە سەرکەوتوویی دامەزرا'}
                </h4>
                <p className="text-xs text-slate-400">
                  {lang === 'en'
                    ? 'You can now launch KSC directly from your home screen.'
                    : 'ئێستا دەتوانیت ڕاستەوخۆ لەسەر شاشەی مۆبایلەکەتەوە ئەپەکە بکەیتەوە.'}
                </p>
              </div>
            ) : isIOS ? (
              /* iOS Safari Instructions */
              <div className="space-y-3.5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'To install on iPhone or iPad, follow these 2 simple steps in Safari:'
                    : lang === 'ar'
                    ? 'للتثبيت على آيفون أو آيباد، اتبع الخطوتين التاليتين في متصفح Safari:'
                    : 'بۆ دابەزاندن لەسەر ئایفۆن و ئایپاد، لەناو Safari ئەم دوو هەنگاوە جێبەجێ بکە:'}
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 font-black text-sm">
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
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {lang === 'en'
                          ? 'Tap the square icon with an arrow [ ⎋ ] at the bottom bar of Safari.'
                          : 'لە بەشی خوارەوەی وێبگەڕی Safari وێنۆکەی چوارگۆشەی تیردار [ ⎋ ] هەڵبژێرە.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-black text-sm">
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
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {lang === 'en'
                          ? 'Scroll down and tap [+] Add to Home Screen.'
                          : 'کەمێک بڕۆ خوارەوە و کلیک لەسەر زیادکردن بۆ پەڕەی سەرەکی [+] بکە.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : deferredPrompt ? (
              /* Android / Chrome Native 1-Click Install */
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'Click below to install the official KSC App directly onto your device.'
                    : lang === 'ar'
                    ? 'انقر أدناه لتثبيت التطبيق الرسمي مباشرة على جهازك.'
                    : 'کلیک لە دوگمەی خوارەوە بکە بۆ دابەزاندنی ئەپی فەرمیی KSC ڕاستەوخۆ لەسەر مۆبایلەکەت.'}
                </p>

                <button
                  type="button"
                  onClick={handleNativeInstall}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Install KSC App Now'
                      : lang === 'ar'
                      ? 'تثبيت التطبيق الآن'
                      : 'دابەزاندنی یەکسەرەی ئەپی KSC'}
                  </span>
                </button>
              </div>
            ) : (
              /* Generic browser guidance (e.g. desktop or non-supported browser) */
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'en'
                    ? 'To install this app on your device:'
                    : 'بۆ دابەزاندنی ئەم ئەپە لەسەر ئامێرەکەت:'}
                </p>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>
                      {lang === 'en'
                        ? 'From your browser menu (⋮):'
                        : 'لە مینووی وێبگەڕەکەتەوە (⋮ یان ⋯):'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'en'
                      ? 'Click the menu icon and choose "Install app" or "Add to Home screen".'
                      : 'کلیک لەسەر ٣ خاڵەکەی سەرەوە بکە و پاشان "Install app" یان "Add to Home screen" هەڵبژێرە.'}
                  </p>
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {lang === 'en' ? 'Close' : lang === 'ar' ? 'إغلاق' : 'داخستن'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
