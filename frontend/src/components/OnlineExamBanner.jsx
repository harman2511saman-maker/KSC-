import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Calendar,
  Gift,
  HelpCircle,
  Settings,
  ChevronRight,
  ChevronLeft,
  Lock,
  Timer,
  Layers,
  Sparkles,
  Zap,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  BookOpen
} from 'lucide-react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

export default function OnlineExamBanner({
  onStartExam,
  onManageExam,
  isAdmin,
  onShowToast,
  onViewSolutions,
  onViewLeaderboard
}) {
  const [exams, setExams] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchOffset, setTouchOffset] = useState(0);
  const { isDark } = useTheme();
  const { isRTL, translateExam, translateDyn } = useLanguage();

  // Countdown state for currently visible slide
  const [timeRemaining, setTimeRemaining] = useState({
    started: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  // Touch Swipe Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // Mouse Drag Refs for desktop
  const isMouseDown = useRef(false);
  const mouseStartX = useRef(0);

  useEffect(() => {
    fetchActiveExams();
  }, []);

  const fetchActiveExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/online-exam/active');
      if (res.data) {
        if (Array.isArray(res.data.exams)) {
          const validExams = res.data.exams.filter((e) => e.is_active);
          setExams(validExams);
        } else if (res.data.id && res.data.is_active) {
          setExams([res.data]);
        } else {
          setExams([]);
        }
      }
    } catch (err) {
      // Quiet fail if no exam configured
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const currentExam = exams[currentIndex] || exams[0];

  // Auto rotate slides every 7 seconds when not paused and multiple exams exist
  useEffect(() => {
    if (isPaused || exams.length <= 1) return;
    const timer = setInterval(() => {
      goToNext();
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused, exams.length, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % exams.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + exams.length) % exams.length);
  };

  // TOUCH GESTURE HANDLERS (Mobile / iPad Swipe Support)
  const handleTouchStart = (e) => {
    setIsPaused(true);
    isSwiping.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Only apply horizontal drag if user is swiping horizontally more than vertically
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setTouchOffset(deltaX * 0.4); // Subtle rubber-band visual feedback
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    setTouchOffset(0);

    const deltaX = touchStartX.current - touchEndX.current;
    // 40px threshold to trigger slide change
    if (Math.abs(deltaX) > 40) {
      if (deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setTimeout(() => setIsPaused(false), 2500);
  };

  // MOUSE DRAG HANDLERS (Desktop Drag Support)
  const handleMouseDown = (e) => {
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDown.current) return;
    const diff = e.clientX - mouseStartX.current;
    setTouchOffset(diff * 0.3);
  };

  const handleMouseUp = (e) => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setTouchOffset(0);
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTimeout(() => setIsPaused(false), 2500);
  };

  // Live Countdown Timer to Start Time of CURRENT SLIDE
  useEffect(() => {
    if (!currentExam || !currentExam.start_time) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const startTime = new Date(currentExam.start_time).getTime();
      const diff = startTime - now;

      const cutoffMins = currentExam.entry_cutoff_minutes || 3;
      const cutoffSeconds = cutoffMins * 60;

      if (diff <= 0) {
        const secondsSinceStart = Math.floor((now - startTime) / 1000);
        const entryClosed = secondsSinceStart > cutoffSeconds;
        setTimeRemaining({
          started: true,
          entryClosed,
          secondsSinceStart,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0
        });
      } else {
        const totalSeconds = Math.floor(diff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setTimeRemaining({
          started: false,
          entryClosed: false,
          secondsSinceStart: 0,
          hours,
          minutes,
          seconds,
          totalSeconds
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [currentExam?.id, currentExam?.start_time, currentExam?.entry_cutoff_minutes]);

  if (loading) return null;

  // -------------------------------------------------------------
  // VIEW: NO ACTIVE EXAMS -> COMING SOON & EXAM MODES OVERVIEW
  // -------------------------------------------------------------
  if (exams.length === 0 || !currentExam) {
    return (
      <div className="relative w-full my-4 select-none" dir="rtl">
        <div
          className={`relative rounded-3xl p-5 sm:p-8 ${
            isDark
              ? 'bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl text-white'
              : 'bg-white border-2 border-slate-200 shadow-xl text-black'
          } overflow-hidden space-y-6`}
        >
          {/* Ambient Lighting */}
          {isDark && (
            <>
              <div className="absolute top-0 right-1/4 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            </>
          )}

          {/* Header Row */}
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b ${
              isDark ? 'border-slate-800/80' : 'border-slate-200'
            } pb-4 relative z-10`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-inner ${
                    isDark
                      ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-amber-100 text-amber-950 border-amber-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span>بەمزووانە (Coming Soon) • پلاتفۆرمی تاقیکردنەوەی KSC</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  خولی نوێ لە ئامادەکاریدایە
                </span>
              </div>
              <h2
                className={`text-xl sm:text-2xl lg:text-3xl font-black leading-snug ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                خولی داهاتووی تاقیکردنەوە و پێشبڕکێی ئۆنلاین بەمزووانە ڕادەگەیەنرێت
              </h2>
              <p
                className={`text-xs sm:text-sm leading-relaxed max-w-3xl ${
                  isDark ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                لە ئێستادا هیچ تاقیکردنەوەیەکی چالاک نییە. لەگەڵ دیاریکردنی وادەی تاقیکردنەوە، کاتژمێری پێچەوانە دەستپێدەکات. دەتوانیت لە خوارەوە زانیاری دەربارەی هەردوو شێوازی تاقیکردنەوە بخوێنیتەوە:
              </p>
            </div>

            {/* Admin Management Button (Always visible to Admin even when no exams exist) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onManageExam}
                className="shrink-0 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-400/40 text-amber-400 hover:text-amber-500 text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Settings className="w-4 h-4 text-amber-500" />
                <span>دانانی تاقیکردنەوەی نوێ (Admin)</span>
              </button>
            )}
          </div>

          {/* Two Comparison Cards for Exam Modes (SOMA vs ONLINE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            
            {/* Mode 1: Pure Digital Online (بەبێ پەڕەی سۆما) */}
            <div
              className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-slate-50 border-slate-200 text-black shadow-sm hover:border-slate-300'
              }`}
            >
              <div
                className={`flex items-center justify-between border-b pb-2.5 ${
                  isDark ? 'border-emerald-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-black'}`}>
                      ١. تاقیکردنەوەی ئۆنلاین (بەبێ پەڕەی سۆما)
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      دیجیتاڵی ڕاستەوخۆ لەسەر شاشە
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-bold border border-emerald-500/30">
                  Online Mode
                </span>
              </div>

              <ul className={`space-y-2 text-xs pr-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>وەڵامدانەوەی ڕاستەوخۆ:</strong> پرسیار و هەڵبژاردنەکان (A, B, C, D) لەسەر شاشەن، بە یەک کلیک وەڵامەکە دیاری دەکرێت.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>تێپەڕبوونی خێرا:</strong> هەر کە کلیک لە وەڵامەکە دەکەیت، دەستبەجێ دەچێتە پرسیاری دواتر.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>ئەنجامی دەستبەجێ:</strong> لە کۆتاییدا یەکسەر نمرە، ڕێژەی سەدی، و هەڵە و ڕاستەکانت بە پێداچوونەوە پیشان دەدات.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>چوونە ناو ڕیزبەندی:</strong> ناوت ڕاستەوخۆ لە فلتەری تاقیکردنەوەکەدا دەچێتە ناو خشتەی ڕیزبەندی پێشبڕکێی ماڵپەڕ.</span>
                </li>
              </ul>
            </div>

            {/* Mode 2: Paper OMR (بە پەڕەی سۆما) */}
            <div
              className={`p-5 rounded-2xl border shadow-lg space-y-3.5 transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-950 border-indigo-500/30 hover:border-indigo-500/50'
                  : 'bg-slate-50 border-slate-200 text-black shadow-sm hover:border-slate-300'
              }`}
            >
              <div
                className={`flex items-center justify-between border-b pb-2.5 ${
                  isDark ? 'border-indigo-500/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-500 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-black'}`}>
                      ٢. تاقیکردنەوەی فۆڕمی سۆما (Paper OMR)
                    </h3>
                    <span className="text-[11px] text-indigo-600 font-bold">
                      شاشە + فۆڕمی کاغەز و تێلیگرام
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 text-[10px] font-bold border border-indigo-500/30">
                  Paper OMR
                </span>
              </div>

              <ul className={`space-y-2 text-xs pr-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>پرسیار لەسەر شاشە:</strong> پرسیارەکان یەک لە دوای یەک بە کاتی دیاریکراو لەسەر شاشەی مۆبایل یان کۆمپیوتەر دەردەکەون.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>پڕکردنەوەی فۆڕمی سۆما:</strong> قوتابی لەسەر پەڕە سۆماکەی بە قەڵەمی جاف بازنەکان پڕدەکاتەوە.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>ناردنی وێنە:</strong> لە کۆتایی تاقیکردنەوەکەدا ٥ خولەک مۆڵەت هەیە وێنەی فۆڕمەکە بە فایل بنێرێت بۆ تێلیگرام.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span><strong>پشکنینی OMR:</strong> ئەدمین بە سیستەمی زیرەکی دەستکردی KSC فۆڕمەکان دەخوێنێتەوە و نمرەکان دەردەهێنێت.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Quick Preparation Guidelines for Candidates */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 relative z-10 ${
              isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold text-amber-700">ڕێنمایی بۆ بەشداریکردن:</span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="text-[11px] sm:text-xs">پێویستە کۆدی تایبەت (پاسوۆرد) لە مامۆستا یان ئەدمین وەربگریت، و لە کاتی تاقیکردنەوەدا تاب مەگۆڕە.</span>
            </div>
            <div className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-600 font-bold'}`}>
              KSC Online Examination System
            </div>
          </div>

        </div>
      </div>
    );
  }

  const handleButtonClick = () => {
    if (currentExam.is_ended) {
      if (onViewSolutions) {
        onViewSolutions(currentExam);
      } else if (onViewLeaderboard) {
        onViewLeaderboard(currentExam);
      }
      return;
    }

    if (currentExam.is_coming_soon) {
      const msg = '✨ ئەم تاقیکردنەوەیە بەمزوانە لە پلاتفۆرمی KSC بەڕێوەدەچێت! تکایە چاوەڕوان بن.';
      if (onShowToast) {
        onShowToast({ type: 'info', message: msg });
      } else {
        alert(msg);
      }
      return;
    }

    if (!timeRemaining.started) {
      const formattedDate = new Date(currentExam.start_time).toLocaleString('ckb', {
        timeZone: 'Asia/Baghdad',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      if (onShowToast) {
        onShowToast({
          type: 'info',
          message: `وادەی دەستپێکردنی تاقیکردنەوە ماوە!\nکاتی دەستپێکردن: ${formattedDate} (بە کاتی کوردستان)`
        });
      } else {
        alert(`وادەی دەستپێکردنی ئەم تاقیکردنەوەیە ماوە!\nکاتی دەستپێکردن: ${formattedDate} (بە کاتی کوردستان)`);
      }
      return;
    }

    if (currentExam.questions_count === 0) {
      const msg = 'پرسیارەکانی ئەم تاقیکردنەوەیە لە ئامادەکردندان، تکایە کەمێکی تر سەردان بکەرەوە.';
      if (onShowToast) {
        onShowToast({ type: 'info', message: msg });
      } else {
        alert(msg);
      }
      return;
    }

    if (timeRemaining.entryClosed) {
      const msg = 'تاقیکردنەوە دەستی پێکردووە و دەرگای بەشداری داخراوە! ناتوانیت بەشداری بکەیت، لە تاقیکردنەوەی داهاتوو بەشداری بکە.';
      if (onShowToast) {
        onShowToast({ type: 'warning', message: msg });
      } else {
        alert(msg);
      }
      return;
    }

    if (onStartExam) {
      onStartExam(currentExam);
    }
  };

  return (
    <div
      className="relative w-full my-4 select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isMouseDown.current = false;
        setTouchOffset(0);
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Slide Card Container with Touch & Drag Support */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          transform: touchOffset ? `translateX(${touchOffset}px)` : 'translateX(0)',
          touchAction: 'pan-y'
        }}
        className={`relative rounded-3xl p-4 sm:p-7 ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl text-white'
            : 'bg-white border-2 border-slate-200 shadow-xl text-black'
        } overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing`}
      >
        {/* Ambient Glows */}
        {isDark && (
          <>
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pointer-events-auto">
          
          {/* Main Info Side */}
          <div className="space-y-3 flex-1 min-w-0">
            {/* Top Badges & Live Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border shadow-inner ${
                  isDark ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                }`}
              >
                <span>تاقیکردنەوەی ئۆنلاینی فەرمیی KSC</span>
              </span>

              {exams.length > 1 && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isDark ? 'bg-slate-800/80 text-amber-300 border-slate-700' : 'bg-slate-100 text-amber-800 border-slate-300'
                  }`}
                >
                  <Layers className="w-3 h-3 text-amber-500" />
                  <span>{currentIndex + 1} لە {exams.length} تاقیکردنەوە</span>
                </span>
              )}

              {currentExam.is_ended ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 text-xs font-black border border-purple-500/40 shadow-inner animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>🏁 تاقیکردنەوە کۆتایی پێهات (Exam Ended)</span>
                </span>
              ) : currentExam.is_coming_soon ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-purple-500/25 to-pink-500/25 text-amber-700 text-xs font-black border border-amber-400/40 shadow-inner animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>✨ بەمزوانە (Coming Soon) • لە ڕێگایە</span>
                </span>
              ) : timeRemaining.started ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 text-xs font-bold border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>ئێستا بەردەستە (Live Now)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 text-xs font-bold border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>وادەی دەستپێکردن نزیکە</span>
                </span>
              )}
            </div>

            {/* Exam Title */}
            <div>
              <h2
                className={`text-lg sm:text-2xl lg:text-3xl font-black leading-snug break-words whitespace-pre-line ${
                  isDark ? 'text-white drop-shadow-md' : 'text-black'
                }`}
              >
                {translateExam(currentExam.title)}
              </h2>
              {currentExam.description && (
                <p
                  className={`text-xs sm:text-sm leading-relaxed max-w-2xl mt-1 break-words whitespace-pre-line ${
                    isDark ? 'text-slate-300/90' : 'text-slate-800'
                  }`}
                >
                  {translateDyn(currentExam.description)}
                </p>
              )}
            </div>

            {/* Sponsors & Prizes - Full text visible on mobile without truncation */}
            {currentExam.sponsors_and_prizes && (
              <div
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed whitespace-pre-line">{translateDyn(currentExam.sponsors_and_prizes)}</span>
              </div>
            )}

            {/* Stats Badges */}
            <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-[11px] sm:text-xs ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <span className={`px-2.5 sm:px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>ژمارەی پرسیار: {currentExam.questions_count ?? 0} پرسیار</span>
              </span>
              <span className={`px-2.5 sm:px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span>کاتی هەر پرسیارێک: {currentExam.question_duration_seconds} چرکە</span>
              </span>
              {currentExam.total_duration_minutes > 0 && (
                <span className={`px-2.5 sm:px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>کاتی گشتی: {currentExam.total_duration_minutes} خولەک</span>
                </span>
              )}
              <span className={`px-2.5 sm:px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 shrink-0 ${isDark ? 'bg-slate-800/80 border-slate-700 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>مۆڵەتی چوونەژوورەوە: {currentExam.entry_cutoff_minutes || 3} خولەک</span>
              </span>
            </div>
          </div>

          {/* Action & Countdown Side */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 shrink-0 pt-2 lg:pt-0">
            {currentExam.is_ended ? (
              <div className="w-full flex flex-col gap-2.5 min-w-[240px]">
                {/* Ended Notice Box */}
                <div className="w-full text-center px-4 py-2.5 rounded-2xl bg-purple-950/70 border border-purple-500/40 shadow-inner">
                  <span className="text-xs font-black text-purple-300 block">
                    🏁 تاقیکردنەوە کۆتایی پێهات
                  </span>
                  <span className="text-[11px] text-slate-300 font-bold block mt-0.5">
                    ئەنجامەکان پەسەند کراون و وەڵامە دروستەکان بەردەستن
                  </span>
                </div>

                <div className="flex flex-col gap-2 w-full">
                  {/* Button 1: View Leaderboard & Results */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewLeaderboard) onViewLeaderboard(currentExam);
                    }}
                    className="w-full px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-slate-950 fill-current shrink-0" />
                    <span>🏆 بینینی ئەنجام و ڕیزبەندی</span>
                  </button>

                  {/* Button 2: View Questions & Correct Answers */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onViewSolutions) onViewSolutions(currentExam);
                    }}
                    className="w-full px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 bg-slate-800/95 hover:bg-slate-700 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>📖 بینینی پرسیار و وەڵامەکان</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Countdown Box (if not started) */}
                {!timeRemaining.started && (
                  <div
                    className={`w-full text-center px-4 py-2.5 rounded-2xl border shadow-inner ${
                      isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <span className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>
                      کاتی ماوە بۆ دەستپێکردن:
                    </span>
                    <div
                      className={`flex items-center justify-center gap-2 font-mono text-sm sm:text-base font-black ${
                        isDark ? 'text-amber-300' : 'text-black'
                      }`}
                      dir="ltr"
                    >
                      <span
                        className={`p-1 rounded min-w-[32px] text-center border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                        }`}
                      >
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </span>
                      <span>:</span>
                      <span
                        className={`p-1 rounded min-w-[32px] text-center border ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                        }`}
                      >
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </span>
                      <span>:</span>
                      <span
                        className={`p-1 rounded min-w-[32px] text-center border ${
                          isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-700 shadow-sm'
                        }`}
                      >
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono block mt-1.5 pt-1 border-t ${
                        isDark ? 'text-amber-300/90 border-slate-800/80' : 'text-amber-800 border-slate-200'
                      }`}
                    >
                      {new Date(currentExam.start_time).toLocaleTimeString('ckb', {
                        timeZone: 'Asia/Baghdad',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })} (بە کاتی کوردستان)
                    </span>
                  </div>
                )}

                {/* Launch / Action Button */}
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className={`w-full sm:w-auto lg:w-full px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 ${
                    currentExam.is_coming_soon
                      ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-200 border border-amber-400/40 shadow-lg shadow-amber-950/30 cursor-pointer'
                      : !timeRemaining.started
                      ? 'bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                      : timeRemaining.entryClosed
                      ? 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 shadow-rose-950/40'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse'
                  }`}
                >
                  {currentExam.is_coming_soon ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                      <span>✨ بەمزوانە لە پلاتفۆرمی KSC (چاوەڕوان بن)</span>
                    </>
                  ) : !timeRemaining.started ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>وادەی دەستپێک ماوە (چاوەڕوانی)</span>
                    </>
                  ) : timeRemaining.entryClosed ? (
                    <>
                      <Lock className="w-4 h-4 text-rose-400" />
                      <span>دەرگای بەشداری داخراوە (تاقیکردنەوە دەستی پێکردووە)</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>دەستپێکردنی تاقیکردنەوەی ئۆنلاین</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Admin Management Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={onManageExam}
                className="w-full sm:w-auto lg:w-full px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>بەڕێوەبردنی تاقیکردنەوە (Admin)</span>
              </button>
            )}
          </div>

        </div>

        {/* Carousel Arrow Buttons for Multiple Exams */}
        {exams.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              aria-label="تاقیکردنەوەی پێشوو"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white/80 hover:text-white backdrop-blur-md opacity-75 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              aria-label="تاقیکردنەوەی دواتر"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white/80 hover:text-white backdrop-blur-md opacity-75 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}

      </div>

      {/* Pagination Indicators (Clickable Dots) when Multiple Exams Exist */}
      {exams.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2.5">
          {exams.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`تاقیکردنەوەی ${idx + 1}`}
              title={item.title}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx
                  ? 'w-7 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 shadow-md shadow-amber-400/40'
                  : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
