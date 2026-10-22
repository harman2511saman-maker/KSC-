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
  Sparkles,
  Gift,
  Send
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function OnlineExamAdminModal({ onClose, onShowToast, onExamUpdated }) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'questions' | 'passcodes'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exam, setExam] = useState(null);

  // Exam Settings Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sponsorsAndPrizes, setSponsorsAndPrizes] = useState('');
  const [startTime, setStartTime] = useState('');
  const [questionDuration, setQuestionDuration] = useState(60);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [telegramMins, setTelegramMins] = useState(5);
  const [isActive, setIsActive] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Passcodes state
  const [passcodes, setPasscodes] = useState([]);
  const [generateCount, setGenerateCount] = useState(20);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch current exam
      const res = await api.get('/online-exam/current');
      if (res.data?.id) {
        setExam(res.data);
        setTitle(res.data.title || '');
        setDescription(res.data.description || '');
        setSponsorsAndPrizes(res.data.sponsors_and_prizes || '');
        
        // Convert UTC ISO to local datetime-local string
        if (res.data.start_time) {
          const d = new Date(res.data.start_time);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setStartTime(localISO);
        }

        setQuestionDuration(res.data.question_duration_seconds || 60);
        setTelegramUrl(res.data.telegram_group_url || 'https://t.me/KurdishOMR');
        setTelegramMins(res.data.telegram_submission_minutes || 5);
        setIsActive(res.data.is_active ?? true);

        // Fetch questions
        const qRes = await api.get(`/online-exam/admin/exams/${res.data.id}/questions`);
        setQuestions(qRes.data || []);

        // Fetch passcodes
        const pRes = await api.get(`/online-exam/admin/exams/${res.data.id}/passcodes`);
        setPasscodes(pRes.data || []);
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 1. SAVE EXAM SETTINGS
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
        is_active: isActive
      };

      if (exam?.id) {
        await api.put(`/online-exam/admin/exams/${exam.id}`, payload);
      } else {
        await api.post('/online-exam/admin/exams', payload);
      }

      if (onShowToast) onShowToast({ type: 'success', message: 'ڕێکخستنەکان پاشەکەوت کران' });
      if (onExamUpdated) onExamUpdated();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
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
      if (onShowToast) onShowToast({ type: 'error', message: 'ڕێگەپێدانی Clipboard چالاک نییە' });
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
        if (onShowToast) onShowToast({ type: 'success', message: 'وێنەی پرسیار بە قەبارەی گونجاو بارکرا' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleSaveQuestions = async () => {
    if (!exam?.id) return;
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
    if (!exam?.id) return;
    try {
      setGenerating(true);
      const res = await api.post(`/online-exam/admin/exams/${exam.id}/generate-passcodes`, {
        count: Number(generateCount) || 20
      });

      if (onShowToast) onShowToast({ type: 'success', message: res.data?.message_ku || 'پاسوۆردەکان دروستکران' });

      // Refresh passcodes
      const pRes = await api.get(`/online-exam/admin/exams/${exam.id}/passcodes`);
      setPasscodes(pRes.data || []);
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
                بەڕێوەبردنی تاقیکردنەوەی ئۆنلاین (Online Exam Manager)
              </h2>
              <span className="text-xs text-slate-400">
                کۆنترۆڵی تاقیکردنەوە، پرسیارەکان، کاتەکان، و دروستکردنی پاسوۆردی خۆکار
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
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
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
            onClick={() => setActiveTab('passcodes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
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
            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-2xl mx-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ناوی سەرەکیی تاقیکردنەوە:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="خولی فەرمیی پێشبڕکێی ئۆنلاینی KSC"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  دەقی ڕوونکردنەوەی تاقیکردنەوە:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ڕوونکردنەوەی فەرمی لێرە بنووسە..."
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>سپۆنسەر و دیارییەکان (Sponsors & Prizes):</span>
                </label>
                <input
                  type="text"
                  value={sponsorsAndPrizes}
                  onChange={(e) => setSponsorsAndPrizes(e.target.value)}
                  placeholder="سپۆنسەری فەرمی: ... • دیاری: ٣ لاپتۆپ و بڕوانامەی شایستە بۆ قوتابییە یەکەمەکان"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>کاتی دەستپێکردنی تاقیکردنەوە (Start Date & Time):</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    پێش ئەم کاتە، دوگمەی تاقیکردنەوە ناچالاک دەبێت و چرکەژمێر لێدەدات.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>کاتی هەر پرسیارێک (بە چرکە):</span>
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={questionDuration}
                    onChange={(e) => setQuestionDuration(e.target.value)}
                    placeholder="60"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    کاتی گشتی خۆکارانە حیساب دەکرێت ({questions.length * questionDuration} چرکە = {Math.round((questions.length * questionDuration) / 60)} خولەک).
                  </span>
                </div>
              </div>

              {/* Telegram Final submission URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>بەستەری گرووپی تێلیگرام بۆ ناردنی پەڕەی سۆما:</span>
                  </label>
                  <input
                    type="text"
                    value={telegramUrl}
                    onChange={(e) => setTelegramUrl(e.target.value)}
                    placeholder="https://t.me/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    dir="ltr"
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
                  تاقیکردنەوەکە کارا بێت لەسەر ماڵپەڕ (Active)
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4" />}
                <span>پاشەکەوتکردنی ڕێکخستنەکان</span>
              </button>
            </form>
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
                    پرسیار و وێنەکان دابنێ؛ دوگمەی پەیستکردن ئاسانکاری دەکات لە کۆپیکردن و پەیستکردن.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ زیادکردنی پرسیار</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>پاشەکەوتکردنی هەموو پرسیارەکان</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-5">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-md space-y-4"
                  >
                    {/* Question Card Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <span className="font-black text-xs text-amber-400 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-xs">
                          {qIdx + 1}
                        </span>
                        <span>پرسیاری ژمارە {qIdx + 1}</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, -1)}
                          disabled={qIdx === 0}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                          title="سەرخستن"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(qIdx, 1)}
                          disabled={qIdx === questions.length - 1}
                          className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                          title="خوارخستن"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(qIdx)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 ml-1 transition-colors"
                          title="سڕینەوەی ئەم پرسیارە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text Area with PASTE button */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          دەقی پرسیار:
                        </label>

                        {/* Dedicated PASTE Button */}
                        <button
                          type="button"
                          onClick={() => handlePasteQuestionText(qIdx)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="پەیستکردنی ڕاستەوخۆ لە کلیپبۆرد"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          <span>پەیستکردنی دەق (Paste)</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={q.question_text || ''}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'question_text', e.target.value)}
                        placeholder="دەقی پرسیارەکە لێرە بنووسە یان پەیستی بکە..."
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    {/* Question Image (Optional) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-300">وێنەی پرسیار (ئارەزوومەندانە):</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {q.image_url ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={getUploadUrl(q.image_url)}
                              alt="Thumbnail"
                              className="h-10 w-14 object-cover rounded-lg border border-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuestion(qIdx, 'image_url', null)}
                              className="px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 text-[11px] font-bold hover:bg-rose-500/25 transition-colors"
                            >
                              سڕینەوەی وێنە
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition-colors">
                            {uploadingImageIndex === qIdx ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingImageIndex === qIdx ? 'بارکردن...' : 'بارکردنی وێنە (Auto-compressed)'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadQuestionImage(qIdx, e.target.files?.[0])}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <HelpCircle className="w-10 h-10 mx-auto opacity-40" />
                    <p className="text-xs font-bold">هیچ پرسیارێک دانەنراوە.</p>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                    >
                      + یەکەم پرسیار زیاد بکە
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PASSCODES GENERATOR (AUTOMATED CODE CREATION)    */}
          {/* ======================================================== */}
          {activeTab === 'passcodes' && (
            <div className="space-y-6">
              
              {/* Generator Action Header */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>دروستکردنی خۆکارانەی پاسوۆرد (Automated Passcode Generator)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      بە کۆمەڵ پاسوۆردی یەکجار بەکارهاتوو بە فۆرماتی تایبەت دروست بکە (نموونە: KSC-9482-XA).
                    </p>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-bold">
                      گشتی: {passcodes.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      بەردەست: {availableCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      بەکارهاتوو: {usedCount}
                    </span>
                  </div>
                </div>

                {/* Generator Form Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">ژمارەی پاسوۆرد:</span>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={generateCount}
                      onChange={(e) => setGenerateCount(e.target.value)}
                      className="w-24 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePasscodes}
                    disabled={generating}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>خۆکارانە پاسوۆرد دروست بکە</span>
                  </button>

                  <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

                  {/* Copy All Available */}
                  <button
                    type="button"
                    onClick={handleCopyAvailableCodes}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="کۆپیکردنی هەموو پاسوۆردە بەردەستەکان بۆ تێلیگرام یان وەتسئاپ"
                  >
                    <Copy className="w-3.5 h-3.5 text-sky-400" />
                    <span>کۆپیکردنی بەردەستەکان ({availableCount})</span>
                  </button>

                  {/* Download TXT */}
                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
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
    </div>
  );
}
