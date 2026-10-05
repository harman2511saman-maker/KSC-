import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Trash2,
  Edit,
  Users,
  School,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

export default function Schools({ onShowToast }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'students'

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    grade: 'قوتابخانە',
    academic_year: '2025-2026'
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classes/');
      setSchools(res.data);
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast({ type: 'error', message: 'تکایە ناوی قوتابخانە بنووسە' });
      return;
    }
    try {
      if (editingSchool) {
        await api.put(`/classes/${editingSchool.id}`, formData);
        onShowToast({ type: 'success', message: 'زانیاری قوتابخانەکە بە سەرکەوتوویی نوێکرایەوە' });
      } else {
        await api.post('/classes/', formData);
        onShowToast({ type: 'success', message: 'قوتابخانەی نوێ بە سەرکەوتوویی زیادکرا' });
      }
      setCreateModalOpen(false);
      setEditingSchool(null);
      setFormData({ name: '', grade: 'قوتابخانە', academic_year: '2025-2026' });
      fetchSchools();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (schoolId) => {
    try {
      await api.delete(`/classes/${schoolId}`);
      onShowToast({ type: 'success', message: 'قوتابخانەکە بە سەرکەوتوویی سڕایەوە' });
      setDeleteConfirmId(null);
      fetchSchools();
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    }
  };

  const openEditModal = (s) => {
    setEditingSchool(s);
    setFormData({
      name: s.name,
      grade: s.grade || 'قوتابخانە',
      academic_year: s.academic_year || '2025-2026'
    });
    setCreateModalOpen(true);
  };

  const totalStudentsCount = schools.reduce((acc, s) => acc + (s.student_count || 0), 0);
  const avgStudentsPerSchool = schools.length > 0 ? Math.round(totalStudentsCount / schools.length) : 0;

  const filteredSchools = schools
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'students') {
        return (b.student_count || 0) - (a.student_count || 0);
      }
      return a.name.localeCompare(b.name, 'ku');
    });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner with Premium Styling */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold">
              <School className="w-4 h-4 text-brand-400" />
              <span>بەڕێوەبەرایەتی سەرەکی قوتابخانەکان</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              قوتابخانە و ناوەندەکانی خوێندن
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              تۆمارکردن، ڕێکخستن و چاودێریکردنی قوتابخانە بەشداربووەکان بۆ بەستنەوەی فۆڕمی OMR و جیاکردنەوەی ئەنجامی تاقیکردنەوەکان.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingSchool(null);
              setFormData({ name: '', grade: 'قوتابخانە', academic_year: '2025-2026' });
              setCreateModalOpen(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2.5 self-start md:self-auto text-xs active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی قوتابخانەی نوێ</span>
          </button>
        </div>

        {/* KPI Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>کۆی قوتابخانەکان</span>
              <Building2 className="w-4 h-4 text-brand-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {schools.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">تۆمارکراو لە بنکەی دراوە</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>کۆی قوتابییانی بەشدار</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {totalStudentsCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">قوتابی چالاک</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>تێکڕای قوتابی / قوتابخانە</span>
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {avgStudentsPerSchool}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">قوتابی بۆ هەر ناوەندێک</span>
          </div>

          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
              <span>ساڵی خوێندن</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-indigo-300">
              2025-2026
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">خولی چالاک</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی قوتابخانە..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">ڕیزکردن:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="name">بەپێی پیتەکانی ناو (ئ-ی)</option>
              <option value="students">بەپێی زۆری ژمارەی قوتابیان</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="کارتە مۆدێرنەکان"
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
          لە بارکردنی قوتابخانەکاندایە...
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <School className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">هیچ قوتابخانەیەک نەدۆزرایەوە</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            دەتوانیت یەکەمین قوتابخانە زیاد بکەیت بۆ دەستپێکردنی تاقیکردنەوە و بەستنەوەی قوتابیان
          </p>
          <button
            onClick={() => {
              setEditingSchool(null);
              setFormData({ name: '', grade: 'قوتابخانە', academic_year: '2025-2026' });
              setCreateModalOpen(true);
            }}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 transition-all"
          >
            زیادکردنی قوتابخانە
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchools.map((s, index) => (
            <div
              key={s.id}
              className="group relative bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle top decoration */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/10 to-indigo-500/10 border border-brand-200/60 text-brand-600 flex items-center justify-center font-black text-lg shadow-2xs group-hover:scale-105 transition-transform">
                    <School className="w-6 h-6 text-brand-600" />
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      SCH-{s.id}
                    </span>
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

                <div className="mt-4 space-y-1">
                  <h3 className="font-black text-slate-900 text-lg group-hover:text-brand-700 transition-colors leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <span>ساڵی خوێندن: {s.academic_year || '2025-2026'}</span>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">ژمارەی قوتابیان</span>
                    <span className="text-sm font-black text-slate-900">{s.student_count || 0} قوتابی</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-xl">
                  تۆمارکراو
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
                  <th className="py-3.5 px-4">ناوی قوتابخانە</th>
                  <th className="py-3.5 px-4 text-center">ساڵی خوێندن</th>
                  <th className="py-3.5 px-4 text-center">کۆی قوتابییان</th>
                  <th className="py-3.5 px-4 text-center">کردارەکان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      SCH-{s.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600 font-semibold">
                      {s.academic_year || '2025-2026'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-brand-700">
                      {s.student_count || 0} قوتابی
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={editingSchool ? 'دەستکاریکردنی زانیاری قوتابخانە' : 'زیادکردنی قوتابخانەی نوێ'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-5">
          <div className="flex items-center gap-3 p-4 bg-brand-50/60 rounded-2xl border border-brand-100">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-brand-500/30">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">پڕۆفایلی فەرمی قوتابخانە</h4>
              <p className="text-[11px] text-slate-500">
                ناوی دروستی قوتابخانەکە دەنووسرێت بۆ دەرکەوتنی لەسەر پەڕەکانی وەڵامی OMR و ڕیزبەندییەکان.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ناوی تەواوی قوتابخانە <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="نموونە: قوتابخانەی فاخیر مێرگەسۆری نموونەیی"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ساڵی خوێندن</label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">جۆری ناوەند</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
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
              <span>{editingSchool ? 'نوێکردنەوە' : 'پاشەکەوتکردن'}</span>
            </button>
          </div>
        </form>
      </Modal>

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
              ئایا دڵنیایت لە سڕینەوەی ئەم قوتابخانەیە لە سیستەمەکە؟
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
