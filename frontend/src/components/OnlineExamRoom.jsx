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
  FileText,
  Award,
  Check,
  XCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  BarChart3,
  Flame,
  ArrowRight
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function OnlineExamRoom({ sessionData, onClose, onShowToast }) {
  const { exam, student_name, passcode_id, passcode_code, code } = sessionData || {};
  const questions = exam?.questions || [];

  const studentCode = code || passcode_code || (passcode_id ? String(passcode_id) : 'UNKNOWN');
  const studentDisplayName = student_name || sessionData?.student_name || 'قوتابی بەڕێز';

  const isOnlineMode = exam?.exam_mode !== 'SOMA';
  const isSelectionAllowed = isOnlineMode || Boolean(exam?.allow_screen_selection);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(exam?.question_duration_seconds || 60);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  // Answers & Submissions State
  const [studentAnswers, setStudentAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('ALL'); // 'ALL' | 'CORRECT' | 'INCORRECT' | 'BLANK'

  // Telegram Timer (only used for SOMA mode)
  const [telegramSeconds, setTelegramSeconds] = useState((exam?.telegram_submission_minutes || 5) * 60);

  const hasTriggeredCheat = useRef(false);
  const advanceTimeoutRef = useRef(null);

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
        code: studentCode,
        reason
      });
    } catch (e) {}
  };

  // 2. Per-Question Countdown Timer
  useEffect(() => {
    if (isCompleted || isDisqualified || questions.length === 0) return;

    // Reset seconds for current question
    setSecondsRemaining(exam?.question_duration_seconds || 60);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time expired for this question -> auto advance!
          advanceToNextOrSubmit();
          return exam?.question_duration_seconds || 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, isCompleted, isDisqualified]);

  // 3. Telegram Submission Countdown Timer (when completed in SOMA mode)
  useEffect(() => {
    if (!isCompleted || isOnlineMode) return;

    const timer = setInterval(() => {
      setTelegramSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isOnlineMode]);

  // Sync selectedOption on question change & cleanup timeouts
  useEffect(() => {
    const curQ = questions[currentIndex];
    if (curQ) {
      setSelectedOption(studentAnswers[curQ.order_num] || null);
    }
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, [currentIndex]);

  // 4. Option Selection with Auto-Advance in ONLINE mode
  const handleSelectOption = (key) => {
    if (isCompleted || isDisqualified || !isSelectionAllowed) return;

    const newChoice = selectedOption === key ? null : key;
    setSelectedOption(newChoice);
    setStudentAnswers((prev) => ({
      ...prev,
      [currentQ.order_num]: newChoice
    }));

    // In ONLINE mode: automatically advance smoothly after 350ms so user sees their click registered!
    if (isOnlineMode && newChoice) {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
      advanceTimeoutRef.current = setTimeout(() => {
        advanceToNextOrSubmit(newChoice);
      }, 350);
    }
  };

  // Advance or Submit logic
  const advanceToNextOrSubmit = (overrideSelectedForCurrent) => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Last question finished
      if (isOnlineMode) {
        const finalAnswers = { ...studentAnswers };
        if (overrideSelectedForCurrent !== undefined) {
          finalAnswers[currentQ.order_num] = overrideSelectedForCurrent;
        } else if (selectedOption) {
          finalAnswers[currentQ.order_num] = selectedOption;
        }
        submitOnlineExamDirect(finalAnswers);
      } else {
        // Paper Soma mode
        setIsCompleted(true);
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
    }
  };

  // 5. Submit Exam Online & Retrieve Instant Scorecard
  const submitOnlineExamDirect = async (answersToSubmit) => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);
    setIsCompleted(true);

    try {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    try {
      const res = await api.post('/online-exam/submit', {
        exam_id: exam.id,
        code: studentCode,
        answers: answersToSubmit || studentAnswers
      });

      if (res.data?.success) {
        setSubmissionResult(res.data);
        if (onShowToast) {
          onShowToast({
            type: 'success',
            message: 'تاقیکردنەوەکەت بە سەرکەوتوویی تەواو کرا و نمرەکەت تۆمار کرا!'
          });
        }
      } else {
        throw new Error(res.data?.message || 'هەڵەیەک ڕوویدا لە پەیوەندیکردن');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'هەڵەیەک ڕوویدا لە تۆمارکردنی ئەنجام';
      if (onShowToast) {
        onShowToast({ type: 'error', message: detail });
      }
      // Graceful fallback scorecard
      setSubmissionResult({
        exam_title: exam.title,
        student_name: studentDisplayName,
        student_code: studentCode,
        score: 0,
        max_score: 100,
        percentage: 0,
        correct_count: 0,
        incorrect_count: questions.length,
        blank_count: 0,
        total_questions: questions.length,
        status: 'COMPLETED',
        rank: 1,
        total_participants: 1,
        questions_details: questions.map((q) => ({
          order_num: q.order_num,
          question_text: q.question_text,
          image_url: q.image_url,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          selected_answer: (answersToSubmit || studentAnswers)[q.order_num] || null,
          correct_answer: null,
          is_correct: false
        }))
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIndex] || {
    order_num: currentIndex + 1,
    question_text: 'هیچ پرسیارێک بەردەست نییە',
    image_url: null,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null
  };

  const hasOptions = Boolean(
    (currentQ.option_a && currentQ.option_a.trim()) ||
    (currentQ.option_b && currentQ.option_b.trim()) ||
    (currentQ.option_c && currentQ.option_c.trim()) ||
    (currentQ.option_d && currentQ.option_d.trim())
  );

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    if (isCompleted || isDisqualified || !hasOptions || !isSelectionAllowed) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        handleSelectOption(key);
      } else if (e.key === '1') handleSelectOption('A');
      else if (e.key === '2') handleSelectOption('B');
      else if (e.key === '3') handleSelectOption('C');
      else if (e.key === '4') handleSelectOption('D');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isCompleted, isDisqualified, hasOptions, isSelectionAllowed, selectedOption]);

  // Timer format helpers
  const timerPercentage = Math.max(0, Math.min(100, (secondsRemaining / (exam?.question_duration_seconds || 60)) * 100));
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
  // VIEW 2: SUBMITTING / PROCESSING RESULTS (ONLINE MODE)
  // -------------------------------------------------------------
  if (isCompleted && isOnlineMode && isSubmitting) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white"
        dir="rtl"
      >
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-indigo-500/40 text-center space-y-6 shadow-2xl">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full border-4 border-t-amber-400 border-indigo-500 flex items-center justify-center animate-spin">
              <Loader2 className="w-10 h-10 text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">
              کەمێک چاوەڕوانبە...
            </h3>
            <p className="text-sm text-slate-300">
              وەڵامەکانت لەلایەن سیستەمەوە ڕاستەوخۆ هەژمار دەکرێن و نمرەکەت دەخرێتە خشتەی ڕیزبەندی ماڵپەڕ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: COMPLETED ONLINE EXAM - INSTANT SCORECARD & QUESTION REVIEW
  // -------------------------------------------------------------
  if (isCompleted && isOnlineMode && submissionResult) {
    const details = submissionResult.questions_details || [];
    const isPassed = submissionResult.percentage >= 50;

    const filteredDetails = details.filter((item) => {
      if (reviewFilter === 'CORRECT') return item.is_correct;
      if (reviewFilter === 'INCORRECT') return !item.is_correct && Boolean(item.selected_answer);
      if (reviewFilter === 'BLANK') return !item.selected_answer;
      return true;
    });

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden"
        dir="rtl"
      >
        {/* Sticky Top Navbar */}
        <header className="px-4 sm:px-8 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="KSC" className="h-8 w-auto object-contain rounded" />
            <div>
              <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">
                کارتی ئەنجامی تاقیکردنەوەی ئۆنلاین
              </h1>
              <span className="text-[11px] text-slate-400 font-bold">
                {submissionResult.exam_title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Trophy className="w-4 h-4" />
              <span>چوون بۆ ڕیزبەندی ماڵپەڕ</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6 max-w-5xl mx-auto w-full">
          
          {/* Hero Banner */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-1/4 w-72 h-36 bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-center md:text-right">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
                  <Trophy className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تاقیکردنەوەکەت بە سەرکەوتوویی تەواو کرا</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold" dir="ltr">
                      {submissionResult.student_code}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {submissionResult.student_name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    ئەنجامەکەت بە فەرمی لە سیستەمی KSC تۆمار کرا و ناوت بەسترا بە فلتەری تاقیکردنەوەکەوە.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 text-center p-4 rounded-2xl bg-slate-950/70 border border-slate-800 min-w-[150px]">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">دۆخی تاقیکردنەوە</span>
                <span
                  className={`text-lg font-black px-4 py-1.5 rounded-xl inline-block ${
                    isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {isPassed ? 'سەرکەوتوو (Passed)' : 'دەرنەچوو (Failed)'}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Online Exam Confirmation Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm font-black text-emerald-300">
                تاقیکردنەوەی ئۆنلاینی تەواو (دیجیتاڵی بەبێ پەڕەی سۆما)
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
                ئەنجامەکەت بە سەرکەوتوویی و بە شێوازی ئەلیکترۆنی تۆمارکرا؛ پێویست بە هیچ پەڕەیەکی سۆما ناکات و ناو و نمرەکەت یەکسەر چووە ناو بەشی ئەنجامەکان و ڕیزبەندی ماڵپەڕ.
              </div>
            </div>
          </div>

          {/* 4 Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* 1. Score */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>نمرەی بەدەستهاتوو</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {submissionResult.score}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ {submissionResult.max_score}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold">
                ڕێژەی سەدی: <span className="text-amber-300 font-black font-mono">{submissionResult.percentage}%</span>
              </div>
            </div>

            {/* 2. Platform Rank */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>ڕیزبەندی لەسەر ماڵپەڕ</span>
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  #{submissionResult.rank}
                </span>
                <span className="text-xs text-slate-400 font-bold">پلەی تۆ</span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold">
                لە کۆی <span className="text-white font-bold">{submissionResult.total_participants}</span> بەشداربووی فەرمی
              </div>
            </div>

            {/* 3. Correct Count */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>وەڵامە دروستەکان</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {submissionResult.correct_count}
                </span>
                <span className="text-xs text-slate-500 font-mono">/ {submissionResult.total_questions}</span>
              </div>
              <div className="text-[11px] text-emerald-300/80 font-bold">
                وەڵامی ڕاست و بێ هەڵە
              </div>
            </div>

            {/* 4. Incorrect & Blank Count */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>هەڵە و وەڵامنەدراوە</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2 pt-1 font-mono font-black">
                <span className="text-xl sm:text-2xl text-rose-400">{submissionResult.incorrect_count} <span className="text-[11px] text-slate-400 font-sans font-normal">هەڵە</span></span>
                <span className="text-slate-600">•</span>
                <span className="text-xl sm:text-2xl text-slate-400">{submissionResult.blank_count} <span className="text-[11px] text-slate-400 font-sans font-normal">بەتاڵ</span></span>
              </div>
              <div className="text-[11px] text-slate-400 font-bold">
                پێویست بە خەم ناکات
              </div>
            </div>

          </div>

          {/* Section Divider & Filter for Detailed Review */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <span>پێداچوونەوەی وردی پرسیارەکان و وەڵامە دروستەکان</span>
                </h3>
                <p className="text-xs text-slate-400">
                  بزانە چیت هەڵبژاردبوو و وەڵامی دروستی هەر پرسیارێک چی بوو
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReviewFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  هەمووی ({details.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('CORRECT')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'CORRECT'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  ڕاست ({submissionResult.correct_count})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('INCORRECT')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'INCORRECT'
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  هەڵە ({submissionResult.incorrect_count})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('BLANK')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'BLANK'
                      ? 'bg-slate-700 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  بەتاڵ ({submissionResult.blank_count})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredDetails.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                  هیچ پرسیارێک لەم بەشەدا نییە.
                </div>
              ) : (
                filteredDetails.map((q) => {
                  const hasUserAnswered = Boolean(q.selected_answer);
                  const isCorrect = q.is_correct;

                  return (
                    <div
                      key={q.order_num}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : hasUserAnswered
                          ? 'bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-500/5'
                          : 'bg-slate-900/90 border-slate-800'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          <span>پرسیاری ژمارە {q.order_num}</span>
                        </span>

                        {/* Status Badge */}
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>وەڵامەکەت دروستە (+ نمرە)</span>
                          </span>
                        ) : hasUserAnswered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>وەڵامەکەت هەڵەیە</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/40 text-slate-300 border border-slate-600/40 text-xs font-bold">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>وەڵامت نەداوەتەوە</span>
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="text-base sm:text-lg font-black text-white leading-relaxed mb-3 whitespace-pre-line">
                        {q.question_text}
                      </p>

                      {/* Optional Image */}
                      {q.image_url && (
                        <div className="mb-4">
                          <img
                            src={getUploadUrl(q.image_url)}
                            alt={`پرسیاری ${q.order_num}`}
                            onClick={() => setZoomImage(q.image_url)}
                            className="max-h-48 rounded-xl border border-slate-700 cursor-zoom-in object-contain bg-black/40"
                          />
                        </div>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {[
                          { key: 'A', text: q.option_a },
                          { key: 'B', text: q.option_b },
                          { key: 'C', text: q.option_c },
                          { key: 'D', text: q.option_d }
                        ].map((opt) => {
                          const isTheCorrectOption = q.correct_answer === opt.key;
                          const isStudentSelected = q.selected_answer === opt.key;

                          let cardClasses = 'bg-slate-950/60 border-slate-800 text-slate-300';
                          let badgeClasses = 'bg-slate-800 text-slate-400 border-slate-700';

                          if (isTheCorrectOption && isStudentSelected) {
                            // Student got it right
                            cardClasses = 'bg-emerald-950/50 border-emerald-500/60 text-white ring-1 ring-emerald-500/40';
                            badgeClasses = 'bg-emerald-500 text-slate-950 font-black border-emerald-400';
                          } else if (isTheCorrectOption) {
                            // This was the correct answer, but student picked something else
                            cardClasses = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200';
                            badgeClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                          } else if (isStudentSelected) {
                            // Student picked this and it's wrong
                            cardClasses = 'bg-rose-950/50 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40';
                            badgeClasses = 'bg-rose-500 text-white font-black border-rose-400';
                          }

                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-colors ${cardClasses}`}
                            >
                              <span
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-black shrink-0 ${badgeClasses}`}
                              >
                                {opt.key}
                              </span>

                              <span className="flex-1 text-xs sm:text-sm font-bold leading-relaxed break-words">
                                {opt.text || <span className="text-slate-500 italic">هەڵبژاردنی {opt.key}</span>}
                              </span>

                              {isTheCorrectOption && (
                                <span className="text-[11px] font-black text-emerald-400 shrink-0 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>وەڵامی دروست</span>
                                </span>
                              )}

                              {isStudentSelected && !isTheCorrectOption && (
                                <span className="text-[11px] font-black text-rose-400 shrink-0 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                  <X className="w-3.5 h-3.5" />
                                  <span>وەڵامی تۆ</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onClose && onClose(submissionResult)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>چوون بۆ خشتەی فەرمیی پێشبڕکێ و ڕیزبەندی ماڵپەڕ</span>
            </button>
            <button
              type="button"
              onClick={() => onClose && onClose(submissionResult)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs transition-colors border border-slate-800 cursor-pointer"
            >
              داخستنی ئەم پەڕەیە
            </button>
          </div>

        </div>

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

  // -------------------------------------------------------------
  // VIEW 4: COMPLETED SOMA EXAM (TELEGRAM COUNTDOWN FOR PAPER OMR)
  // -------------------------------------------------------------
  if (isCompleted && !isOnlineMode) {
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
              قوتابی بەڕێز: <span className="font-bold text-amber-300">{studentDisplayName}</span>
            </p>
          </div>

          {/* TELEGRAM SUBMISSION NOTICE BOX */}
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
  // VIEW 5: ACTIVE QUESTION ROOM
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
              {exam?.title}
            </h1>
            <span className="text-[11px] text-slate-400 font-bold">
              بەشداربوو: <span className="text-amber-400">{studentDisplayName}</span>
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
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col items-center justify-start max-w-4xl mx-auto w-full">
        
        <div className="w-full my-auto py-2 space-y-6">

          {/* Question Box Card */}
          <div className="p-5 sm:p-9 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>پرسیاری ژمارە {currentIndex + 1}</span>
              </span>

              <div className="flex items-center gap-3">
                {isOnlineMode && (
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    تاقیکردنەوەی ئۆنلاین • کلیک لە هەر وەڵامێک بکەیت دەڕواتە پرسیاری دواتر
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                  کاتی ماوە: {secondsRemaining} چرکە
                </span>
              </div>
            </div>

            {/* Question Text */}
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

            {/* Multiple Choice Options Grid (ABCD) */}
            {hasOptions && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-xs font-black text-slate-300 flex items-center gap-1.5">
                    <span>هەڵبژاردنەکان (ABCD):</span>
                  </span>
                  {isSelectionAllowed ? (
                    <span className="text-[11px] text-amber-400 font-bold">
                      {selectedOption
                        ? `هەڵبژێردراو: (${selectedOption}) ${isOnlineMode ? '• دەچێتە پرسیاری دواتر...' : ''}`
                        : 'کلیک لەسەر هەڵبژاردنەکەت بکە'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      تەنها پیشاندان • لەسەر فۆڕمی سۆما پڕی بکەرەوە
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {[
                    {
                      key: 'A',
                      text: currentQ.option_a,
                      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                      activeRing: 'border-blue-400 bg-blue-500/25 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400',
                      hoverBorder: 'hover:border-blue-500/50'
                    },
                    {
                      key: 'B',
                      text: currentQ.option_b,
                      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                      activeRing: 'border-emerald-400 bg-emerald-500/25 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400',
                      hoverBorder: 'hover:border-emerald-500/50'
                    },
                    {
                      key: 'C',
                      text: currentQ.option_c,
                      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                      activeRing: 'border-amber-400 bg-amber-500/25 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400',
                      hoverBorder: 'hover:border-amber-500/50'
                    },
                    {
                      key: 'D',
                      text: currentQ.option_d,
                      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                      activeRing: 'border-purple-400 bg-purple-500/25 shadow-lg shadow-purple-500/25 ring-2 ring-purple-400',
                      hoverBorder: 'hover:border-purple-500/50'
                    }
                  ].map((opt) => {
                    const isSelected = selectedOption === opt.key;

                    if (!isSelectionAllowed) {
                      // View-Only Mode
                      return (
                        <div
                          key={opt.key}
                          className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-right bg-slate-900/80 border-slate-800 shadow-sm select-none"
                        >
                          <span
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-sm font-black shrink-0 ${opt.badgeBg}`}
                          >
                            {opt.key}
                          </span>

                          <span className="flex-1 text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words">
                            {opt.text || <span className="text-slate-500 italic">هەڵبژاردنی {opt.key}</span>}
                          </span>
                        </div>
                      );
                    }

                    // Interactive Selectable Mode (with auto-advance feedback)
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-right transition-all group active:scale-[0.98] ${
                          isSelected
                            ? opt.activeRing
                            : `bg-slate-950/80 border-slate-800 ${opt.hoverBorder} hover:bg-slate-900`
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl border flex items-center justify-center font-mono text-sm font-black shrink-0 transition-transform ${
                            isSelected ? 'scale-110' : 'group-hover:scale-105'
                          } ${opt.badgeBg}`}
                        >
                          {opt.key}
                        </span>

                        <span className="flex-1 text-sm sm:text-base font-bold text-white leading-relaxed break-words">
                          {opt.text || <span className="text-slate-500 italic">هەڵبژاردنی {opt.key}</span>}
                        </span>

                        {isSelected && (
                          <div className="flex items-center gap-1.5 text-emerald-400 shrink-0 font-bold text-xs animate-in fade-in zoom-in">
                            <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                            {isOnlineMode && <span className="text-[11px] animate-pulse">تۆمارکرا...</span>}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SOMA MODE NOTICE */}
            {!isOnlineMode && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>
                    تکایە وەڵامی ئەم پرسیارە لەسەر پەڕە سۆماکەت (فۆڕمی وەڵام) بازنەکەی دیاریبکە و پڕی بکەرەوە.
                  </span>
                </div>
                {selectedOption && (
                  <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow">
                    بازنەی ({selectedOption}) پڕبکەرەوە
                  </span>
                )}
              </div>
            )}

          </div>

          {/* Action Footer: Next Question or Submit */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            <div className="text-xs text-slate-400 font-medium text-center sm:text-right">
              <span className="text-rose-400 font-bold">ئاگاداری: </span>
              کاتێک دەچیتە پرسیاری دواتر ناتوانیت بگەڕێیتەوە بۆ ئەم پرسیارە.
            </div>

            <button
              type="button"
              onClick={() => advanceToNextOrSubmit()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>{currentIndex < questions.length - 1 ? 'پرسیاری دواتر' : 'تەواوکردن و بینینی ئەنجامەکان'}</span>
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
