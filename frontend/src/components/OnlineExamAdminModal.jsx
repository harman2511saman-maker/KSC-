import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings,
  HelpCircle,
  Key,
  Plus,
  Trash2,
  Save,
  Upload,
  ClipboardPaste,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Clock,
  Gift,
  Send,
  Layers,
  AlertOctagon
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function OnlineExamAdminModal({ onClose, onShowToast, onExamUpdated }) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'questions' | 'passcodes'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Multi-exam selection state
  const [allExams, setAllExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [exam, setExam] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Exam Settings Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sponsorsAndPrizes, setSponsorsAndPrizes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [questionDuration, setQuestionDuration] = useState(60);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [telegramMins, setTelegramMins] = useState(5);
  const [entryCutoffMins, setEntryCutoffMins] = useState(3);
  const [isActive, setIsActive] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Passcodes state
  const [passcodes, setPasscodes] = useState([]);
  const [generateCount, setGenerateCount] = useState(20);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchAllExamsAndSelect();
  }, []);

  const fetchAllExamsAndSelect = async (preferredExamId = null) => {
    try {
      setLoading(true);
      const res = await api.get('/online-exam/admin/exams');
      const examsList = res.data || [];
      setAllExams(examsList);

      if (examsList.length > 0) {
        const targetId = preferredExamId || (examsList.find((e) => e.id === selectedExamId)?.id) || examsList[0].id;
        await loadExamDetails(targetId);
      } else {
        // No exams exist yet, set to creation mode
        resetFormForNewExam();
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async (examId) => {
    try {
      setSelectedExamId(examId);
      setIsCreatingNew(false);

      // Find exam info
      const current = allExams.find((e) => e.id === examId);
      setExam(current || null);
      if (current) {
        setTitle(current.title || '');
        setDescription(current.description || '');
        setSponsorsAndPrizes(current.sponsors_and_prizes || '');

        if (current.start_time) {
          const timeStr = current.start_time.endsWith('Z') || current.start_time.includes('+')
            ? current.start_time
            : current.start_time + 'Z';
          const d = new Date(timeStr);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        } else {
          setStartTime('');
        }

        setQuestionDuration(current.question_duration_seconds || 60);
        setTelegramUrl(current.telegram_group_url || 'https://t.me/KurdishOMR');
        setTelegramMins(current.telegram_submission_minutes || 5);
        setEntryCutoffMins(current.entry_cutoff_minutes || 3);
        setIsActive(current.is_active ?? true);
      }

      // Fetch questions
      const qRes = await api.get(`/online-exam/admin/exams/${examId}/questions`);
      setQuestions(qRes.data || []);

      // Fetch passcodes
      const pRes = await api.get(`/online-exam/admin/exams/${examId}/passcodes`);
      setPasscodes(pRes.data || []);
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const resetFormForNewExam = () => {
    setIsCreatingNew(true);
    setExam(null);
    setSelectedExamId(null);
    setTitle('');
    setDescription('');
    setSponsorsAndPrizes('');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setStartTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    setQuestionDuration(60);
    setTelegramUrl('https://t.me/KurdishOMR');
    setTelegramMins(5);
    setEntryCutoffMins(3);
    setIsActive(true);
    setQuestions([]);
    setPasscodes([]);
    setActiveTab('settings');
  };

  // 1. SAVE EXAM SETTINGS (Create or Update)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      if (onShowToast) onShowToast({ type: 'error', message: 'ناوی تاقیکردنەوە پێویستە' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sponsors_and_prizes: sponsorsAndPrizes.trim(),
        start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        question_duration_seconds: Number(questionDuration) || 60,
        telegram_group_url: telegramUrl.trim(),
        telegram_submission_minutes: Number(telegramMins) || 5,
        entry_cutoff_minutes: Number(entryCutoffMins) || 3,
        is_active: isActive
      };

      if (exam?.id && !isCreatingNew) {
        await api.put(`/online-exam/admin/exams/${exam.id}`, payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'ڕێکخستنەکانی تاقیکردنەوە نوێکرانەوە' });
        await fetchAllExamsAndSelect(exam.id);
      } else {
        const res = await api.post('/online-exam/admin/exams', payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'تاقیکردنەوەی نوێ بە سەرکەوتوویی دروستکرا' });
        await fetchAllExamsAndSelect(res.data?.exam_id);
      }

      if (onExamUpdated) onExamUpdated();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // DELETE EXAM & PURGE FROM SERVER DISK & DB
  const handleDeleteExam = async () => {
    if (!exam?.id) return;
    try {
      setDeleting(true);
      const res = await api.delete(`/online-exam/admin/exams/${exam.id}`);
      setShowDeleteConfirm(false);

      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.data?.message || 'تاقیکردنەوە و سەرجەم فایل و وێنەکان لە سێرڤەر سڕانەوە'
        });
      }

      if (onExamUpdated) onExamUpdated();
      await fetchAllExamsAndSelect();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  // 2. QUESTIONS ACTIONS
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        order_num: questions.length + 1,
        question_text: '',
        image_url: null
      }
    ]);
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
  };

  const handleMoveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setQuestions(updated);
  };

  const handlePasteQuestionText = async (index) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUpdateQuestion(index, 'question_text', text);
        if (onShowToast) onShowToast({ type: 'success', message: 'دەقەکە بە سەرکەوتوویی پەیست کرا' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: 'ڕێگەپێدانی پەیستکردن لە وێبگەڕ نییە' });
    }
  };

  const handleUploadQuestionImage = async (index, file) => {
    if (!file) return;
    try {
      setUploadingImageIndex(index);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/online-exam/admin/upload-question-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        handleUpdateQuestion(index, 'image_url', res.data.url);
        if (onShowToast) onShowToast({ type: 'success', message: 'وێنەی پرسیار بە قەبارەی گونجاو بارکرا و پەستێنرا' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleSaveQuestions = async () => {
    if (!exam?.id) {
      if (onShowToast) onShowToast({ type: 'error', message: 'سەرەتا تاقیکردنەوە پاشەکەوت بکە' });
      return;
    }
    try {
      setSaving(true);
      await api.put(`/online-exam/admin/exams/${exam.id}/questions`, questions);
      if (onShowToast) onShowToast({ type: 'success', message: 'سەرجەم پرسیارەکان بە سەرکەوتوویی پاشەکەوت کران' });
      if (onExamUpdated) onExamUpdated();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // 3. PASSCODES ACTIONS
  const handleGeneratePasscodes = async () => {
    if (!exam?.id) {
      if (onShowToast) onShowToast({ type: 'error', message: 'سەرەتا تاقیکردنەوە پاشەکەوت بکە' });
      return;
    }
    try {
      setGenerating(true);
      const res = await api.post(`/online-exam/admin/exams/${exam.id}/generate-passcodes`, {
        count: Number(generateCount) || 20
      });

      if (onShowToast) onShowToast({ type: 'success', message: res.data?.message_ku || 'پاسوۆردەکان دروستکران' });

      // Refresh passcodes
      const pRes = await api.get(`/online-exam/admin/exams/${exam.id}/passcodes`);
      setPasscodes(pRes.data || []);
      if (onExamUpdated) onExamUpdated();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAvailableCodes = () => {
    const available = passcodes.filter((p) => !p.is_used).map((p) => p.code);
    if (available.length === 0) {
      if (onShowToast) onShowToast({ type: 'info', message: 'هیچ پاسوۆردێکی بەردەست نییە' });
      return;
    }
    const text = available.join('\n');
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast({ type: 'success', message: `${available.length} پاسوۆردی بەردەست کۆپیکران` });
  };

  const handleDownloadTxt = () => {
    const lines = passcodes.map(
      (p) => `${p.code} | ${p.is_used ? `بەکارهاتووە لەلایەن: ${p.student_name || 'نادیار'}` : 'بەردەستە'}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KSC_Passcodes_${exam?.title || 'Exam'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeletePasscode = async (id) => {
    try {
      await api.delete(`/online-exam/admin/passcodes/${id}`);
      setPasscodes(passcodes.filter((p) => p.id !== id));
      if (onShowToast) onShowToast({ type: 'success', message: 'پاسوۆردەکە سڕایەوە' });
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    }
  };

  const availableCount = passcodes.filter((p) => !p.is_used).length;
  const usedCount = passcodes.filter((p) => p.is_used).length;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <span className="text-xs font-bold">بارکردنی زانیارییەکانی تاقیکردنەوە...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                بەڕێوەبردنی تاقیکردنەوەکانی ئۆنلاین (Online Exams Manager)
              </h2>
              <span className="text-xs text-slate-400">
                زیادکردنی چەندین تاقیکردنەوە، پرسیارەکان، پاسوۆرد، و سڕینەوە لە سێرڤەر
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Exams Switcher / Add Exam Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>تاقیکردنەوەکان:</span>
            </span>

            {allExams.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => loadExamDetails(ex.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  selectedExamId === ex.id && !isCreatingNew
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                {ex.title.length > 25 ? ex.title.slice(0, 25) + '...' : ex.title}
                {!ex.is_active && (
                  <span className="mr-1 text-[10px] text-slate-400">(ناچالاک)</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={resetFormForNewExam}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border ${
              isCreatingNew
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ زیادکردنی تاقیکردنەوەی نوێ</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>١. ڕێکخستنی تاقیکردنەوە</span>
          </button>

          <button
            type="button"
            disabled={isCreatingNew}
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'questions'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>٢. دانانی پرسیارەکان ({questions.length})</span>
          </button>

          <button
            type="button"
            disabled={isCreatingNew}
            onClick={() => setActiveTab('passcodes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'passcodes'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>٣. دروستکردنی پاسوۆرد ({passcodes.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* ======================================================== */}
          {/* TAB 1: EXAM SETTINGS                                    */}
          {/* ======================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ناوی سەرەکیی تاقیکردنەوە:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="نموونە: خولی فەرمیی پێشبڕکێی ئۆنلاینی KSC - خولی یەکەم"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    دەقی ڕوونکردنەوەی تاقیکردنەوە:
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ڕێنمایی کورت بۆ قوتابییان (دەتوانیت بە Enter دێڕی نوێ بنووسیت)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>سپۆنسەر و دیارییەکان:</span>
                  </label>
                  <textarea
                    rows={2}
                    value={sponsorsAndPrizes}
                    onChange={(e) => setSponsorsAndPrizes(e.target.value)}
                    placeholder="سپۆنسەری فەرمی: کۆمپانیای ... • دیاری: ١ ملیۆن دینار و بڕوانامە"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>کاتی دەستپێکردن:</span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-medium">
                        بە کاتی فەرمیی کوردستان (GMT+3)
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>مۆڵەتی چوونەژوورەوە دوای دەستپێکردن:</span>
                      </span>
                      <span className="text-[10px] text-amber-300">
                        خولەک
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={entryCutoffMins}
                      onChange={(e) => setEntryCutoffMins(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="block text-[10px] text-slate-400 mt-1">
                      دوای تێپەڕبوونی ئەم ماوەیە، دەرگای بەشداری دادەخرێت.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      کاتی هەر پرسیارێک (بە چرکە):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      value={questionDuration}
                      onChange={(e) => setQuestionDuration(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      کاتی ماوە بۆ ناردن (خولەک):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={telegramMins}
                      onChange={(e) => setTelegramMins(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>لینکی گرووپی تێلیگرام بۆ ناردنی پەڕەی سۆما:</span>
                  </label>
                  <input
                    type="url"
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                    placeholder="https://t.me/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    dir="ltr"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="activeToggle" className="text-xs font-bold text-white cursor-pointer select-none">
                    تاقیکردنەوەکە کارا بێت لەسەر ماڵپەڕ (Active لە سلايدەر دەربکەوێت)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4" />}
                  <span>{isCreatingNew ? 'دروستکردنی تاقیکردنەوە' : 'پاشەکەوتکردنی ڕێکخستنەکان'}</span>
                </button>
              </form>

              {/* Danger Zone: DELETE EXAM & DISK CLEANUP */}
              {exam?.id && !isCreatingNew && (
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-rose-300">
                        سڕینەوەی ئەم تاقیکردنەوەیە و خاوێنکردنەوەی تەواوی سێرڤەر
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        بە سڕینەوەی ئەم تاقیکردنەوەیە، هەموو وێنەی پرسیارەکان لە هارد و سێرڤەر دەسڕدرێنەوە تاوەکو سێرڤەر قورس و خاو نەبێت. هەروەها هەموو پرسیار و پاسوۆردەکان بە یەکجاری دەسڕدرێنەوە.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>سڕینەوەی ئەم تاقیکردنەوەیە لە سێرڤەر</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: QUESTIONS BUILDER                                */}
          {/* ======================================================== */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              
              {/* Header Action Bar */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>بەڕێوەبردنی پرسیارەکان ({questions.length} پرسیار)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    پرسیار و وێنەکان دابنێ؛ لەسەر شاشەی قوتابی وەڵامەکان دەرناکەون و قوتابی لەسەر پەڕەی سۆما پڕی دەکاتەوە.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>زیادکردنی پرسیار</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Save className="w-3.5 h-3.5" />}
                    <span>پاشەکەوتکردن</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 shadow-md space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-mono text-xs font-black">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-white">پرسیاری ژمارە {idx + 1}</span>
                      </div>

                      {/* Question Order & Delete Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                          title="بەرەو سەرەوە"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 1)}
                          disabled={idx === questions.length - 1}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                          title="بەرەو خوارەوە"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                          title="سڕینەوەی ئەم پرسیارە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text Box with Paste Shortcut */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-400">دەقی پرسیار:</label>
                        <button
                          type="button"
                          onClick={() => handlePasteQuestionText(idx)}
                          className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 font-bold"
                        >
                          <ClipboardPaste className="w-3 h-3" />
                          <span>پەیستکردن لە کلیپبۆرد (Paste)</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={q.question_text}
                        onChange={(e) => handleUpdateQuestion(idx, 'question_text', e.target.value)}
                        placeholder="دەقی پرسیار لێرە بنووسە یان پەیستی بکە (دەتوانیت بە Enter دێڕی نوێ بنووسیت)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed resize-y"
                      />
                    </div>

                    {/* Image Attachment (Auto Compressed) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3">
                        {q.image_url ? (
                          <div className="relative group/thumb">
                            <img
                              src={getUploadUrl(q.image_url)}
                              alt={`Question ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-xl border border-slate-700 shadow"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, 'image_url', null)}
                              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500 transition-colors"
                              title="سڕینەوەی وێنە"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 text-[10px]">
                            <ImageIcon className="w-5 h-5 mb-0.5" />
                            <span>بێ وێنە</span>
                          </div>
                        )}

                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700 transition-all shadow-sm">
                            {uploadingImageIndex === idx ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{q.image_url ? 'گۆڕینی وێنە' : 'بارکردنی وێنەی پرسیار'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadQuestionImage(idx, file);
                              }}
                            />
                          </label>
                          <span className="block text-[10px] text-slate-400 mt-1">
                            وێنەکان خۆکارانە دەپەستێنرێن بۆ کێشی زۆر کەم تاوەکو خێرابێت.
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold">هیچ پرسیارێک بۆ ئەم تاقیکردنەوەیە زیاد نەکراوە.</p>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>زیادکردنی یەکەم پرسیار</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PASSCODES GENERATOR                              */}
          {/* ======================================================== */}
          {activeTab === 'passcodes' && (
            <div className="space-y-6">
              
              {/* Passcode Stats & Generation Controls */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>دروستکردن و بەڕێوەبردنی پاسوۆردی یەکجار بەکارهاتوو</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      پاسوۆردەکان تەنها بۆ یەکجارن و پاش چوونەژوورەوە دەسوتێن.
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      بەردەست: {availableCount}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-bold">
                      بەکارهاتوو: {usedCount}
                    </span>
                  </div>
                </div>

                {/* Generator Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">ژمارەی کۆدەکان:</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={generateCount}
                      onChange={(e) => setGenerateCount(e.target.value)}
                      className="w-20 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePasscodes}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>خۆکارانە پاسوۆرد دروست بکە</span>
                  </button>

                  <div className="flex-1" />

                  {/* Actions: Copy & Download */}
                  <button
                    type="button"
                    onClick={handleCopyAvailableCodes}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>کۆپیکردنی بەردەستەکان ({availableCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>دابەزاندنی فایل (TXT)</span>
                  </button>
                </div>
              </div>

              {/* Passcodes Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">کۆدی پاسوۆرد</th>
                        <th className="p-3">دۆخ</th>
                        <th className="p-3">بەشداربوو / قوتابی</th>
                        <th className="p-3">کردار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {passcodes.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="p-3 font-mono font-black text-amber-300 text-xs" dir="ltr">
                            {p.code}
                          </td>
                          <td className="p-3">
                            {p.disqualified ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-bold text-[11px] border border-rose-500/30">
                                دەرکراوە (غەش)
                              </span>
                            ) : p.is_used ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[11px] border border-slate-700">
                                بەکارهاتووە
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                                بەردەستە (نوێ)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">
                            {p.student_name ? (
                              <div>
                                <span className="font-bold">{p.student_name}</span>
                                {p.student_phone && (
                                  <span className="text-[10px] text-slate-500 block font-mono">
                                    {p.student_phone}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleDeletePasscode(p.id)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                              title="سڕینەوە"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {passcodes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                            هیچ پاسوۆردێک دروست نەکراوە. دوگمەی "خۆکارانە پاسوۆرد دروست بکە" دابگرە.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modal for Exam Deletion */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">ئایا دڵنیایت لە سڕینەوە؟</h3>
                <span className="text-xs text-rose-300 font-bold">ئەم کردارە گەڕانەوەی نییە</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              بە سڕینەوەی ئەم تاقیکردنەوەیە:
              <br />
              • هەموو وێنەی پرسیارەکان لە هارد و سێرڤەر بە یەکجاری دەسڕدرێنەوە تا سێرڤەر خاو نەبێت.
              <br />
              • سەرجەم پرسیارەکان و پاسوۆردەکانی پەیوەست بەم تاقیکردنەوەیە دەسڕدرێنەوە.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>سڕینەوە و پاککردنەوە</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
