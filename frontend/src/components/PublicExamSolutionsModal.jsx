import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Trophy,
  Loader2,
  HelpCircle,
  Check,
  ExternalLink,
  Award,
  ChevronDown
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function PublicExamSolutionsModal({ exam, onClose, onGoToLeaderboard }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    if (!exam?.id) return;
    fetchSolutions();
  }, [exam?.id]);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/online-exam/exams/${exam.id}/public-solutions`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load solutions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl overflow-hidden flex flex-col text-right">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-black border border-emerald-500/40">
                  کلیلی فەرمیی وەڵامەکان
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {data?.total_questions || exam.questions_count || 0} پرسیار
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white mt-0.5 leading-snug">
                {exam.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Questions Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-xs font-bold">لە بارکردنی پرسیار و وەڵامەکاندا...</p>
            </div>
          ) : !data || data.questions?.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              هیچ پرسیارێک بەردەست نییە.
            </div>
          ) : (
            data.questions.map((q) => (
              <div
                key={q.order_num}
                className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-md"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <span className="font-mono text-xs sm:text-sm font-black text-amber-400">
                    پرسیاری ژمارە {q.order_num}
                  </span>
                  {q.correct_answer && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>وەڵامی دروست: ({q.correct_answer})</span>
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-black text-white leading-relaxed whitespace-pre-line">
                  {q.question_text}
                </p>

                {/* Optional Image */}
                {q.image_url && (
                  <div>
                    <img
                      src={getUploadUrl(q.image_url)}
                      alt={`پرسیاری ${q.order_num}`}
                      onClick={() => setZoomImage(q.image_url)}
                      className="max-h-48 rounded-xl border border-slate-700 cursor-zoom-in object-contain bg-black/40 hover:opacity-95 transition-opacity"
                    />
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d }
                  ].map((opt) => {
                    const isCorrect = q.correct_answer === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition-colors ${
                          isCorrect
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-white ring-1 ring-emerald-500/40'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                            isCorrect
                              ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>

                        <span className="flex-1 text-xs font-bold leading-relaxed break-words">
                          {opt.text || <span className="text-slate-500 italic">هەڵبژاردنی {opt.key}</span>}
                        </span>

                        {isCorrect && (
                          <span className="text-[10px] font-black text-emerald-400 shrink-0 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Check className="w-3 h-3" />
                            <span>دروست</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onGoToLeaderboard) onGoToLeaderboard(exam);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>چوون بۆ بینینی ڕیزبەندی و نمرەکان</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
          >
            داخستن
          </button>
        </div>

        {/* Zoom Image Modal */}
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
    </div>
  );
}
