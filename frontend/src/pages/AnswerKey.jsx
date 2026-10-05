import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import api from '../api';

export default function AnswerKey({ examId, onBack, onShowToast }) {
  const [data, setData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAnswerKey = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/answer-keys/${examId}`);
      setData(res.data);
      setQuestions(res.data.questions || []);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) fetchAnswerKey();
  }, [examId]);

  const handleSelectChoice = (questionNum, choice) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.question_num === questionNum) {
          return {
            ...q,
            correct_answer: q.correct_answer === choice ? null : choice,
            is_ungraded: false
          };
        }
        return q;
      })
    );
  };

  const handleToggleUngraded = (questionNum) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.question_num === questionNum) {
          return {
            ...q,
            is_ungraded: !q.is_ungraded,
            correct_answer: null
          };
        }
        return q;
      })
    );
  };

  const handleSave = async (activateExam = false) => {
    try {
      setSaving(true);
      await api.put(`/answer-keys/${examId}`, {
        questions: questions.map((q) => ({
          question_num: q.question_num,
          correct_answer: q.correct_answer,
          marks: q.marks || 1.0,
          is_ungraded: q.is_ungraded || false
        }))
      });

      if (activateExam) {
        await api.put(`/exams/${examId}`, { status: 'ACTIVE' });
        onShowToast({ type: 'success', message: 'کلیلی وەڵام پاشەکەوت کرا و تاقیکردنەوەکە چالاک کرا' });
      } else {
        onShowToast({ type: 'success', message: 'کلیلی وەڵام بە سەرکەوتوویی پاشەکەوت کرا' });
      }
      fetchAnswerKey();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPattern = (pattern) => {
    const choices = data?.choices || ['A', 'B', 'C', 'D'];
    setQuestions((prev) =>
      prev.map((q, idx) => ({
        ...q,
        correct_answer: choices[idx % choices.length],
        is_ungraded: false
      }))
    );
    onShowToast({ type: 'warning', message: 'شێوازی تاقیکاری دیاریکرا' });
  };

  const handleClearAll = () => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        correct_answer: null,
        is_ungraded: false
      }))
    );
  };

  const choices = data?.choices || ['A', 'B', 'C', 'D'];
  const filledCount = questions.filter((q) => q.correct_answer || q.is_ungraded).length;
  const isComplete = filledCount >= (data?.number_of_questions || 50);

  if (loading) {
    return <div className="text-center py-16 text-slate-400 text-sm">لە بارکردنی کلیلی وەڵامدایە...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-brand-600" />
              <h2 className="text-lg font-extrabold text-slate-900">{data?.exam_name}</h2>
            </div>
            <p className="text-xs text-slate-500">
              دیاریکردنی وەڵامی دروست بۆ هەر {data?.number_of_questions} پرسیارەکە
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پاککردنەوە</span>
          </button>
          <button
            onClick={() => handleQuickPattern()}
            className="px-3 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs transition-colors"
          >
            پڕکردنەوەی نموونەیی
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>پاشەکەوتکردن</span>
          </button>
          {isComplete && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>پاشەکەوت و چالاککردن</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`p-2.5 rounded-xl ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              {filledCount} لە {data?.number_of_questions} پرسیار وەڵامی دیاریکراوە
            </span>
            <span className="text-[11px] text-slate-500">
              {isComplete
                ? 'کلیلی وەڵام تەواوە و ئامادەیە بۆ خوێندنەوەی پەڕەکان'
                : 'تکایە وەڵامی هەموو پرسیارەکان دەستنیشان بکە'}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-64 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-brand-500'}`}
            style={{ width: `${(filledCount / Math.max(1, data?.number_of_questions || 50)) * 100}%` }}
          />
        </div>
      </div>

      {/* Interactive Question Grid Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: Math.ceil(questions.length / 25) }).map((_, colIdx) => {
          const colQuestions = questions.slice(colIdx * 25, (colIdx + 1) * 25);
          return (
            <div
              key={colIdx}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-600">
                <span>پرسیار</span>
                <div className="flex items-center gap-3 pl-2">
                  {choices.map((c) => (
                    <span key={c} className="w-6 text-center">{c}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                {colQuestions.map((q) => (
                  <div
                    key={q.question_num}
                    className={`flex items-center justify-between p-1.5 rounded-xl transition-colors ${
                      q.correct_answer
                        ? 'bg-slate-50/80'
                        : q.is_ungraded
                        ? 'bg-purple-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 font-mono font-bold text-xs text-slate-700">
                        {q.question_num}
                      </span>
                      {q.is_ungraded && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold">
                          بەخشش
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {choices.map((c) => {
                        const isSelected = q.correct_answer === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleSelectChoice(q.question_num, c)}
                            className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition-all transform active:scale-90 ${
                              isSelected
                                ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-600/30'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
