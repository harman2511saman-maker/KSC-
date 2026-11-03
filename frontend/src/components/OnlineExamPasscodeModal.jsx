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
  Phone,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Search,
  Ticket,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import api from '../api';

export default function OnlineExamPasscodeModal({ exam, onClose, onSuccess, onShowToast }) {
  const cutoffMins = exam.entry_cutoff_minutes || 3;
  const isOnlineMode = exam?.exam_mode !== 'SOMA';

  // Check if exam has already started
  const examStartTime = exam?.start_time ? new Date(exam.start_time).getTime() : 0;
  const isExamStarted = examStartTime > 0 && Date.now() >= examStartTime;

  // Local Storage Key for this exam
  const storageKey = `ksc_online_reg_${exam.id}`;

  // Mode: 'voucher' (if code is saved) | 'register' | 'enter' | 'lookup'
  const [activeTab, setActiveTab] = useState('register');
  const [savedVoucher, setSavedVoucher] = useState(null);
  const [copied, setCopied] = useState(false);

  // Register state
  const [regPhone, setRegPhone] = useState('');
  const [regName, setRegName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Enter / Passcode state
  const [passcode, setPasscode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  // Feedback messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const checkTimerRef = useRef(null);

  // Load saved voucher from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code) {
          setSavedVoucher(parsed);
          setPasscode(parsed.code);
          if (parsed.student_name) setStudentName(parsed.student_name);
          setActiveTab('voucher');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read saved registration', e);
    }

    // Default tab based on exam start status
    if (isExamStarted) {
      setActiveTab('enter');
    } else {
      setActiveTab('register');
    }
  }, [exam.id, isExamStarted, storageKey]);

  // Debounce check passcode when user types in 'enter' tab
  useEffect(() => {
    if (activeTab !== 'enter') return;

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    const cleanCode = passcode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 5) {
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
  }, [passcode, exam.id, activeTab]);

  // Handle Copy Voucher Code
  const handleCopyCode = (codeToCopy) => {
    const code = codeToCopy || savedVoucher?.code || passcode;
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (onShowToast) {
      onShowToast({ type: 'success', message: 'کۆدی تاقیکردنەوە کۆپیکرا' });
    }
  };

  // 1. SUBMIT REGISTRATION
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = regPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
    const cleanName = regName.trim();

    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('تکایە ژمارەی مۆبایلەکەت بە درووستی بنووسە (لانیکەم ١٠ ژمارە).');
      return;
    }

    if (!cleanName) {
      setErrorMessage('تکایە ناوی سیانی خۆت بنووسە.');
      return;
    }

    const words = cleanName.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setErrorMessage('تکایە ناوی سیانی خۆت بە تەواوی بنووسە (لانیکەم ناو و باوک یان ناوی سیانی).');
      return;
    }

    try {
      setRegistering(true);
      const res = await api.post('/online-exam/register', {
        exam_id: exam.id,
        student_name: cleanName,
        student_phone: cleanPhone
      });

      if (res.data?.success) {
        const voucherData = {
          code: res.data.code,
          student_name: res.data.student_name,
          student_phone: res.data.student_phone,
          start_time: res.data.start_time,
          registration_deadline: res.data.registration_deadline,
          exam_title: exam.title,
          is_used: res.data.is_used
        };

        // Save to localStorage for instant retrieval across browser refreshes
        try {
          localStorage.setItem(storageKey, JSON.stringify(voucherData));
        } catch (e) {
          console.warn('localStorage save failed', e);
        }

        setSavedVoucher(voucherData);
        setPasscode(res.data.code);
        setStudentName(res.data.student_name);
        setActiveTab('voucher');

        if (res.data.already_registered) {
          setSuccessMessage('🔒 ئەم ژمارەیە پێشتر تۆمارکراوە؛ ئەمەش کۆدی فەرمیی تۆیە:');
        } else {
          setSuccessMessage('🎉 پیرۆزە! بە سەرکەوتوویی تۆمارکرایت و کۆدەکەت ئامادەکرا:');
        }
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'هەڵەیەک ڕوویدا لە کاتی تۆماربووندا';
      setErrorMessage(detail);
      if (onShowToast) {
        onShowToast({ type: 'error', message: detail });
      }
    } finally {
      setRegistering(false);
    }
  };

  // 2. SUBMIT LOOKUP
  const handleLookup = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPhone = lookupPhone.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('تکایە ژمارەی مۆبایلی درووست بنووسە.');
      return;
    }

    try {
      setLookingUp(true);
      const res = await api.get('/online-exam/lookup-passcode', {
        params: { exam_id: exam.id, phone: cleanPhone }
      });

      if (res.data?.found) {
        const voucherData = {
          code: res.data.code,
          student_name: res.data.student_name,
          student_phone: res.data.student_phone,
          exam_title: exam.title,
          is_used: res.data.is_used
        };

        try {
          localStorage.setItem(storageKey, JSON.stringify(voucherData));
        } catch (e) {}

        setSavedVoucher(voucherData);
        setPasscode(res.data.code);
        if (res.data.student_name) setStudentName(res.data.student_name);
        setActiveTab('voucher');
        setSuccessMessage('✅ کۆدەکەت بە سەرکەوتوویی دۆزرایەوە!');
      } else {
        setErrorMessage(res.data?.message || 'هیچ کۆدێک بەم ژمارەی مۆبایلە تۆمار نەکراوە.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'کێشەیەک لە گەڕان ڕوویدا';
      setErrorMessage(detail);
    } finally {
      setLookingUp(false);
    }
  };

  // 3. ENTER / START EXAM WITH PASSCODE
  const handleEnterExam = async (e = null, codeOverride = null, nameOverride = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    const cleanCode = (codeOverride || passcode || savedVoucher?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('تکایە کۆدی تایبەت (پاسوۆرد) بنووسە');
      return;
    }

    const currentName = (nameOverride || studentName || savedVoucher?.student_name || '').trim();
    if (!isNameLocked && !currentName) {
      setErrorMessage('تکایە ناوی سیانی خۆت بنووسە بۆ تۆمارکردن لە ئەنجامەکان.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/online-exam/verify-passcode', {
        exam_id: exam.id,
        code: cleanCode,
        student_name: isNameLocked ? undefined : currentName
      });

      if (res.data?.success) {
        if (onShowToast) {
          onShowToast({ type: 'success', message: 'بە سەرکەوتوویی چوویە ناو تاقیکردنەوە' });
        }
        onSuccess({
          ...res.data,
          code: cleanCode,
          passcode_code: cleanCode,
          student_name: res.data.student_name || currentName
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl p-5 sm:p-7 space-y-5 overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-24 bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                تاقیکردنەوەی فەرمیی ئۆنلاینی KSC
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

        {/* Mode Switcher Tabs (Hidden when in Voucher View) */}
        {activeTab !== 'voucher' && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>خۆتۆمارکردن</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('enter');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'enter'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>چوونەژوورەوە بە کۆد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('lookup');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>دۆزینەوەی کۆد</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: VOUCHER CARD (Saved / Registered Code Display)   */}
        {/* ======================================================== */}
        {activeTab === 'voucher' && savedVoucher && (
          <div className="space-y-4 animate-fadeIn">
            {/* Glowing Digital Voucher Card */}
            <div className="relative rounded-3xl p-5 bg-gradient-to-br from-amber-500/15 via-slate-900 to-indigo-950/60 border-2 border-amber-500/50 shadow-2xl overflow-hidden space-y-4">
              
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>کارتی فەرمیی بەشداریکردن (Voucher)</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                  تۆمارکراو لە سیستەم
                </span>
              </div>

              {/* Passcode Box with 1-Click Copy */}
              <div className="text-center space-y-1.5 py-1">
                <span className="text-[11px] font-bold text-slate-300 block">
                  کۆدی تایبەتی تاقیکردنەوەت:
                </span>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="px-5 py-3 rounded-2xl bg-slate-950/90 border-2 border-amber-400 text-xl sm:text-2xl font-mono font-black text-amber-300 tracking-widest shadow-inner select-all"
                    dir="ltr"
                  >
                    {savedVoucher.code}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(savedVoucher.code)}
                    className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 shadow-lg shadow-amber-500/30 transition-all font-black flex items-center justify-center"
                    title="کۆپیکردنی کۆد"
                  >
                    {copied ? <Check className="w-5 h-5 text-slate-950" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Candidate Info Details */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ناوی قوتابی:</span>
                  <span className="font-bold text-white truncate block mt-0.5">
                    {savedVoucher.student_name}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ژمارەی مۆبایل:</span>
                  <span className="font-mono font-bold text-amber-300 truncate block mt-0.5" dir="ltr">
                    {savedVoucher.student_phone}
                  </span>
                </div>
              </div>

              {/* Status / Instructions based on start time */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                {isExamStarted ? (
                  <p className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تاقیکردنەوە دەستی پێکردووە! دەتوانیت ئێستا بە دوگمەی خوارەوە بچیتە ژوورەوە.</span>
                  </p>
                ) : (
                  <p className="text-amber-200 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      کۆدەکەت پارێزراوە لەسەر ئەم ئامێرە؛ کاتێک تاقیکردنەوە دەستی پێکرد لێرەوە ڕاستەوخۆ دەچیتە ناوەوە.
                    </span>
                  </p>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            {isExamStarted ? (
              <button
                type="button"
                onClick={() => handleEnterExam(null, savedVoucher.code, savedVoucher.student_name)}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 ring-2 ring-emerald-400/50 transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>چوونە ناو تاقیکردنەوە بەم کۆدە 🚀</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>پاشەکەوتکراوە • چاوەڕوانی کاتی دەستپێکردن بن</span>
              </button>
            )}

            {/* Switch / Reset Option */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('enter');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="hover:text-amber-300 transition-colors underline underline-offset-4"
              >
                چوونەژوورەوە بە کۆدێکی تر
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="hover:text-amber-300 transition-colors"
              >
                + تۆمارکردنی ژمارەیەکی تر
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: REGISTRATION TAB                                 */}
        {/* ======================================================== */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
            {/* Registration Deadline Banner if set */}
            {exam.registration_deadline && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  دوا وادەی خۆتۆمارکردن:{' '}
                  <strong className="text-white">
                    {new Date(exam.registration_deadline).toLocaleString('ckb', {
                      timeZone: 'Asia/Baghdad',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </strong>
                </span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>ژمارەی مۆبایل:</span>
                  <span className="text-rose-400 font-black">*</span>
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => {
                    setRegPhone(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="0750XXXXXXX یان 0770XXXXXXX"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base font-mono font-bold text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  🔒 هەر ژمارەی مۆبایلێک تەنها یەک کۆدی پێدەدرێت بۆ پاراستنی دادپەروەریی تاقیکردنەوە.
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ناوی سیانی بەشداربوو:</span>
                  <span className="text-rose-400 font-black">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="نموونە: ئارام سەردار عەلی"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                <span className="text-[11px] text-slate-400 block">
                  ئەم ناوە لەسەر کارتی کۆتایی و خشتەی ڕیزبەندی ماڵپەڕ تۆمار دەکرێت.
                </span>
              </div>
            </div>

            {/* Anti-cheat & Instructions */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs space-y-1.5">
              <div className="font-black text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>ڕێنمایی بۆ بەشداربووان:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pr-1">
                <li>پاش کلیک، ڕاستەوخۆ کۆدی تایبەتی تاقیکردنەوەت بۆ دروست دەکرێت.</li>
                <li>کۆدەکەت لەسەر ئەم ئامێرە دەمێنێتەوە تەنانەت ئەگەر پەڕەکەش تازە بکەیتەوە.</li>
                <li>کاتێک تاقیکردنەوە دەستی پێکرد دەتوانیت دەستبەجێ بەشدار بیت.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {registering ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
              ) : (
                <Ticket className="w-5 h-5" />
              )}
              <span>خۆتۆمارکردن و وەرگرتنی کۆد 🎫</span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: ENTER PASSCODE TAB                               */}
        {/* ======================================================== */}
        {activeTab === 'enter' && (
          <form onSubmit={handleEnterExam} className="space-y-4 animate-fadeIn">
            {/* Passcode input */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>کۆدی تایبەت (پاسوۆرد):</span>
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

            {/* Student Name */}
            {isNameLocked ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>ناوی بەشداربوو (قوفڵکراو لەلایەن ئەدمین):</span>
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
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ناوی سیانی بەشداربوو:</span>
                    <span className="text-rose-400 font-black text-xs">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="ناوی سیانی خۆت بنووسە"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>
            )}

            {/* Time Window Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-bold leading-relaxed">
                لە کاتی دەستپێکردن تەنها <span className="text-amber-400 font-black">{cutoffMins} خولەک</span> مۆڵەتت هەیە بۆ چوونەژوورەوە؛ دوای ئەوە دەرگا دادەخرێت.
              </span>
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
        )}

        {/* ======================================================== */}
        {/* VIEW 4: LOOKUP PASSCODE BY PHONE NUMBER                  */}
        {/* ======================================================== */}
        {activeTab === 'lookup' && (
          <form onSubmit={handleLookup} className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>ژمارەی مۆبایلەکەت بنووسە بۆ دۆزینەوەی کۆدەکەت:</span>
              </label>
              <input
                type="tel"
                value={lookupPhone}
                onChange={(e) => {
                  setLookupPhone(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="07XXXXXXXXX"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-base font-mono font-bold text-amber-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
                dir="ltr"
              />
              <span className="text-[11px] text-slate-400 block leading-relaxed">
                ئەگەر پێشتر خۆت تۆمار کردبێت یان لەلایەن ئەدمینەوە زیاد کرابیت، سیستەمەکە کۆدەکەت بۆ دەدۆزێتەوە.
              </span>
            </div>

            <button
              type="submit"
              disabled={lookingUp}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {lookingUp ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>گەڕان بەدوای کۆدەکەمدا</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
