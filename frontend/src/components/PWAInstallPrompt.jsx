import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, CheckCircle2, Monitor, Apple } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PWAInstallPrompt({ isOpen, onClose }) {
  const { lang, isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [activeTab, setActiveTab] = useState('ios');
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const showInstallModal = typeof isOpen === 'boolean' ? isOpen : internalModalOpen;

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    // 1. Detect if running inside installed standalone app
    const isApp =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isApp);

    // 2. Detect iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIPhoneOrIPad =
      (/iphone|ipad|ipod/.test(userAgent) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) &&
      !window.MSStream;
    setIsIOS(isIPhoneOrIPad);
    if (isIPhoneOrIPad) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }

    // 3. Listen for Android/Chrome beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isIPhoneOrIPad) {
        setActiveTab('android');
      }
    };

    // 4. Custom event triggered from menu button
    const handleOpenInstall = () => {
      setInternalModalOpen(true);
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
        handleCloseModal();
      }, 2000);
    }
  };

  // Only render the modal when requested from menu
  if (!showInstallModal) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseModal();
      }}
    >
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700/80 p-4 sm:p-5 space-y-4 shadow-2xl text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <img
                src="/pwa-192x192.png"
                alt="KSC Official App Logo"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {lang === 'en'
                  ? 'Install KSC Official App'
                  : lang === 'ar'
                  ? 'تثبيت تطبيق KSC الرسمي'
                  : 'دابەزاندنی ئەپی فەرمیی KSC'}
              </h3>
              <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                {lang === 'en'
                  ? 'iPhone • Android • Windows'
                  : 'ئایفۆن • گالاکسی • کۆمپیوتەر'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={lang === 'en' ? 'Close' : 'داخستن'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Tabs Selector */}
        {!isStandalone && !installSuccess && (
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Apple className="w-4 h-4" />
              <span>{lang === 'en' ? 'iPhone (Safari)' : 'ئایفۆن (Safari)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{lang === 'en' ? 'Android / Galaxy' : 'ئەندرۆید / گالاکسی'}</span>
            </button>
          </div>
        )}

        {/* Content Area */}
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
        ) : activeTab === 'ios' ? (
          /* Visual Image Guide for iPhone / Safari */
          <div className="space-y-3">
            <p className="text-xs text-slate-300 font-bold leading-relaxed flex items-center gap-1.5">
              <Apple className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'Step-by-step installation guide for iPhone (Safari):'
                  : lang === 'ar'
                  ? 'دليل التثبيت المصور خطوة بخطوة للآيفون (سفاري):'
                  : 'ڕێبەری وێنەیی هەنگاو بە هەنگاو بۆ ئایفۆن (سەفاری):'}
              </span>
            </p>

            {/* Infographic Guide Image */}
            <div className="rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-black shadow-2xl relative">
              <img
                src="/ios-install-guide.jpg"
                alt="KSC App iPhone Installation Guide"
                className="w-full h-auto object-contain rounded-2xl block"
                loading="eager"
              />
            </div>

            {/* Quick Safari Instructions Pill */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-black">
                <span>💡</span>
                <span>
                  {lang === 'en' ? 'Quick 2-Step Summary:' : 'پوختەی هەنگاوەکان لە Safari:'}
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 font-medium">
                <li>
                  {lang === 'en'
                    ? 'Tap the Share icon [ ⎋ ] in Safari bottom bar.'
                    : 'لە خوارەوەی وێبگەڕی Safari کلیک لە دوگمەی Share [ ⎋ ] بکە.'}
                </li>
                <li>
                  {lang === 'en'
                    ? 'Select "Add to Home Screen" [+] and tap Add.'
                    : 'بڕۆ خوارەوە و کلیک لەسەر "Add to Home Screen" [+] بکە و پاشان Add.'}
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Android / Galaxy Content */
          <div className="space-y-4">
            {deferredPrompt ? (
              /* Native 1-Click Install Button */
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'Click below to install the official KSC App directly onto your Android device.'
                    : lang === 'ar'
                    ? 'انقر أدناه لتثبيت التطبيق الرسمي مباشرة على جهازك الأندرويد.'
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
              /* Generic Android/Chrome Browser Guidance */
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  {lang === 'en'
                    ? 'To install on Android / Galaxy browsers:'
                    : 'بۆ دابەزاندن لەسەر گالاکسی و وێبگەڕەکانی ئەندرۆید:'}
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
                      ? 'Click the 3 dots menu and choose "Install app" or "Add to Home screen".'
                      : 'کلیک لەسەر ٣ خاڵەکەی سەرەوەی وێبگەڕەکە بکە و پاشان "Install app" یان "Add to Home screen" هەڵبژێرە.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Close */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'Close' : lang === 'ar' ? 'إغلاق' : 'داخستن'}
          </button>
        </div>
      </div>
    </div>
  );
}
