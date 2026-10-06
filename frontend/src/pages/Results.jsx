import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ChevronLeft,
  Printer
} from 'lucide-react';
import api, { getUploadUrl } from '../api';
import Modal from '../components/Modal';

export default function Results({ onShowToast, onOpenReviewForPage }) {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Result Detail Modal
  const [detailResult, setDetailResult] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete Result Confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/results/', {
        params: {
          exam_id: selectedExamId || undefined,
          class_id: selectedClassId || undefined,
          status_filter: statusFilter || undefined,
          search: searchQuery || undefined,
        },
      });
      setResults(res.data);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchExamsAndClasses = async () => {
    try {
      const [examsRes, classesRes] = await Promise.all([
        api.get('/exams/'),
        api.get('/classes/'),
      ]);
      setExams(examsRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExamsAndClasses();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedExamId, selectedClassId, statusFilter, searchQuery]);

  const openDetailModal = async (resultId) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const res = await api.get(`/results/${resultId}`);
      setDetailResult(res.data);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = (result) => {
    setResultToDelete(result);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!resultToDelete) return;
    try {
      setDeleteLoading(true);
      await api.delete(`/results/${resultToDelete.id}`);
      onShowToast({ type: 'success', message: 'ئەنجامەکە بە سەرکەوتوویی سڕایەوە' });
      setDeleteModalOpen(false);
      setResultToDelete(null);
      fetchResults();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      const query = `${selectedExamId ? `exam_id=${selectedExamId}&` : ''}${selectedClassId ? `class_id=${selectedClassId}` : ''}`;
      const res = await api.get(`/export/xlsx?${query}`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `results_${selectedExamId || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      if (a.parentNode) a.parentNode.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      onShowToast({ type: 'error', message: 'نەتوانرا فایلی Excel دابگیرێت: ' + err.message });
    }
  };

  const handleExportCsv = async () => {
    try {
      const query = `${selectedExamId ? `exam_id=${selectedExamId}&` : ''}${selectedClassId ? `class_id=${selectedClassId}` : ''}`;
      const res = await api.get(`/export/csv?${query}`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `results_${selectedExamId || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      if (a.parentNode) a.parentNode.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      onShowToast({ type: 'error', message: 'نەتوانرا فایلی CSV دابگیرێت: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">ئەنجامی تاقیکردنەوەکان</h2>
          <p className="text-xs text-slate-500">
            تەماشاکردنی نمرەکان، بەڕێوەبردن و سڕینەوە، دەرهێنانی فایلەکانی Excel و CSV
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>دەرهێنانی CSV</span>
          </button>
          <button
            onClick={handleExportXlsx}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>دەرهێنانی Excel (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی قوتابی، کۆد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">هەموو تاقیکردنەوەکان</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.exam_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">هەموو قوتابخانەکان</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">هەموو بارودۆخەکان</option>
            <option value="PASSED">دەرچوو (Passed)</option>
            <option value="FAILED">کەوتوو (Failed)</option>
            <option value="NEEDS_REVIEW">پێویستی بە پێداچوونەوەیە</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">لە بارکردنی ئەنجامەکاندایە...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            هیچ ئەنجامێک نەدۆزرایەوە بەپێی فلتەرەکان
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                  <th className="py-3.5 px-4">ناوی قوتابی</th>
                  <th className="py-3.5 px-4">کۆدی قوتابی</th>
                  <th className="py-3.5 px-4">تاقیکردنەوە</th>
                  <th className="py-3.5 px-4 text-center">دروست</th>
                  <th className="py-3.5 px-4 text-center">هەڵە</th>
                  <th className="py-3.5 px-4 text-center">بەتاڵ</th>
                  <th className="py-3.5 px-4 text-center">نمرە</th>
                  <th className="py-3.5 px-4 text-center">ڕێژەی سەدی</th>
                  <th className="py-3.5 px-4 text-center">بارودۆخ</th>
                  <th className="py-3.5 px-4 text-center">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{r.student_name || 'نادیار'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.student_code || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">{r.exam_name || '—'}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">{r.correct_count}</td>
                    <td className="py-3 px-4 text-center text-rose-600 font-bold">{r.incorrect_count}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{r.blank_count}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">
                      {r.total_score} / {r.max_score}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          r.percentage >= 50
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          r.status === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'PASSED' ? 'دەرچوو' : r.status === 'FAILED' ? 'کەوتوو' : 'پێداچوونەوە'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openDetailModal(r.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          title="بینینی وردەکاری"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>بینین</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(r)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          title="سڕینەوەی ئەنجام"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>سڕینەوە</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="دڵنیابوونەوە لە سڕینەوەی ئەنجام"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium text-amber-900">
              ئایا دڵنیایت لە سڕینەوەی ئەنجامی قوتابی{' '}
              <span className="font-bold text-slate-900">{resultToDelete?.student_name || 'نادیار'}</span> لە تاقیکردنەوەی{' '}
              <span className="font-bold text-slate-900">{resultToDelete?.exam_name}</span>؟
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              پاشگەزبوونەوە
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleteLoading ? 'لە سڕینەوەدایە...' : 'بەڵێ، بسڕەوە'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Detailed Student Result Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="وردەکاری ئەنجامی قوتابی"
        maxWidth="max-w-4xl"
      >
        {detailLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">لە بارکردنی زانیاریدایە...</div>
        ) : detailResult ? (
          <div className="space-y-5">
            {/* Student Score Header */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">{detailResult.student_name}</h4>
                <p className="text-xs text-slate-500">
                  کۆد: {detailResult.student_code || '—'} • تاقیکردنەوە: {detailResult.exam_name} • قوتابخانە: {detailResult.class_name || '—'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold">کۆی نمرە</span>
                  <span className="text-lg font-black text-slate-900">
                    {detailResult.total_score} / {detailResult.max_score}
                  </span>
                </div>
                <div
                  className={`text-center px-4 py-2 rounded-xl text-lg font-black ${
                    detailResult.percentage >= 50
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {detailResult.percentage}%
                </div>
              </div>
            </div>

            {/* Question by question matrix */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-slate-800 block">وەڵامەکانی قوتابی بەرامبەر کلیلی وەڵام:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {detailResult.answers?.map((a) => {
                  const isMultiple = a.machine_status === 'MULTIPLE' || a.eval_status === 'MULTIPLE';
                  const isCorrect = a.eval_status === 'CORRECT';
                  const isBlank = a.eval_status === 'BLANK' && !isMultiple;

                  return (
                    <div
                      key={a.question_num}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : isBlank
                          ? 'bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="font-mono font-bold text-[11px]">{a.question_num}.</span>
                      <div className="flex items-center gap-1 font-bold">
                        <span>{isMultiple ? 'دوو وەڵام' : (a.final_answer || 'بەتاڵ')}</span>
                        {a.correct_answer && (
                          <span className="text-[10px] text-slate-400 font-normal">({a.correct_answer})</span>
                        )}
                      </div>
                      {isCorrect ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scanned Image Visualizer */}
            {detailResult.debug_file && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-800 block">پەڕەی سکانکراو و دیاریکردنی بازنەکان:</span>
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 p-2 bg-slate-950 flex items-center justify-center">
                  <img
                    src={getUploadUrl(`/uploads/debug/${detailResult.debug_file}`)}
                    alt="پەڕەی شیکاریکراو و بازنەکان"
                    className="w-full max-h-68 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
