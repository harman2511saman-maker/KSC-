import React, { useState } from 'react';
import {
  X,
  Key,
  User,
  Phone,
  AlertTriangle,
  Play,
  Loader2,
  FileText,
  ShieldAlert
} from 'lucide-react';
import api from '../api';

export default function OnlineExamPasscodeModal({ exam, onClose, onSuccess, onShowToast }) {
  const [passcode, setPasscode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!passcode.trim()) {
      setErrorMessage('تکایە کۆدی تایبەت (پاسوۆرد) بنووسە');
      return;
    }
    if (!studentName.trim()) {
      setErrorMessage('تکایە ناوی سیانی خۆت بنووسە');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/online-exam/verify-passcode', {
        exam_id: exam.id,
        code: passcode.trim(),
        student_name: studentName.trim(),
        student_phone: studentPhone.trim() || undefined
      });

      if (res.data?.success) {
        if (onShowToast) {
          onShowToast({ type: 'success', message: 'بە سەرکەوتوویی چوویە ناو تاقیکردنەوە' });
        }
        onSuccess(res.data);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden">
        
        {/* Ambient Top Light */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-24 bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                چوونەژوورەوە بۆ تاقیکردنەوە
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
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Passcode input */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>پاسوۆردی تاقیکردنەوە (کۆدی تایبەتی بەشداربوون):</span>
            </label>
            <input
              type="text"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.toUpperCase())}
              placeholder="نموونە: KSC-9482-XA"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-base font-mono font-black text-amber-300 tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
              dir="ltr"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              ئەم پاسوۆردە تایبەتە و تەنها یەکجار کار دەکات بۆ یەک بەشداربوو.
            </span>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>ناوی سیانی قوتابی:</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="ناوی سیانی بنووسە..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Student Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>ژمارەی مۆبایل یان پەیوەندی (ئارەزوومەندانە):</span>
            </label>
            <input
              type="tel"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="0750 000 0000"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              dir="ltr"
            />
          </div>

          {/* Crucial Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs space-y-1.5">
            <div className="font-black text-amber-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>یاساکانی بەشداریکردن و ڕێگری لە قۆپیەکردن:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pr-1">
              <li>پەڕەی سۆمای چاپکراو (فۆڕمی وەڵام) و قەڵەمی جاف لە بەردەمتدا ئامادە بکە.</li>
              <li>پرسیارەکان چرکەیان هەیە و ناگەڕێتەوە بۆ پرسیاری پێشوو.</li>
              <li className="text-rose-300 font-bold">گۆڕینی تاب، بەجێهێشتنی پلاتفۆرم، یان کردنەوەی بەرنامەی تر دەستبەجێ بە غەشکردن هەژمار دەکرێت و لە تاقیکردنەوە دەردەکرێیت.</li>
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
