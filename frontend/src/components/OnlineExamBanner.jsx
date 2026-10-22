import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Clock,
  Play,
  Calendar,
  Gift,
  HelpCircle,
  Settings,
  AlertCircle,
  CheckCircle2,
  Lock,
  Timer
} from 'lucide-react';
import api from '../api';

export default function OnlineExamBanner({ onStartExam, onManageExam, isAdmin, onShowToast }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({
    started: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0
  });

  useEffect(() => {
    fetchCurrentExam();
  }, []);

  const fetchCurrentExam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/online-exam/current');
      if (res.data && res.data.id) {
        setExam(res.data);
      }
    } catch (err) {
      // Quiet fail if no exam configured
    } finally {
      setLoading(false);
    }
  };

  // Live Countdown Timer to Start Time
  useEffect(() => {
    if (!exam || !exam.start_time) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const startTime = new Date(exam.start_time).getTime();
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
  }, [exam?.start_time]);

  if (loading || !exam || !exam.is_active) return null;

  const handleButtonClick = () => {
    if (!timeRemaining.started) {
      const formattedDate = new Date(exam.start_time).toLocaleString('ckb', {
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
      onStartExam(exam);
    }
  };

  return (
    <div className="w-full my-4" dir="rtl">
      <div className="relative rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 shadow-2xl overflow-hidden group">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          
          {/* Main Info */}
          <div className="space-y-3 flex-1 min-w-0">
            {/* Top Badge & Live Indicator */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/40 shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>تاقیکردنەوەی ئۆنلاینی فەرمیی KSC</span>
              </span>

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
                {exam.title}
              </h2>
              {exam.description && (
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-2xl mt-1">
                  {exam.description}
                </p>
              )}
            </div>

            {/* Sponsors & Prizes */}
            {exam.sponsors_and_prizes && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium">
                <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{exam.sponsors_and_prizes}</span>
              </div>
            )}

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>ژمارەی پرسیار: {exam.questions_count} پرسیار</span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>کاتی هەر پرسیارێک: {exam.question_duration_seconds} چرکە</span>
              </span>
              {exam.total_duration_minutes > 0 && (
                <span className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>کاتی گشتی: {exam.total_duration_minutes} خولەک</span>
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

      </div>
    </div>
  );
}
