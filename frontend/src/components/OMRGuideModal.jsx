import React from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, PenTool, ShieldAlert, FileText } from 'lucide-react';

export default function OMRGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative text-right text-white max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ڕێنمایی فەرمیی پڕکردنەوەی فۆڕمی وەڵام (OMR)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تکایە بە وردی ئەم خاڵانە جێبەجێ بکەن تا هەموو نمرەکانتان بە تەواوی بخوێنرێنەوە
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Comparison: Correct vs Incorrect */}
        <div className="my-6 space-y-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-amber-400" />
            <span>شێوازی پڕکردنەوەی بڵقی وەڵامەکان:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Correct Method */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>شێوازی تەواو و دروست ✅</span>
              </div>

              <div className="flex items-center justify-center gap-3 py-3 bg-slate-900/90 rounded-xl border border-emerald-500/20">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-slate-100 shadow-sm" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-300">A</span>
                </div>
                <span className="text-xs text-slate-300 pr-2">ڕەشکردنەوەی تەواوی بازنەکە</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                تەنها یەک بازنە هەڵبژێرە و ناوەکەی بە تەواوی بە قەڵەمی جافی تۆخ پڕبکەرەوە.
              </p>
            </div>

            {/* Incorrect Methods */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3 shadow-inner">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>شێوازە هەڵەکان (نمرەت دەفەوتێنێت) ❌</span>
              </div>

              <div className="flex items-center justify-around py-2.5 bg-slate-900/90 rounded-xl border border-rose-500/20">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full border border-rose-400 flex items-center justify-center text-rose-400 font-bold text-sm">✓</div>
                  <span className="text-[10px] text-rose-300">نیشانەی ڕاست</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full border border-rose-400 flex items-center justify-center text-rose-400 font-bold text-sm">✕</div>
                  <span className="text-[10px] text-rose-300">هێمای خاچ</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full border border-rose-400 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  </div>
                  <span className="text-[10px] text-rose-300">خاڵی بچووک</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-7 h-7 rounded-full border border-rose-400 overflow-hidden">
                    <div className="w-3.5 h-7 bg-rose-400" />
                  </div>
                  <span className="text-[10px] text-rose-300">نیوەڕەش</span>
                </div>
              </div>

              <p className="text-xs text-rose-200 leading-relaxed">
                بە هیچ جۆرێک خەت، خاچ، یان دوو وەڵام پڕمەکەرەوە، چونکە کامێرا نایخوێنێتەوە.
              </p>
            </div>

          </div>
        </div>

        {/* Essential Rules List */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>یاسا گرنگەکانی پاراستنی لاپەڕەی وەڵام:</span>
          </h4>

          <ul className="space-y-2 text-xs text-slate-400 pr-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>قەڵەمی جافی شین یان ڕەش بەکاربهێنە:</strong> قەڵەمی دار یان ڕەساسی کاڵ دەبێتە هۆی لاوازی لە ناسینەوەی وەڵام.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>چوارگۆشە ڕەشەکانی چوار دەوری لاپەڕەکە بپارێزە:</strong> ئەم چوارگۆشانە هاوێنەی کامێران؛ نابێت بدڕێن، لەسەریان بنووسرێت، یان چرچ بن.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>دوو وەڵام بۆ یەک پرسیار دیاری مەکە:</strong> ئەگەر دوو بڵق پڕبکەیتەوە، سیستەمی زیرەک دەستبەجێ نمرەکەت دەکاتە سفر.</span>
            </li>
          </ul>
        </div>

        {/* Footer Button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
          >
            تێگەیشتم، سوپاس
          </button>
        </div>

      </div>
    </div>
  );
}
