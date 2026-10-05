import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Trash2,
  Edit,
  GraduationCap,
  Sparkles,
  School,
  Building2,
  Copy,
  CheckCircle2,
  CreditCard,
  Printer,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Layers,
  ChevronDown,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Award
} from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Students({ onShowToast }) {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & View
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    grade: 'گشتی',
    class_id: '',
    academic_year: '2025-2026',
    status: 'ACTIVE'
  });

  // Bulk File
  const fileInputRef = useRef(null);
  const [importSchoolId, setImportSchoolId] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/', {
        params: {
          class_id: selectedSchoolId || undefined,
          search: searchQuery || undefined
        }
      });
      setStudents(res.data);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await api.get('/classes/');
      setSchools(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedSchoolId, searchQuery]);

  const generateRandomStudentId = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `STD-${randomNum}`;
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast({ type: 'error', message: 'تکایە ناوی چواری قوتابی بنووسە' });
      return;
    }
    if (!formData.class_id) {
      onShowToast({ type: 'error', message: 'تکایە قوتابخانە دیاریبکە' });
      return;
    }
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, formData);
        onShowToast({ type: 'success', message: 'زانیاری قوتابی بە سەرکەوتوویی نوێکرایەوە' });
      } else {
        await api.post('/students/', formData);
        onShowToast({ type: 'success', message: 'قوتابی نوێ بە سەرکەوتوویی تۆمارکرا' });
      }
      setCreateModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
      fetchSchools();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (studentId) => {
    try {
      await api.delete(`/students/${studentId}`);
      onShowToast({ type: 'success', message: 'قوتابییەکە بە سەرکەوتوویی سڕایەوە' });
      setDeleteConfirmId(null);
      fetchStudents();
      fetchSchools();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    if (importSchoolId) {
      data.append('class_id', importSchoolId);
    }

    try {
      setImportLoading(true);
      const res = await api.post('/students/import-bulk', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onShowToast({
        type: 'success',
        message: `${res.data.imported_count} قوتابی بە سەرکەوتوویی هاوردەکران`
      });
      setImportModalOpen(false);
      fetchStudents();
      fetchSchools();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setImportLoading(false);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      grade: student.grade || 'گشتی',
      class_id: student.class_id || '',
      academic_year: student.academic_year || '2025-2026',
      status: student.status || 'ACTIVE'
    });
    setCreateModalOpen(true);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    onShowToast({ type: 'success', message: `کۆدی (${code}) کۆپیکرا` });
  };

  // Avatar color generator based on student name
  const getAvatarGradient = (str) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-brand-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-sky-500 to-blue-600'
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const getInitials = (name) => {
    if (!name) return 'ق';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]} ${parts[1][0]}`;
    return parts[0][0];
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-brand-400" />
              <span>تۆماری گشتی و داتابەیسی قوتابیان</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              بەڕێوەبردنی قوتابیان و ناسنامەی تاقیکردنەوە
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              تۆمارکردنی تاک و بەکۆمەڵی قوتابیان بەپێی قوتابخانەکان، دروستکردنی کۆدی ناسنامەی OMR و چاپکردنی کارتی بەشداری.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-2xl font-bold text-xs backdrop-blur-sm transition-all"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>هاوردەکردنی Excel / CSV</span>
            </button>
            
            <button
              onClick={() => {
                setEditingStudent(null);
                setFormData({
                  student_id: generateRandomStudentId(),
                  name: '',
                  grade: 'گشتی',
                  class_id: selectedSchoolId || (schools[0]?.id || ''),
                  academic_year: '2025-2026',
                  status: 'ACTIVE'
                });
                setCreateModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg shadow-brand-500/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تۆمارکردنی قوتابی نوێ</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>کۆی قوتابییان</span>
              <Users className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {students.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">تۆمارکراو لە سیستەم</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>قوتابخانە بەشدارەکان</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {schools.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">ناوەندی خوێندن</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>دۆخی بەشداری</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              چالاک
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">ئامادەی تاقیکردنەوە</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>شێوازی ناسینەوە</span>
              <QrCode className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-indigo-300">
              کۆدی OMR
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">ستۆکۆدی بازنەیی و بارکۆد</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی چواری قوتابی یان کۆدی ناسنامە (STD-XXX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">هەموو قوتابخانەکان ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.student_count || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="کارتە ناسنامەییەکان"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="خشتەی داتا"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="animate-spin w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          لە بارکردنی لیستی قوتابیاندایە...
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">هیچ قوتابییەک بەم مەرجە نەدۆزرایەوە</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            دەتوانیت قوتابی تۆمار بکەیت یان فایلی Excel بۆ هاوردەکردنی دەستەیی باربکەیت
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              هاوردەکردنی Excel
            </button>
            <button
              onClick={() => {
                setEditingStudent(null);
                setFormData({
                  student_id: generateRandomStudentId(),
                  name: '',
                  grade: 'گشتی',
                  class_id: selectedSchoolId || (schools[0]?.id || ''),
                  academic_year: '2025-2026',
                  status: 'ACTIVE'
                });
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              زیادکردنی قوتابی
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((s) => (
            <div
              key={s.id}
              className="group relative bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(s.name)} text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform`}>
                      {getInitials(s.name)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-brand-700 transition-colors">
                        {s.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{s.class_name || 'قوتابخانەی گشتی'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setIdCardStudent(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="بینینی کارتی بەشداری"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors"
                      title="دەستکاریکردن"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="سڕینەوە"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => copyCode(s.student_id)}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition-colors"
                  title="کۆپیکردنی کۆد"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>{s.student_id}</span>
                </button>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>چالاک</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold">
                  <th className="py-3.5 px-4 text-center">کۆدی ناسنامە</th>
                  <th className="py-3.5 px-4">ناوی چواری قوتابی</th>
                  <th className="py-3.5 px-4">قوتابخانە</th>
                  <th className="py-3.5 px-4 text-center">دۆخ</th>
                  <th className="py-3.5 px-4 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                        {s.student_id}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${getAvatarGradient(s.name)} text-white flex items-center justify-center font-bold text-xs`}>
                          {getInitials(s.name)}
                        </div>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg font-semibold text-xs">
                        <School className="w-3.5 h-3.5 text-brand-600" />
                        {s.class_name || 'دیارینەکراو'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        چالاک
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setIdCardStudent(s)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="کارتی بەشداری"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="دەستکاری"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingStudent ? 'دەستکاریکردنی زانیاری قوتابی' : 'تۆمارکردنی قوتابی نوێ'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-brand-50/60 rounded-2xl border border-brand-100">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">پڕۆفایلی بەشداری قوتابی</h4>
              <p className="text-[11px] text-slate-500">
                کۆدی ناسنامەی قوتابی دەبێتە کلیل بۆ ناسینەوەی فۆڕمی وەڵامی OMR و پشکنینی ئەنجام.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                کۆدی ناسنامەی قوتابی <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="STD-101"
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, student_id: generateRandomStudentId() })}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600"
                  title="کۆدی هەڕەمەکی"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ناوی چواری قوتابی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="نموونە: ئارام کاروان ئەحمەد"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              قوتابخانە <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value ? parseInt(e.target.value) : '' })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-bold text-slate-700"
            >
              <option value="">قوتابخانە هەڵبژێرە...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingStudent ? 'نوێکردنەوە' : 'پاشەکەوتکردن'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="هاوردەکردنی بەکۆمەڵی قوتابیان لە Excel / CSV"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            فایلێکی Excel (.xlsx) یان CSV باربکە کە ستوونەکانی <strong className="text-slate-900 font-mono">student_id (یان کۆد)</strong> و <strong className="text-slate-900 font-mono">name (یان ناو)</strong> لەخۆبگرێت.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">دانان بۆ قوتابخانەی دیاریکراو (ئارەزوومەندانە):</label>
            <select
              value={importSchoolId}
              onChange={(e) => setImportSchoolId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 font-bold text-slate-700"
            >
              <option value="">هەموو قوتابخانەکان بەپێی فایلەکە</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-brand-500 p-8 rounded-3xl text-center cursor-pointer bg-slate-50/50 hover:bg-brand-50/30 transition-all space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleBulkImport}
            />
            <FileSpreadsheet className="w-12 h-12 text-brand-600 mx-auto" />
            <span className="text-xs font-black text-slate-800 block">کرتە بکە بۆ هەڵبژاردنی فایلی Excel یان CSV</span>
            <span className="text-[11px] text-slate-400 block">یان فایلەکە ڕابکێشە ئێرە</span>
          </div>

          {importLoading && (
            <div className="text-center py-2 text-xs font-bold text-brand-600 flex items-center justify-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full" />
              <span>لە هاوردەکردن و پشکنینی داتایاندایە...</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Student ID Examination Card Modal */}
      {idCardStudent && (
        <Modal
          isOpen={true}
          onClose={() => setIdCardStudent(null)}
          title="کارتی بەشداری و ناسنامەی تاقیکردنەوە"
          maxWidth="max-w-md"
        >
          <div className="space-y-6">
            {/* Printable Card Design */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border-2 border-amber-400 shadow-xl relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                    OMR
                  </div>
                  <span className="text-xs font-black text-amber-300">کوردستان • کارتی بەشداری فەرمی</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">2025-2026</span>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(idCardStudent.name)} text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0`}>
                  {getInitials(idCardStudent.name)}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-lg text-white leading-snug">{idCardStudent.name}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-amber-400" />
                    <span>{idCardStudent.class_name || 'قوتابخانە'}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between text-xs border border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">کۆدی ناسنامەی بەشداری</span>
                  <span className="text-base font-mono font-black text-amber-400">{idCardStudent.student_id}</span>
                </div>
                <div className="text-left font-mono text-[10px] text-slate-400">
                  <span>OMR READY</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                تکایە ئەم کۆدە بە دروستی لەسەر پەڕەی وەڵامی OMR لە بازنەکان پڕبکەرەوە.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIdCardStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردن</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="دڵنیابوونەوە لە سڕینەوە"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <Trash2 className="w-6 h-6 shrink-0 text-rose-500" />
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              ئایا دڵنیایت لە سڕینەوەی ئەم قوتابییە لە سیستەمەکەدا؟
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="button"
              onClick={() => handleDelete(deleteConfirmId)}
              className="px-5 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs hover:bg-rose-700 shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>بەڵێ، بسڕەوە</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
