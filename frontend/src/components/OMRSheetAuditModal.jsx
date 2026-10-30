import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  Layers,
  FileText
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getUploadUrl } from '../api';

export default function OMRSheetAuditModal({ isOpen, onClose, result }) {
  const { t, isRTL, lang } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'correct', 'incorrect', 'multiple', 'blank'

  if (!isOpen || !result) return null;

  const rawSheetPath = result.sheet_url || (result.debug_file ? `/uploads/debug/${result.debug_file}` : (result.normalized_file ? `/uploads/normalized/${result.normalized_file}` : null));
  const sheetImageUrl = rawSheetPath ? getUploadUrl(rawSheetPath) : null;
  const answers = result.answers || [];

  const correctCount = answers.filter((a) => a.is_correct || a.eval_status === 'CORRECT').length;
  const incorrectCount = answers.filter((a) => a.eval_status === 'INCORRECT').length;
  const multipleCount = answers.filter((a) => a.eval_status === 'MULTIPLE' || a.machine_status === 'MULTIPLE').length;
  const blankCount = answers.filter((a) => a.eval_status === 'BLANK' || a.machine_status === 'BLANK').length;

  const filteredAnswers = answers.filter((a) => {
    if (activeFilter === 'correct') return a.is_correct || a.eval_status === 'CORRECT';
    if (activeFilter === 'incorrect') return a.eval_status === 'INCORRECT';
    if (activeFilter === 'multiple') return a.eval_status === 'MULTIPLE' || a.machine_status === 'MULTIPLE';
    if (activeFilter === 'blank') return a.eval_status === 'BLANK' || a.machine_status === 'BLANK';
    return true;
  });

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[96vh] bg-[#080d1a] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-800 bg-[#0d1527]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>{t('omrAuditTitle')}</span>
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {t('sheetTransparencyBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{result.student_name || 'قوتابی'}</span>
                <span>•</span>
                <span className="font-mono text-amber-400">{result.student_code}</span>
                <span>•</span>
                <span>{result.exam_name || 'تاقیکردنەوە'}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={t('zoomIn')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={t('zoomOut')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              title={t('zoomReset')}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleRotate}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={t('rotateSheet')}
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={t('printSheet')}
            >
              <Printer className="w-4 h-4" />
            </button>
            {sheetImageUrl && (
              <a
                href={sheetImageUrl}
                download={`OMR_Sheet_${result.student_code || 'result'}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                title={t('downloadSheet')}
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 inline-block shadow-sm shadow-emerald-500/50" />
              <span>{t('auditLegendCorrect')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-300 inline-block shadow-sm shadow-rose-500/50" />
              <span>{t('auditLegendWrong')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-400">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-500 border border-slate-400 inline-block" />
              <span>{t('auditLegendBlank')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg font-bold">
              نمرە: {result.total_score} / {result.max_score} ({result.percentage}%)
            </span>
          </div>
        </div>

        {/* Main Split Body: Left = High-Res Scanned Sheet, Right = Question List */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column (7 cols): High-Resolution Scanned OMR Sheet */}
          <div className="lg:col-span-7 bg-slate-950/90 p-4 overflow-auto flex items-center justify-center relative min-h-[350px] border-b lg:border-b-0 lg:border-r border-slate-800">
            {sheetImageUrl ? (
              <div
                className="transition-transform duration-200 ease-out origin-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={sheetImageUrl}
                  alt="Scanned OMR Sheet"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800 select-none pointer-events-auto"
                />
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-white">{t('digitalExamNotice')}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  ئەم بەشداریکردنە بە شێوازی دیجیتاڵ بووە؛ وەڵامەکان لە ستۆدیۆی خوارەوە تۆمارکراون.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Question-by-Question Audit Table */}
          <div className="lg:col-span-5 flex flex-col bg-[#080d1a] min-h-0">
            {/* Filter Pills */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400">
                {t('auditQuestionNum')} ({answers.length})
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  هەموو
                </button>
                <button
                  onClick={() => setActiveFilter('correct')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    activeFilter === 'correct'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                  }`}
                >
                  <span>{correctCount}</span>
                  <span>ڕاست</span>
                </button>
                <button
                  onClick={() => setActiveFilter('incorrect')}
                  className={`px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                    activeFilter === 'incorrect'
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/60'
                  }`}
                >
                  <span>{incorrectCount}</span>
                  <span>هەڵە</span>
                </button>
                {multipleCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('multiple')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                      activeFilter === 'multiple'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-950/40 text-orange-400 hover:bg-orange-900/60'
                    }`}
                  >
                    <span>{multipleCount}</span>
                    <span>دوو وەڵام</span>
                  </button>
                )}
                {blankCount > 0 && (
                  <button
                    onClick={() => setActiveFilter('blank')}
                    className={`px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                      activeFilter === 'blank'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span>{blankCount}</span>
                    <span>بەتاڵ</span>
                  </button>
                )}
              </div>
            </div>

            {/* Questions Table / List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredAnswers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  هیچ پرسیارێک لەم دۆخەدا نییە
                </div>
              ) : (
                filteredAnswers.map((a) => {
                  const isCorrect = a.is_correct || a.eval_status === 'CORRECT';
                  const isMultiple = a.eval_status === 'MULTIPLE' || a.machine_status === 'MULTIPLE';
                  const isBlank = a.eval_status === 'BLANK' || a.machine_status === 'BLANK';

                  return (
                    <div
                      key={a.question_num}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        isCorrect
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : isMultiple
                          ? 'bg-orange-950/20 border-orange-500/30 text-orange-300'
                          : isBlank
                          ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 font-mono font-black text-xs text-white flex items-center justify-center shrink-0">
                          {a.question_num}
                        </span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{t('auditStudentAnswer')}:</span>
                            <span className="px-2 py-0.5 rounded-md font-mono font-black bg-slate-800 text-white">
                              {isMultiple ? '⚠️ دوو وەڵام' : (a.student_answer || a.final_answer || '—')}
                            </span>
                          </div>
                          {a.correct_answer && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              <span>{t('auditCorrectAnswer')}:</span>{' '}
                              <strong className="text-emerald-400 font-mono">{a.correct_answer}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCorrect ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded-xl">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>دروست (+1)</span>
                          </div>
                        ) : isMultiple ? (
                          <div className="flex items-center gap-1 text-orange-400 font-bold text-xs bg-orange-500/10 px-2 py-1 rounded-xl">
                            <AlertCircle className="w-4 h-4" />
                            <span>دوو بازنە (0)</span>
                          </div>
                        ) : isBlank ? (
                          <div className="flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-800 px-2 py-1 rounded-xl">
                            <HelpCircle className="w-4 h-4" />
                            <span>بەتاڵ (0)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-1 rounded-xl">
                            <XCircle className="w-4 h-4" />
                            <span>هەڵە (0)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Official Audit Bottom Footer */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t('auditVerifiedNotice')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

