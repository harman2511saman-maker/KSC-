import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Key,
  AlertTriangle,
  Play,
  Loader2,
  Clock,
  ShieldAlert,
  FileText,
  Lock,
  User,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import api from '../api';

export default function OnlineExamPasscodeModal({ exam, onClose, onSuccess, onShowToast }) {
  const [passcode, setPasscode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeInfo, setCodeInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const cutoffMins = exam.entry_cutoff_minutes || 3;
  const isOnlineMode = exam?.exam_mode !== 'SOMA';
  const checkTimerRef = useRef(null);

  // Debounce check passcode when user types
  useEffect(() => {
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    const cleanCode = passcode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 5) {
      setCodeInfo(null);
      setIsNameLocked(false);
      return;
    }

    checkTimerRef.current = setTimeout(async () => {
      try {
        setCheckingCode(true);
        const res = await api.get('/online-exam/check-passcode', {
          params: { exam_id: exam.id, code: cleanCode }
        });

        if (res.data?.found) {
          setCodeInfo(res.data);
          if (res.data.is_used) {
            setErrorMessage('ئەم کلیلە پێشتر بەکارهاتووە! هەر کلیلێک تەنها یەک بەشداربوو بۆی هەیە بەکاریبهێنێت.');
          } else if (res.data.disqualified) {
            setErrorMessage('ئەم کلیلە لە تاقیکردنەوە دەرکراوە بەهۆی سەرپێچی یان غەشکردنەوە.');
          } else if (res.data.has_admin_name) {
            setIsNameLocked(true);
            setStudentName(res.data.student_name);
            setErrorMessage('');
          } else {
            setIsNameLocked(false);
            setErrorMessage('');
          }
        } else {
          setCodeInfo(null);
          setIsNameLocked(false);
          if (cleanCode.length >= 10) {
            setErrorMessage('پاسوۆردەکە هەڵەیە یان لەم تاقیکردنەوەیە بوونی نییە.');
          }
        }
      } catch (err) {
        console.error('Error checking passcode:', err);
      } finally {
        setCheckingCode(false);
      }
    }, 350);

    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
      }
    };
  }, [passcode, exam.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCode = passcode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('تکایە کۆدی تایبەت (پاسوۆرد) بنووسە');
      return;
    }

    // If admin has NOT locked the name, participant MUST enter their full triple name
    if (!isNameLocked) {
      const cleanName = studentName.trim();
      if (!cleanName) {
        setErrorMessage('تکایە ناوی سیانی خۆت بنووسە بۆ ئەوەی لە ئەنجامەکان و ڕیزبەندی بە ناوی خۆت تۆمار بکرێت.');
        return;
      }
      const words = cleanName.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        setErrorMessage('تکایە ناوی سیانی خۆت بە تەواوی بنووسە (لانیکەم ناو و باوک یان ناوی سیانی).');
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.post('/online-exam/verify-passcode', {
        exam_id: exam.id,
        code: cleanCode,
        student_name: isNameLocked ? undefined : studentName.trim()
      });

      if (res.data?.success) {
        if (onShowToast) {
          onShowToast({ type: 'success', message: 'بە سەرکەوتوویی چوویە ناو تاقیکردنەوە' });
        }
        onSuccess({
          ...res.data,
          code: cleanCode,
          passcode_code: cleanCode,
          student_name: res.data.student_name || studentName.trim()
        });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'پاسوۆردەکە هەڵەیە یان بەکارهاتووە';
      setErrorMessage(detail);
      if (onShowToast) {
        onShowToast({ type: 'error', message: detail });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden">
        
        {/* Ambient Top Light */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-24 bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                چوونەژوورەوەی تاقیکردنەوەی ئۆنلاین
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">
                {exam.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Passcode input */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>پاسوۆردی تایبەتی بەشداریکردن (کۆد / کلیل):</span>
              </label>
              {checkingCode && (
                <span className="text-[11px] text-amber-400/80 flex items-center gap-1 font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  پشکنینی کۆد...
                </span>
              )}
            </div>
            <input
              type="text"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value.toUpperCase());
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="نموونە: KSC-9482-XA"
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border-2 border-amber-500/40 text-lg font-mono font-black text-amber-300 tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 uppercase placeholder:text-slate-600"
              dir="ltr"
            />
          </div>

          {/* Student Name Section: LOCKED IF ADMIN PRE-ASSIGNED, REQUIRED TRIPLE NAME IF UNASSIGNED */}
          {isNameLocked ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>ناوی بەشداربوو (قوفڵکراوە لەلایەن ئەدمین):</span>
                </label>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  قوفڵکراو بە کلیل
                </span>
              </div>
              <input
                type="text"
                value={studentName}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-sm font-black text-amber-200 cursor-not-allowed select-none shadow-inner"
              />
              <p className="text-[11px] text-amber-300/80 leading-relaxed font-medium">
                🔒 ئەم کلیلە لەلایەن ئەدمینەوە بە ناوی فەرمیی «{studentName}» قوفڵکراوە؛ ناوەکە دەستکاری ناکرێت و ڕاستەوخۆ دەچێتە سەر کارتی ئەنجام و ڕیزبەندی.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ناوی سیانی بەشداربوو:</span>
                  <span className="text-rose-400 font-black text-xs">* (پێویستە)</span>
                </label>
                <span className="text-[10px] text-indigo-300 font-bold px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/20">
                  ناوی سیانیت بنووسە
                </span>
              </div>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="ناوی سیانی خۆت بنووسە (نموونە: ئارام سەردار عەلی)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isOnlineMode
                  ? '✨ ئەم ناوە یەکسەر دەخرێتە ناو خشتەی فەرمیی ئەنجامەکان و پێشبڕکێ و ڕیزبەندی ماڵپەڕ.'
                  : 'لە تاقیکردنەوەی سۆما ناوی خۆت لەسەر پەڕەی سۆماش دەنووسیت.'}
              </p>
            </div>
          )}

          {/* Time Window Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold leading-relaxed">
              لە کاتی دەستپێکردن تەنها <span className="text-amber-400 font-black">{cutoffMins} خولەک</span> مۆڵەتت هەیە بۆ چوونەژوورەوە؛ دوای ئەوە دەرگا دادەخرێت.
            </span>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs space-y-1.5">
            <div className="font-black text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>یاساکانی بەشداریکردن و ڕێگری لە قۆپیەکردن:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pr-1">
              {isOnlineMode ? (
                <>
                  <li>ئەم تاقیکردنەوەیە بەبێ پەڕەی سۆمایە و یەکسەر لەسەر شاشە وەڵام دەدەیتەوە.</li>
                  <li>کلیک لە هەر هەڵبژاردنێک بکەیت دیاری دەکرێت و دەچێتە پرسیاری دواتر.</li>
                  <li>لە کۆتاییدا یەکسەر نمرە و پلەت دەبینیت و دەچیتە ناو ڕیزبەندی ماڵپەڕ.</li>
                </>
              ) : (
                <>
                  <li>پەڕەی سۆمای چاپکراو (فۆڕمی وەڵام) و قەڵەمی جاف لە بەردەمتدا ئامادە بکە.</li>
                  <li>دوای تەواوبوون، وێنەی پەڕەی سۆماکەت بە فایل دەنێریت بۆ تێلیگرام.</li>
                </>
              )}
              <li>پرسیارەکان چرکەیان هەیە و ناگەڕێتەوە بۆ پرسیاری پێشوو.</li>
              <li className="text-rose-300 font-bold">گۆڕینی تاب، بەجێهێشتنی پەڕە، یان کردنەوەی بەرنامەی تر دەستبەجێ بە غەش هەژمار دەکرێت و دەردەکرێیت.</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
            <span>دەستپێکردن و چوونە ناو تاقیکردنەوە</span>
          </button>

        </form>

      </div>
    </div>
  );
}
