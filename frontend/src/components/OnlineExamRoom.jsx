import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Send,
  ExternalLink,
  ZoomIn,
  X,
  Trophy,
  Camera,
  FileText
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function OnlineExamRoom({ sessionData, onClose, onShowToast }) {
  const { exam, student_name, passcode_id } = sessionData;
  const questions = exam.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(exam.question_duration_seconds || 60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  // 5-minute countdown timer for Telegram OMR submission after completion
  const [telegramSeconds, setTelegramSeconds] = useState((exam.telegram_submission_minutes || 5) * 60);

  const hasTriggeredCheat = useRef(false);

  // 1. Anti-Cheat Engine: Detect tab change or window blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isCompleted && !hasTriggeredCheat.current) {
        triggerCheatDisqualification('بەجێهێشتنی پەڕەی تاقیکردنەوە یان گۆڕینی تاب (Tab Switch)');
      }
    };

    const handleWindowBlur = () => {
      if (!isCompleted && !hasTriggeredCheat.current) {
        triggerCheatDisqualification('دەرچوون لە پەنجەرەی تاقیکردنەوە یان کردنەوەی بەرنامەیەکی تر (Window Blur)');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    // Request fullscreen if supported
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isCompleted]);

  const triggerCheatDisqualification = async (reason) => {
    hasTriggeredCheat.current = true;
    setIsDisqualified(true);
    setDisqualifyReason(reason);

    try {
      await api.post('/online-exam/report-cheat', {
        exam_id: exam.id,
        code: sessionData.passcode_id ? String(sessionData.passcode_id) : 'UNKNOWN',
        reason
      });
    } catch (e) {}
  };

  // 2. Per-Question Countdown Timer
  useEffect(() => {
    if (isCompleted || isDisqualified || questions.length === 0) return;

    // Reset seconds for current question
    setSecondsRemaining(exam.question_duration_seconds || 60);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time expired for this question -> auto advance!
          handleNextQuestion();
          return exam.question_duration_seconds || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isCompleted, isDisqualified]);

  // 3. Telegram Submission Countdown Timer (when completed)
  useEffect(() => {
    if (!isCompleted) return;

    const timer = setInterval(() => {
      setTelegramSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished all questions
      setIsCompleted(true);
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (e) {}
    }
  };

  const currentQ = questions[currentIndex] || {
    order_num: currentIndex + 1,
    question_text: 'هیچ پرسیارێک بەردەست نییە',
    image_url: null
  };

  // Timer format helpers
  const timerPercentage = Math.max(0, Math.min(100, (secondsRemaining / (exam.question_duration_seconds || 60)) * 100));
  const isUrgent = secondsRemaining <= 10;
  const isWarning = secondsRemaining <= 20 && secondsRemaining > 10;

  const telegramMins = Math.floor(telegramSeconds / 60);
  const telegramSecs = telegramSeconds % 60;

  // -------------------------------------------------------------
  // VIEW 1: DISQUALIFIED (CHEATING DETECTED)
  // -------------------------------------------------------------
  if (isDisqualified) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white select-none"
        dir="rtl"
      >
        <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-500/20 text-center space-y-5 animate-shake">
          <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-500 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-rose-400">
              ببورە بەهۆی غەشکردن لە تاقیکردنەوە دەرکرای!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              سیستەمی چاودێریی KSC تێبینی کرد کە لە پەڕەی تاقیکردنەوە چوویتە دەرەوە یان تابێکت گۆڕی.
            </p>
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono">
              هۆکار: {disqualifyReason}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            بەپێی ڕێنماییە فەرمییەکان، کۆدەکەت بە تەواوی بلۆک کرا و ناتوانیت دووبارە بەشداری لەم خولەدا بکەیت.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            داخستن و چوونە دەرەوە
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: COMPLETED (FINAL SUBMISSION & TELEGRAM TIMER)
  // -------------------------------------------------------------
  if (isCompleted) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl text-white overflow-y-auto"
        dir="rtl"
      >
        <div className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/40 shadow-2xl text-center space-y-6 my-auto">
          
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>پیرۆزە! هەموو پرسیارەکانی تاقیکردنەوە تەواو بوون</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              سوپاس بۆ بەشداریکردنت لە تاقیکردنەوەی KSC!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              قوتابی بەڕێز: <span className="font-bold text-amber-300">{student_name}</span>
            </p>
          </div>

          {/* TELEGRAM SUBMISSION NOTICE BOX (USER'S EXPLICIT REQUIREMENT) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/80 via-slate-900 to-slate-950 border-2 border-sky-400/60 shadow-xl space-y-4 text-right">
            <div className="flex items-center gap-2.5 text-sky-300 font-black text-sm border-b border-sky-500/30 pb-2">
              <Camera className="w-5 h-5 text-sky-400 shrink-0" />
              <span>قۆناغی کۆتایی زۆر گرنگ: ناردنی وێنەی پەڕەی سۆما</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-bold">
              تکایە وێنەیەکی جوانی پەڕە سۆماکە بگرە لەسەرەوەی ڕا بە فایل بینێرەوە بۆ گرووپی تێلیگرام، ٥ خولەک بەردەستە.
            </p>

            {/* 5-minute countdown clock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-sky-500/40">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>کاتی ماوە بۆ ناردن بە فایل:</span>
              </span>

              <span className="font-mono text-lg font-black text-amber-400" dir="ltr">
                {String(telegramMins).padStart(2, '0')}:{String(telegramSecs).padStart(2, '0')}
              </span>
            </div>

            {/* Telegram Link Action */}
            <a
              href={exam.telegram_group_url || 'https://t.me/KurdishOMR'}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-sky-600 hover:from-sky-400 hover:to-blue-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all active:scale-95"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>چوونە ناو گرووپی تێلیگرام بۆ ناردنی پەڕەی سۆما</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            داخستن و گەڕانەوە بۆ ماڵپەڕ
          </button>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: ACTIVE QUESTION ROOM (NO ANSWERS - STUDENT USES PAPER OMR)
  // -------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none overflow-hidden"
      dir="rtl"
    >
      {/* Top Navbar */}
      <header className="px-4 sm:px-8 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between gap-4">
        
        {/* Left / Title info */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="KSC" className="h-8 sm:h-10 w-auto object-contain rounded" />
          <div>
            <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">
              {exam.title}
            </h1>
            <span className="text-[11px] text-slate-400 font-bold">
              بەشداربوو: <span className="text-amber-400">{student_name}</span>
            </span>
          </div>
        </div>

        {/* Center: Question indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs sm:text-sm font-black">
            پرسیاری {currentIndex + 1} لە {questions.length}
          </span>
        </div>

        {/* Right: Per-Question Live Countdown Timer */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm sm:text-base transition-colors ${
              isUrgent
                ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
            dir="ltr"
          >
            <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin' : ''}`} />
            <span>00:{String(secondsRemaining).padStart(2, '0')}</span>
          </div>
        </div>
      </header>

      {/* Progress Bar of Question Time */}
      <div className="w-full h-1.5 bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${timerPercentage}%` }}
        />
      </div>

      {/* Main Question Display Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center max-w-5xl mx-auto w-full">
        
        <div className="w-full space-y-6">

          {/* Question Box Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>پرسیاری ژمارە {currentIndex + 1}</span>
              </span>

              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                کاتی ماوەی پرسیار: {secondsRemaining} چرکە
              </span>
            </div>

            {/* Question Text (Large, crisp Kurdish Sorani font) */}
            <div className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-relaxed tracking-wide drop-shadow-sm break-words whitespace-pre-line">
              {currentQ.question_text}
            </div>

            {/* Optional Question Image */}
            {currentQ.image_url && (
              <div className="flex justify-center pt-2">
                <div
                  onClick={() => setZoomImage(currentQ.image_url)}
                  className="relative group cursor-zoom-in rounded-2xl overflow-hidden border-2 border-slate-700 hover:border-amber-400 transition-all max-h-[420px] bg-black/40 shadow-xl"
                >
                  <img
                    src={getUploadUrl(currentQ.image_url)}
                    alt={`پرسیاری ${currentIndex + 1}`}
                    className="max-h-[380px] w-auto object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                    <ZoomIn className="w-4 h-4" />
                    <span>کلیک بکە بۆ گەورەکردن</span>
                  </div>
                </div>
              </div>
            )}

            {/* PAPER OMR ANSWER SHEET NOTICE (EXPLICIT USER REQUIREMENT: NO ON-SCREEN BUTTONS) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                تکایە وەڵامی ئەم پرسیارە لەسەر پەڕە سۆماکەت (فۆڕمی وەڵام) بازنەکەی دیاریبکە.
              </span>
            </div>

          </div>

          {/* Action Footer: Next Question (One-way progression) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            <div className="text-xs text-slate-400 font-medium text-center sm:text-right">
              <span className="text-rose-400 font-bold">ئاگاداری: </span>
              کاتێک کلیک لە "پرسیاری دواتر" دەکەیت ناتوانیت بگەڕێیتەوە بۆ ئەم پرسیارە.
            </div>

            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>{currentIndex < questions.length - 1 ? 'پرسیاری دواتر' : 'تەواوکردنی تاقیکردنەوە'}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

          </div>

        </div>

      </main>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 left-0 p-2 rounded-xl bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={getUploadUrl(zoomImage)}
              alt="Zoomed Question"
              className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

    </div>
  );
}
