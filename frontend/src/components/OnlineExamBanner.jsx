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
  Layers
} from 'lucide-react';
import api from '../api';

export default function OnlineExamBanner({ onStartExam, onManageExam, isAdmin, onShowToast }) {
  const [exams, setExams] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [touchOffset, setTouchOffset] = useState(0);

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
        if (Array.isArray(res.data.exams) && res.data.exams.length > 0) {
          setExams(res.data.exams);
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

      if (diff <= 0) {
        setTimeRemaining({
          started: true,
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
  }, [currentExam?.id, currentExam?.start_time]);

  if (loading || exams.length === 0 || !currentExam) return null;

  const handleButtonClick = () => {
    if (!timeRemaining.started) {
      const formattedDate = new Date(currentExam.start_time).toLocaleString('ckb', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      if (onShowToast) {
        onShowToast({
          type: 'info',
          message: `وادەی دەستپێکردنی تاقیکردنەوە ماوە! کاتی دەستپێکردن: ${formattedDate}`
        });
      } else {
        alert(`وادەی دەستپێکردنی ئەم تاقیکردنەوەیە ماوە!\nکاتی دەستپێکردن: ${formattedDate}`);
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
      dir="rtl"
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
        className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl overflow-hidden transition-all duration-300 cursor-grab active:cursor-grabbing"
      >
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pointer-events-auto">
          
          {/* Main Info Side */}
          <div className="space-y-3 flex-1 min-w-0">
            {/* Top Badges & Live Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/40 shadow-inner">
                <span>تاقیکردنەوەی ئۆنلاینی فەرمیی KSC</span>
              </span>

              {exams.length > 1 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800/80 text-amber-300 text-[11px] font-bold border border-slate-700">
                  <Layers className="w-3 h-3 text-amber-400" />
                  <span>{currentIndex + 1} لە {exams.length} تاقیکردنەوە</span>
                </span>
              )}

              {timeRemaining.started ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ئێستا بەردەستە (Live Now)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>وادەی دەستپێکردن نزیکە</span>
                </span>
              )}
            </div>

            {/* Exam Title */}
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug drop-shadow-md">
                {currentExam.title}
              </h2>
              {currentExam.description && (
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-2xl mt-1">
                  {currentExam.description}
                </p>
              )}
            </div>

            {/* Sponsors & Prizes */}
            {currentExam.sponsors_and_prizes && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{currentExam.sponsors_and_prizes}</span>
              </div>
            )}

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>ژمارەی پرسیار: {currentExam.questions_count ?? 0} پرسیار</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>کاتی هەر پرسیارێک: {currentExam.question_duration_seconds} چرکە</span>
              </span>
              {currentExam.total_duration_minutes > 0 && (
                <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>کاتی گشتی: {currentExam.total_duration_minutes} خولەک</span>
                </span>
              )}
            </div>
          </div>

          {/* Action & Countdown Side */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-3 shrink-0 pt-2 lg:pt-0">
            {/* Countdown Box (if not started) */}
            {!timeRemaining.started && (
              <div className="w-full text-center px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">کاتی ماوە بۆ دەستپێکردن:</span>
                <div className="flex items-center justify-center gap-2 font-mono text-sm sm:text-base font-black text-amber-300" dir="ltr">
                  <span className="p-1 rounded bg-slate-900 border border-slate-800 min-w-[32px] text-center">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="p-1 rounded bg-slate-900 border border-slate-800 min-w-[32px] text-center">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="p-1 rounded bg-slate-900 border border-slate-800 min-w-[32px] text-center text-amber-400">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* Launch / Action Button */}
            <button
              type="button"
              onClick={handleButtonClick}
              className={`w-full sm:w-auto lg:w-full px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 ${
                timeRemaining.started
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
              }`}
            >
              {timeRemaining.started ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>دەستپێکردنی تاقیکردنەوەی ئۆنلاین</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>وادەی دەستپێک ماوە (چاوەڕوانی)</span>
                </>
              )}
            </button>

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
