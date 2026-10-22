import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Megaphone,
  Database,
  Save,
  Loader2,
  CheckCircle2,
  Building2,
  Sliders,
  LayoutGrid,
  Layers
} from 'lucide-react';
import api from '../api';
import PromoSlideEditor from './PromoSlideEditor';

export default function AdminSettingsModal({ isOpen, onClose, onShowToast }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('slides'); // 'slides' | 'certificates' | 'announcement' | 'backup'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [exams, setExams] = useState([]);
  const [schools, setSchools] = useState([]);

  // Settings State
  const [settings, setSettings] = useState({
    announcement: {
      enabled: true,
      text: 'ئەنجامی فەرمیی تاقیکردنەوەکانی پلاتفۆرمی KSC بڵاوکرایەوە • پیرۆزبایی لە سەرجەم قوتابییان و قوتابخانە سەرکەوتووەکان دەکەین!',
      badge: 'ئاگاداری گرنگ'
    },
    promo_slides: [],
    certificate_config: {
      enabled: true,
      title: 'بڕوانامەی ڕێزلێنان و سەرکەوتن',
      min_percentage: 75.0,
      eligibility_mode: 'top_schools_123', // "top_schools_123", "selected_schools", "top_students", "all"
      top_schools_count: 3,
      allowed_exam_id: '',
      allowed_school_ids: [],
      appreciation_text: 'بە بۆنەی بەشداریکردنی کارا و بەدەستهێنانی پلەی شایستە لە پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان',
      school_cert_title: 'بڕوانامەی شایستەیی و سەرکەوتنی قوتابخانە',
      school_appreciation_text: 'پیرۆزبایی گەرم ئاراستەی دەستەی کارگێڕی، مامۆستایان و قوتابیانی ئەم قوتابخانە ئازیزە دەکەین بە بۆنەی بەدەستهێنانی پلەی شایستە لەسەر ئاستی هەرێمی کوردستان',
      signee_name: 'سەرپەرشتیاری گشتیی پڕۆژەی KSC',
      signee_title: 'لیژنەی باڵای هەڵسەنگاندن و تاقیکردنەوەکان'
    }
  });

  useEffect(() => {
    fetchSettings();
    api.get('/exams/').then((r) => setExams(r.data || [])).catch(() => {});
    api.get('/classes/').then((r) => setSchools(r.data || [])).catch(() => {});
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/competitions/settings');
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          certificate_config: {
            ...prev.certificate_config,
            ...(res.data.certificate_config || {})
          }
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await api.put('/competitions/settings', settings);
      onShowToast({ type: 'success', message: 'ڕێکخستنەکان بە سەرکەوتوویی نوێکرانەوە و بڵاوکرانەوە' });
      onClose();
    } catch (err) {
      onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      setBackingUp(true);
      const res = await api.post('/competitions/admin/backup');
      onShowToast({ type: 'success', message: res.data.message });
    } catch (err) {
      onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setBackingUp(false);
    }
  };

  const toggleSchoolSelection = (schoolId) => {
    const currentList = settings.certificate_config?.allowed_school_ids || [];
    const exists = currentList.includes(schoolId);
    const updated = exists ? currentList.filter((id) => id !== schoolId) : [...currentList, schoolId];
    setSettings({
      ...settings,
      certificate_config: {
        ...settings.certificate_config,
        allowed_school_ids: updated
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-4xl w-full p-5 sm:p-7 relative text-right text-white max-h-[94vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                بەڕێوەبردنی گشتیی پلاتفۆرم (Control & Publishing Center)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                کۆنترۆڵی تەواوی سلایدەکان، ڕێنماییەکان، بەستەری ڕاستەوخۆ و یاساکانی بڕوانامە
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'slides'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>سلاید و ڕیکلامەکانی پلاتفۆرم (Hero Banner)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'certificates'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>یاساکانی بڕوانامە</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'announcement'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>شریتی هەواڵی بەپەلە</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>پاشەکەوتی داتابەیس</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <span className="text-xs font-bold">بارکردنی ڕێکخستنەکان...</span>
          </div>
        ) : (
          <div className="my-5">
            {/* TAB 1: HERO PROMO BANNER SLIDES MANAGER */}
            {activeTab === 'slides' && (
              <PromoSlideEditor
                onShowToast={onShowToast}
                onPublished={() => {
                  fetchSettings();
                }}
              />
            )}

            {/* TAB 2: CERTIFICATE RULES */}
            {activeTab === 'certificates' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Award className="w-4 h-4" />
                      <span>یاسا و مەرجەکانی بەخشینی بڕوانامە</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={settings.certificate_config?.enabled ?? true}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, enabled: e.target.checked }
                          })
                        }
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>چالاککردنی بڕوانامە</span>
                    </label>
                  </div>

                  {/* Mode Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-amber-300">
                      کێ شایستەی وەرگرتنی بڕوانامەیە؟ (Eligibility Mode):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                          settings.certificate_config?.eligibility_mode === 'top_schools_123'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="eligibility_mode"
                          value="top_schools_123"
                          checked={settings.certificate_config?.eligibility_mode === 'top_schools_123'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              certificate_config: { ...settings.certificate_config, eligibility_mode: 'top_schools_123' }
                            })
                          }
                          className="text-amber-500"
                        />
                        <span>👑 تەنها قوتابخانەکانی پلەی (١، ٢، ٣)</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                          settings.certificate_config?.eligibility_mode === 'selected_schools'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="eligibility_mode"
                          value="selected_schools"
                          checked={settings.certificate_config?.eligibility_mode === 'selected_schools'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              certificate_config: { ...settings.certificate_config, eligibility_mode: 'selected_schools' }
                            })
                          }
                          className="text-amber-500"
                        />
                        <span>🏫 تەنها ئەو قوتابخانانەی بە دیاریکراوی هەڵیدەبژێرم</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                          settings.certificate_config?.eligibility_mode === 'top_students'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="eligibility_mode"
                          value="top_students"
                          checked={settings.certificate_config?.eligibility_mode === 'top_students'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              certificate_config: { ...settings.certificate_config, eligibility_mode: 'top_students' }
                            })
                          }
                          className="text-amber-500"
                        />
                        <span>🥇 تەنها قوتابییانی پلەی (١، ٢، ٣)</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-xs font-bold transition-all ${
                          settings.certificate_config?.eligibility_mode === 'all'
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="eligibility_mode"
                          value="all"
                          checked={settings.certificate_config?.eligibility_mode === 'all'}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              certificate_config: { ...settings.certificate_config, eligibility_mode: 'all' }
                            })
                          }
                          className="text-amber-500"
                        />
                        <span>🌐 هەموو قوتابییە دەرچووەکان (سەروو کەمترین نمرە)</span>
                      </label>
                    </div>
                  </div>

                  {/* Exam Binding Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        بەپێی تاقیکردنەوەی دیاریکراو:
                      </label>
                      <select
                        value={settings.certificate_config?.allowed_exam_id || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, allowed_exam_id: e.target.value }
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <option value="">سەرجەم تاقیکردنەوەکان</option>
                        {exams.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.exam_name} ({ex.subject || 'گشتی'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        دەتوانیت بڕوانامەکە تەنها بۆ یەک تاقیکردنەوەی تایبەت چالاک بکەیت
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        کەمترین نمرەی وەرگرتنی بڕوانامە (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={settings.certificate_config?.min_percentage ?? 75}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: {
                              ...settings.certificate_config,
                              min_percentage: parseFloat(e.target.value) || 0
                            }
                          })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* School Checklist if Selected Schools Mode */}
                  {settings.certificate_config?.eligibility_mode === 'selected_schools' && (
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700 space-y-2">
                      <label className="block text-xs font-bold text-amber-300">
                        قوتابخانە ڕێگەپێدراوەکان دیاریبکە ({settings.certificate_config?.allowed_school_ids?.length || 0} هەڵبژێردراو):
                      </label>
                      <div className="max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                        {schools.map((sch) => {
                          const checked = (settings.certificate_config?.allowed_school_ids || []).includes(sch.id);
                          return (
                            <label
                              key={sch.id}
                              className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer ${
                                checked ? 'bg-amber-500/20 border-amber-400/80 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSchoolSelection(sch.id)}
                                className="rounded text-amber-500"
                              />
                              <span className="truncate">{sch.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Texts Customization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ناونیشانی بڕوانامەی قوتابی:
                      </label>
                      <input
                        type="text"
                        value={settings.certificate_config?.title || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, title: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ناونیشانی بڕوانامەی قوتابخانە:
                      </label>
                      <input
                        type="text"
                        value={settings.certificate_config?.school_cert_title || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, school_cert_title: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      دەقی پیرۆزبایی و ڕێزلێنانی قوتابی:
                    </label>
                    <textarea
                      rows={2}
                      value={settings.certificate_config?.appreciation_text || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          certificate_config: { ...settings.certificate_config, appreciation_text: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        ناوی واژۆکەر / سەرپەرشتیار:
                      </label>
                      <input
                        type="text"
                        value={settings.certificate_config?.signee_name || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, signee_name: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        پۆست یان لیژنەی واژۆکەر:
                      </label>
                      <input
                        type="text"
                        value={settings.certificate_config?.signee_title || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            certificate_config: { ...settings.certificate_config, signee_title: e.target.value }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>پاشەکەوتکردنی یاساکانی بڕوانامە</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ANNOUNCEMENT TICKER */}
            {activeTab === 'announcement' && (
              <form onSubmit={handleSave} className="space-y-6">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                      <Megaphone className="w-4 h-4" />
                      <span>شریتی هەواڵی بەپەلە لە سەرەوەی ماڵپەڕ</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={settings.announcement?.enabled ?? true}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            announcement: { ...settings.announcement, enabled: e.target.checked }
                          })
                        }
                        className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400"
                      />
                      <span>پێشاندانی شریت</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      دەقی نیشانە (Badge):
                    </label>
                    <input
                      type="text"
                      value={settings.announcement?.badge || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcement: { ...settings.announcement, badge: e.target.value }
                        })
                      }
                      placeholder="ئاگاداری گرنگ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      دەقی هەواڵ یان ئاگادارییەکە:
                    </label>
                    <textarea
                      rows={3}
                      value={settings.announcement?.text || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          announcement: { ...settings.announcement, text: e.target.value }
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>پاشەکەوتکردن و بڵاوکردنەوەی ئاگاداری</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: DATABASE BACKUP */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">پاشەکەوتکردنی خێرای داتابەیس (Database Instant Backup)</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        بە یەک کلیک لە تەواوی داتابەیسی قوتابییان، قوتابخانەکان، نمرەکان و وێنەکانی OMR کۆپییەکی یەدەگ دروست دەکرێت لەناو سێرڤەر.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={handleTriggerBackup}
                      disabled={backingUp}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
                    >
                      {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      <span>پاشەکەوتکردن ئێستا</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
