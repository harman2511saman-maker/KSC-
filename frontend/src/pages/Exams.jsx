import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  KeyRound,
  Printer,
  Camera,
  Copy,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Sparkles
} from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Exams({ onSelectAnswerKey, onSelectExamForScan, onSelectExamForSheet, onShowToast }) {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    exam_name: '',
    subject: '',
    grade: 'پۆلی ١٢',
    class_id: '',
    academic_year: '2025 - 2026',
    exam_date: new Date().toISOString().split('T')[0],
    number_of_questions: 50,
    choices: 'A,B,C,D',
    total_marks: 100,
    pass_mark: 50,
    instructions: 'تکایە پەڕەی وەڵام بە قەڵەمی ڕەساس (HB) یان جافی شین بە شێوەیەکی تۆخ پڕبکەرەوە.',
    template_version: 'OMR-V1'
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams/', {
        params: { status_filter: statusFilter || undefined }
      });
      setExams(res.data);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes/');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, [statusFilter]);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        class_id: formData.class_id ? parseInt(formData.class_id) : null,
        number_of_questions: parseInt(formData.number_of_questions) || 50,
        total_marks: parseFloat(formData.total_marks) || 100,
        pass_mark: parseFloat(formData.pass_mark) || 50,
      };
      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, payload);
        onShowToast({ type: 'success', message: 'تاقیکردنەوەکە بە سەرکەوتوویی نوێکرایەوە' });
      } else {
        await api.post('/exams/', payload);
        onShowToast({ type: 'success', message: 'تاقیکردنەوەی نوێ بە سەرکەوتوویی دروستکرا' });
      }
      setCreateModalOpen(false);
      setEditingExam(null);
      fetchExams();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDuplicate = async (examId) => {
    try {
      await api.post(`/exams/${examId}/duplicate`);
      onShowToast({ type: 'success', message: 'کۆپی تاقیکردنەوەکە بە سەرکەوتوویی دروستکرا' });
      fetchExams();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (examId) => {
    try {
      await api.delete(`/exams/${examId}`);
      onShowToast({ type: 'success', message: 'تاقیکردنەوەکە سڕایەوە' });
      setDeleteConfirmId(null);
      fetchExams();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      subject: exam.subject,
      grade: exam.grade,
      class_id: exam.class_id || '',
      academic_year: exam.academic_year,
      exam_date: exam.exam_date || '',
      number_of_questions: exam.number_of_questions,
      choices: exam.choices,
      total_marks: exam.total_marks,
      pass_mark: exam.pass_mark,
      instructions: exam.instructions || '',
      template_version: exam.template_version
    });
    setCreateModalOpen(true);
  };

  const filteredExams = exams.filter((ex) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ex.exam_name.toLowerCase().includes(q) ||
      ex.subject.toLowerCase().includes(q) ||
      ex.grade.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">بەڕێوەبردنی تاقیکردنەوەکان</h2>
          <p className="text-xs text-slate-500">دروستکردن، دەستکاریکردن، کلیلی وەڵام و چاپکردنی پەڕەکان</p>
        </div>

        <button
          onClick={() => {
            setEditingExam(null);
            setFormData({
              exam_name: '',
              subject: '',
              grade: 'پۆلی ١٢',
              class_id: '',
              academic_year: '2025 - 2026',
              exam_date: new Date().toISOString().split('T')[0],
              number_of_questions: 50,
              choices: 'A,B,C,D',
              total_marks: 100,
              pass_mark: 50,
              instructions: 'تکایە پەڕەی وەڵام بە قەڵەمی ڕەساس (HB) بە شێوەیەکی تۆخ پڕبکەرەوە.',
              template_version: 'OMR-V1'
            });
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-brand-500/20 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>دروستکردنی تاقیکردنەوەی نوێ</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی تاقیکردنەوە، بابەت، پۆل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">هەموو بارودۆخەکان</option>
            <option value="DRAFT">ڕەشنووس (Draft)</option>
            <option value="ACTIVE">چالاک (Active)</option>
            <option value="COMPLETED">تەواوبوو (Completed)</option>
            <option value="ARCHIVED">ئەرشیڤکراو (Archived)</option>
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">لە بارکردنی تاقیکردنەوەکاندایە...</div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">هیچ تاقیکردنەوەیەک نەدۆزرایەوە</h3>
          <p className="text-xs text-slate-400">دەتوانیت لە ڕێگەی دوگمەی سەرەوە یەکەم تاقیکردنەوە دروست بکەیت.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      exam.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exam.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {exam.status === 'ACTIVE' ? 'چالاک' : exam.status === 'COMPLETED' ? 'تەواوبوو' : 'ڕەشنووس'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{exam.template_version}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">{exam.exam_name}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {exam.subject} • {exam.grade} {exam.class_name ? `(${exam.class_name})` : ''}
                </p>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">پرسیار</span>
                  <span className="text-xs font-bold text-slate-800">{exam.number_of_questions}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">هەڵبژاردە</span>
                  <span className="text-xs font-bold text-slate-800">{exam.choices}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">نمرەی کۆی</span>
                  <span className="text-xs font-bold text-slate-800">{exam.total_marks}</span>
                </div>
              </div>

              {/* Answer Key Status */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">کلیلی وەڵام:</span>
                {exam.answer_key_completed ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تەواوە ({exam.number_of_questions}/{exam.number_of_questions})</span>
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>ناتەواوە</span>
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => onSelectAnswerKey(exam.id)}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                    <span>کلیل</span>
                  </button>
                  <button
                    onClick={() => onSelectExamForSheet(exam.id)}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-600" />
                    <span>پەڕە</span>
                  </button>
                  <button
                    onClick={() => onSelectExamForScan(exam.id)}
                    className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-brand-600" />
                    <span>سکان</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-slate-400">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(exam)}
                      title="دەستکاریکردن"
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(exam.id)}
                      title="کۆپیکردن"
                      className="p-1.5 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setDeleteConfirmId(exam.id)}
                    title="سڕینەوە"
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingExam ? 'دەستکاریکردنی تاقیکردنەوە' : 'دروستکردنی تاقیکردنەوەی نوێ'}
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ناوی تاقیکردنەوە *</label>
            <input
              type="text"
              required
              placeholder="نموونە: تاقیکردنەوەی نیشتمانی خولی یەکەم"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بابەت *</label>
              <input
                type="text"
                required
                placeholder="نموونە: زیندەزانی، بیرکاری، فیزیا"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">پۆل / قۆناغ *</label>
              <input
                type="text"
                required
                placeholder="پۆلی ١٢ی زانستی"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ژمارەی پرسیار</label>
              <select
                value={formData.number_of_questions}
                onChange={(e) => setFormData({ ...formData, number_of_questions: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value={20}>٢٠ پرسیار</option>
                <option value={25}>٢٥ پرسیار</option>
                <option value={30}>٣٠ پرسیار</option>
                <option value={40}>٤٠ پرسیار</option>
                <option value={50}>٥٠ پرسیار (ستاندارد)</option>
                <option value={60}>٦٠ پرسیار</option>
                <option value={80}>٨٠ پرسیار</option>
                <option value={100}>١٠٠ پرسیار</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">هەڵبژاردەکان</label>
              <select
                value={formData.choices}
                onChange={(e) => setFormData({ ...formData, choices: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="A,B,C,D">A , B , C , D (چوار هەڵبژاردە)</option>
                <option value="A,B,C,D,E">A , B , C , D , E (پێنج هەڵبژاردە)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">کۆی نمرە</label>
              <input
                type="number"
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">پۆلی دیاریکراو (هۆڵ)</label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value ? parseInt(e.target.value) : '' })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">گشتی (هەموو پۆلەکان)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.grade})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">بەرواری تاقیکردنەوە</label>
              <input
                type="date"
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ڕێنمایی سەر پەڕە</label>
            <textarea
              rows={2}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all"
            >
              {editingExam ? 'نوێکردنەوە' : 'پاشەکەوتکردن'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="دڵنیابوونەوە لە سڕینەوە"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            ئایا دڵنیایت لە سڕینەوەی ئەم تاقیکردنەوەیە؟ هەموو پرسیارەکان و پەڕە پەیوەندیدارەکان دەسڕدرێنەوە.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              هەڵوەشاندنەوە
            </button>
            <button
              onClick={() => handleDelete(deleteConfirmId)}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all"
            >
              سڕینەوەی یەکجارەکی
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
