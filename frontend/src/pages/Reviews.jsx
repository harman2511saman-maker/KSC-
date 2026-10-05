import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Save,
  HelpCircle,
  Eye,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function Reviews({ onShowToast, onReviewsUpdated }) {
  const [pendingSheets, setPendingSheets] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageDetails, setPageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review Form Changes: { questionNum: reviewedAnswer }
  const [editedAnswers, setEditedAnswers] = useState({});

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/pending');
      setPendingSheets(res.data);
      if (res.data.length > 0 && !selectedPageId) {
        loadPageDetails(res.data[0].page_id);
      } else if (res.data.length === 0) {
        setPageDetails(null);
        setSelectedPageId(null);
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadPageDetails = async (pageId) => {
    try {
      setDetailsLoading(true);
      setSelectedPageId(pageId);
      const res = await api.get(`/reviews/page-details/${pageId}`);
      setPageDetails(res.data);

      // Initialize edited answers
      const initial = {};
      res.data.questions.forEach((q) => {
        initial[q.question_num] = q.final_answer;
      });
      setEditedAnswers(initial);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectAnswer = (qNum, choice) => {
    setEditedAnswers((prev) => ({
      ...prev,
      [qNum]: prev[qNum] === choice ? null : choice,
    }));
  };

  const handleSubmitReviews = async () => {
    if (!selectedPageId || !pageDetails) return;
    try {
      setSubmitting(true);
      const reviews = Object.entries(editedAnswers).map(([qNum, ans]) => ({
        question_num: parseInt(qNum),
        reviewed_answer: ans,
      }));

      await api.post('/reviews/submit', {
        page_id: selectedPageId,
        reviews,
      });

      onShowToast({ type: 'success', message: 'پێداچوونەوە بە سەرکەوتوویی جێبەجێ کرا و نمرەی نوێ تۆمارکرا' });
      if (onReviewsUpdated) onReviewsUpdated();
      fetchPending();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const choices = pageDetails?.choices || ['A', 'B', 'C', 'D'];

  // Filter questions that were flagged by machine (uncertain, multiple, or borderline)
  const flaggedQuestions = pageDetails?.questions.filter(
    (q) => q.machine_status === 'UNCERTAIN' || q.machine_status === 'MULTIPLE' || q.confidence < 0.85
  ) || [];

  const otherQuestions = pageDetails?.questions.filter(
    (q) => !flaggedQuestions.some((fq) => fq.question_num === q.question_num)
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">پێداچوونەوەی پەڕە و وەڵامە گوماناوییەکان</h2>
        <p className="text-xs text-slate-500">
          تەماشاکردنی بڕگەی وێنەی پرسیارەکان و پەسەندکردنی وەڵامی دروستی دەستنیشانکراو
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">لە بارکردنی پەڕەکانی پێداچوونەوەدایە...</div>
      ) : pendingSheets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">هیچ پەڕەیەک پێویستی بە پێداچوونەوە نییە!</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            هەموو پەڕە خوێندراوەکان بە سەرکەوتوویی و بە وردبینی بەرز خوێندراونەتەوە و ئەنجامەکانیان تۆمارکراون.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pending Sheets List (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3 lg:max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">
                پەڕە چاوەڕوانکراوەکان ({pendingSheets.length})
              </span>
              <button
                onClick={fetchPending}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
              >
                نوێکردنەوە
              </button>
            </div>

            <div className="space-y-2">
              {pendingSheets.map((item) => (
                <button
                  key={item.page_id}
                  onClick={() => loadPageDetails(item.page_id)}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${
                    selectedPageId === item.page_id
                      ? 'border-brand-500 bg-brand-50/50 shadow-xs ring-2 ring-brand-500/20'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                      {item.student_name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      {item.pending_questions_count} پرسیار
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    کۆد: {item.student_code} • {item.exam_name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Active Review Workspace (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {detailsLoading ? (
              <div className="text-center py-16 text-slate-400 text-sm">لە بارکردنی زانیاری پەڕەدایە...</div>
            ) : pageDetails ? (
              <div className="space-y-5">
                {/* Page Info & Action Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {pageDetails.student_name} ({pageDetails.student_code})
                    </h3>
                    <p className="text-xs text-slate-500">
                      تاقیکردنەوە: {pageDetails.exam_name} • نمرەی کاتی: {pageDetails.total_score} ({pageDetails.percentage}%)
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitReviews}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>پاشەکەوتکردنی پێداچوونەوە و نوێکردنەوەی نمرە</span>
                  </button>
                </div>

                {/* Flagged Uncertain Questions (Crop Snippets) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      پرسیارە گوماناوییەکان (وەڵامی فرە، نادیار، یان ڕەساسی کاڵ)
                    </h4>
                  </div>

                  {flaggedQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {flaggedQuestions.map((q) => (
                        <div
                          key={q.question_num}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* Question Number & Machine Prediction */}
                          <div className="space-y-1 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">
                                پرسیاری {q.question_num}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  q.machine_status === 'MULTIPLE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {q.machine_status === 'MULTIPLE' ? 'دوو وەڵام' : 'ناڕوون / کەم تەواو'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              خوێندنەوەی ئامێر: <span className="font-bold text-slate-800">{q.machine_answer || 'بەتاڵ'}</span> (
                              {Math.round(q.confidence * 100)}% دڵنیایی)
                            </p>
                          </div>

                          {/* Cropped Image Snippet */}
                          {q.crop_image_path ? (
                            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs p-1">
                              <img
                                src={getUploadUrl(`/uploads/debug/${q.crop_image_path}`)}
                                alt={`Row Crop Q${q.question_num}`}
                                className="max-h-16 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">وێنەی بڕگە بەردەست نییە</div>
                          )}

                          {/* Teacher Correction Buttons */}
                          <div className="flex items-center gap-1.5 self-end md:self-auto">
                            <span className="text-xs font-bold text-slate-600 pl-2">وەڵامی دروست:</span>
                            {choices.map((c) => {
                              const isSelected = editedAnswers[q.question_num] === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleSelectAnswer(q.question_num, c)}
                                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all transform active:scale-95 ${
                                    isSelected
                                      ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-600/30'
                                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {c}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleSelectAnswer(q.question_num, null)}
                              className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                                editedAnswers[q.question_num] === null
                                  ? 'bg-slate-800 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              بەتاڵ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">هیچ پرسیارێکی گوماناوی نییە.</p>
                  )}
                </div>

                {/* Scanned Sheet Normalized Image Reference */}
                {pageDetails.debug_file && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <span className="font-bold text-xs text-slate-800 block">پەڕەی سکانکراوی پەستانراوە:</span>
                    <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 p-2 bg-slate-50">
                      <img
                        src={getUploadUrl(`/uploads/debug/${pageDetails.debug_file}`)}
                        alt="Sheet Debug"
                        className="w-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
