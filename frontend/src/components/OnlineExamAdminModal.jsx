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
  AlertOctagon,
  FileText,
  Sparkles,
  Users,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

const unpackTrilingual = (raw) => {
  if (!raw) return { ku: '', en: '', ar: '' };
  if (typeof raw !== 'string') return { ku: String(raw), en: '', ar: '' };
  const str = raw.trim();
  if (str.includes('|||')) {
    const parts = str.split('|||').map((s) => s.trim());
    return { ku: parts[0] || '', en: parts[1] || '', ar: parts[2] || '' };
  }
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      return { ku: parsed.ku || '', en: parsed.en || '', ar: parsed.ar || '' };
    } catch (e) {}
  }
  return { ku: str, en: '', ar: '' };
};

const packTrilingual = (ku, en, ar) => {
  const cleanKu = (ku || '').trim();
  const cleanEn = (en || '').trim();
  const cleanAr = (ar || '').trim();
  if (!cleanEn && !cleanAr) return cleanKu;
  return `${cleanKu} ||| ${cleanEn} ||| ${cleanAr}`;
};

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

  // Exam Settings Form (Multilingual)
  const [examLang, setExamLang] = useState('ku'); // 'ku' | 'en' | 'ar'
  const [title, setTitle] = useState('');
  const [titleKu, setTitleKu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [description, setDescription] = useState('');
  const [descKu, setDescKu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [sponsorsAndPrizes, setSponsorsAndPrizes] = useState('');
  const [prizesKu, setPrizesKu] = useState('');
  const [prizesEn, setPrizesEn] = useState('');
  const [prizesAr, setPrizesAr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [questionDuration, setQuestionDuration] = useState(60);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [telegramMins, setTelegramMins] = useState(5);
  const [entryCutoffMins, setEntryCutoffMins] = useState(3);
  const [isActive, setIsActive] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [allowScreenSelection, setAllowScreenSelection] = useState(true);
  const [examMode, setExamMode] = useState('ONLINE'); // 'ONLINE' or 'SOMA'

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Passcodes state
  const [passcodes, setPasscodes] = useState([]);
  const [generateCount, setGenerateCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [savingNames, setSavingNames] = useState(false);
  const [hasUnsavedNames, setHasUnsavedNames] = useState(false);
  const [showBatchPasteModal, setShowBatchPasteModal] = useState(false);
  const [batchNamesText, setBatchNamesText] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
        await loadExamDetails(targetId, examsList);
        return targetId;
      } else {
        // No exams exist yet, set to creation mode
        resetFormForNewExam();
        return null;
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadExamDetails = async (examId, sourceList = null) => {
    try {
      setSelectedExamId(examId);
      setIsCreatingNew(false);

      // Find exam info from sourceList or state
      const listToSearch = sourceList || allExams;
      let current = listToSearch.find((e) => e.id === examId);
      
      // If still not found in list, fetch fresh list directly
      if (!current) {
        const directRes = await api.get('/online-exam/admin/exams');
        const freshList = directRes.data || [];
        setAllExams(freshList);
        current = freshList.find((e) => e.id === examId);
      }

      setExam(current || null);
      if (current) {
        const unpTitle = unpackTrilingual(current.title);
        setTitle(unpTitle.ku || current.title || '');
        setTitleKu(unpTitle.ku || current.title || '');
        setTitleEn(unpTitle.en || '');
        setTitleAr(unpTitle.ar || '');

        const unpDesc = unpackTrilingual(current.description);
        setDescription(unpDesc.ku || current.description || '');
        setDescKu(unpDesc.ku || current.description || '');
        setDescEn(unpDesc.en || '');
        setDescAr(unpDesc.ar || '');

        const unpPrizes = unpackTrilingual(current.sponsors_and_prizes);
        setSponsorsAndPrizes(unpPrizes.ku || current.sponsors_and_prizes || '');
        setPrizesKu(unpPrizes.ku || current.sponsors_and_prizes || '');
        setPrizesEn(unpPrizes.en || '');
        setPrizesAr(unpPrizes.ar || '');

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
        setIsComingSoon(Boolean(current.is_coming_soon));
        setAllowScreenSelection(Boolean(current.allow_screen_selection));
        setExamMode(current.exam_mode || 'ONLINE');
      }
      setHasUnsavedNames(false);

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
    setTitleKu('');
    setTitleEn('');
    setTitleAr('');
    setDescription('');
    setDescKu('');
    setDescEn('');
    setDescAr('');
    setSponsorsAndPrizes('');
    setPrizesKu('');
    setPrizesEn('');
    setPrizesAr('');
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
    setIsComingSoon(false);
    setAllowScreenSelection(true);
    setExamMode('ONLINE');
    setHasUnsavedNames(false);
    setQuestions([]);
    setPasscodes([]);
    setActiveTab('settings');
  };

  // 1. SAVE EXAM SETTINGS (Create or Update)
  const handleSaveSettings = async (e = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const finalTitle = packTrilingual(titleKu || title, titleEn, titleAr);
    const finalDesc = packTrilingual(descKu || description, descEn, descAr);
    const finalPrizes = packTrilingual(prizesKu || sponsorsAndPrizes, prizesEn, prizesAr);

    if (!finalTitle.trim()) {
      if (onShowToast) onShowToast({ type: 'error', message: 'ناوی تاقیکردنەوە پێویستە بنووسیت' });
      return null;
    }

    try {
      setSaving(true);
      const payload = {
        title: finalTitle,
        description: finalDesc,
        sponsors_and_prizes: finalPrizes,
        start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        question_duration_seconds: Number(questionDuration) || 60,
        telegram_group_url: telegramUrl.trim(),
        telegram_submission_minutes: Number(telegramMins) || 5,
        entry_cutoff_minutes: Number(entryCutoffMins) || 3,
        is_active: isActive,
        is_coming_soon: isComingSoon,
        allow_screen_selection: allowScreenSelection,
        exam_mode: examMode
      };

      let savedExamId = exam?.id;
      if (savedExamId && !isCreatingNew) {
        await api.put(`/online-exam/admin/exams/${savedExamId}`, payload);
        if (onShowToast) onShowToast({ type: 'success', message: 'ڕێکخستنەکانی تاقیکردنەوە نوێکرانەوە' });
      } else {
        const res = await api.post('/online-exam/admin/exams', payload);
        savedExamId = res.data?.exam_id;
        if (onShowToast) onShowToast({ type: 'success', message: 'تاقیکردنەوەی نوێ دروستکرا' });
      }

      if (savedExamId) {
        await fetchAllExamsAndSelect(savedExamId);
      }
      if (onExamUpdated) onExamUpdated();
      return savedExamId;
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ADVANCE FROM TAB 1 (SETTINGS) TO TAB 2 (QUESTIONS)
  const handleNextFromSettings = async () => {
    const savedId = await handleSaveSettings();
    if (savedId) {
      setActiveTab('questions');
    }
  };

  // ADVANCE FROM TAB 2 (QUESTIONS) TO TAB 3 (PASSCODES)
  const handleNextFromQuestions = async () => {
    let currentExamId = exam?.id || selectedExamId;
    if (!currentExamId) {
      currentExamId = await handleSaveSettings();
      if (!currentExamId) return;
    }
    await handleSaveQuestions();
    setActiveTab('passcodes');
  };

  // PUBLISH EXAM CONFIRMATION ACTION
  const handlePublishExam = async () => {
    let currentExamId = exam?.id || selectedExamId;
    if (!currentExamId) {
      currentExamId = await handleSaveSettings();
      if (!currentExamId) return;
    }

    try {
      setPublishing(true);
      if (hasUnsavedNames && passcodes.length > 0) {
        await handleSavePasscodeNames();
      }

      const finalTitle = packTrilingual(titleKu || title, titleEn, titleAr);
      const finalDesc = packTrilingual(descKu || description, descEn, descAr);
      const finalPrizes = packTrilingual(prizesKu || sponsorsAndPrizes, prizesEn, prizesAr);

      const payload = {
        title: finalTitle,
        description: finalDesc,
        sponsors_and_prizes: finalPrizes,
        start_time: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        question_duration_seconds: Number(questionDuration) || 60,
        telegram_group_url: telegramUrl.trim(),
        telegram_submission_minutes: Number(telegramMins) || 5,
        entry_cutoff_minutes: Number(entryCutoffMins) || 3,
        is_active: true,
        is_coming_soon: isComingSoon,
        allow_screen_selection: allowScreenSelection,
        exam_mode: examMode
      };
      await api.put(`/online-exam/admin/exams/${currentExamId}`, payload);
      setIsActive(true);
      setShowPublishModal(false);

      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: '🎉 تاقیکردنەوەکە بە فەرمی بڵاوکرایەوە و ئێستا بۆ قوتابییان بەردەستە'
        });
      }
      if (onExamUpdated) onExamUpdated();
      onClose();
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setPublishing(false);
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
        image_url: null,
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: ''
      }
    ]);
  };

  const handlePasteAllOptions = async (index) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const cleanLine = (str) => str.replace(/^[A-Da-d1-4][\.\)\-\:]\s*/, '').trim();
        const updated = [...questions];
        updated[index] = {
          ...updated[index],
          option_a: lines[0] ? cleanLine(lines[0]) : (updated[index].option_a || ''),
          option_b: lines[1] ? cleanLine(lines[1]) : (updated[index].option_b || ''),
          option_c: lines[2] ? cleanLine(lines[2]) : (updated[index].option_c || ''),
          option_d: lines[3] ? cleanLine(lines[3]) : (updated[index].option_d || '')
        };
        setQuestions(updated);
        if (onShowToast) onShowToast({ type: 'success', message: 'هەڵبژاردنەکان بە سەرکەوتوویی دابەشکران' });
      } else {
        if (onShowToast) onShowToast({ type: 'info', message: 'تکایە دڵنیابەرەوە کە هەر هەڵبژاردنێک لە دێڕێکی جیاواز بێت' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: 'ڕێگەپێدانی پەیستکردن لە وێبگەڕ نییە' });
    }
  };

  const handleClearOptions = (index) => {
    const updated = [...questions];
    updated[index] = {
      ...updated[index],
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: ''
    };
    setQuestions(updated);
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
    let currentExamId = exam?.id || selectedExamId;
    if (!currentExamId) {
      currentExamId = await handleSaveSettings();
      if (!currentExamId) return;
    }
    try {
      setSaving(true);
      const payload = questions.map((q, idx) => ({
        order_num: idx + 1,
        question_text: q.question_text || '',
        image_url: q.image_url || null,
        option_a: q.option_a ? q.option_a.trim() : null,
        option_b: q.option_b ? q.option_b.trim() : null,
        option_c: q.option_c ? q.option_c.trim() : null,
        option_d: q.option_d ? q.option_d.trim() : null,
        correct_answer: q.correct_answer ? q.correct_answer.trim() : null
      }));
      await api.put(`/online-exam/admin/exams/${currentExamId}/questions`, payload);
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
    let currentExamId = exam?.id || selectedExamId;
    if (!currentExamId) {
      currentExamId = await handleSaveSettings();
      if (!currentExamId) return;
    }
    try {
      setGenerating(true);
      const res = await api.post(`/online-exam/admin/exams/${currentExamId}/generate-passcodes`, {
        count: Number(generateCount) || 20
      });

      if (onShowToast) onShowToast({ type: 'success', message: res.data?.message_ku || 'پاسوۆردەکان دروستکران' });

      // Refresh passcodes
      const pRes = await api.get(`/online-exam/admin/exams/${currentExamId}/passcodes`);
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

  const handleStudentNameChange = (id, newName) => {
    setPasscodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, student_name: newName } : p))
    );
    setHasUnsavedNames(true);
  };

  const handleSavePasscodeNames = async () => {
    let currentExamId = exam?.id || selectedExamId;
    if (!currentExamId) {
      currentExamId = await handleSaveSettings();
      if (!currentExamId) return;
    }
    try {
      setSavingNames(true);
      const items = passcodes.map((p) => ({
        id: p.id,
        student_name: p.student_name ? p.student_name.trim() : ''
      }));
      await api.put(`/online-exam/admin/exams/${currentExamId}/passcodes/names`, { items });
      setHasUnsavedNames(false);
      if (onShowToast) {
        onShowToast({ type: 'success', message: 'ناوی قوتابییان بە سەرکەوتوویی پاشەکەوت کران' });
      }
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: err.message });
    } finally {
      setSavingNames(false);
    }
  };

  const handleApplyBatchNames = () => {
    const rawLines = batchNamesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) {
      if (onShowToast) onShowToast({ type: 'warning', message: 'تکایە سەرەتا لیستێکی ناوەکان دابنێ' });
      return;
    }

    if (passcodes.length === 0) {
      if (onShowToast) onShowToast({ type: 'error', message: 'هیچ پاسوۆردێک بەردەست نییە بۆ دابەشکردنی ناوەکان!' });
      return;
    }

    const updated = passcodes.map((p, idx) => {
      if (idx < rawLines.length) {
        return { ...p, student_name: rawLines[idx] };
      }
      return p;
    });

    setPasscodes(updated);
    setHasUnsavedNames(true);
    setShowBatchPasteModal(false);
    setBatchNamesText('');
    if (onShowToast) {
      onShowToast({
        type: 'success',
        message: `${Math.min(rawLines.length, passcodes.length)} ناو بە سەرکەوتوویی دابەشکران بەسەر پاسوۆردەکان (پاشەکەوتی بکە)`
      });
    }
  };

  const handleDownloadPdfReport = () => {
    if (passcodes.length === 0) {
      if (onShowToast) onShowToast({ type: 'info', message: 'هیچ پاسوۆردێک نییە بۆ دابەزاندن' });
      return;
    }

    const examTitle = exam?.title || 'تاقیکردنەوەی ئۆنلاینی KSC';
    const examDate = exam?.start_time
      ? new Date(exam.start_time).toLocaleString('ckb', {
          timeZone: 'Asia/Baghdad',
          dateStyle: 'full',
          timeStyle: 'short'
        })
      : 'دیاری نەکراوە';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('تکایە ڕێگە بە پەنجەرەی Pop-up بدە بۆ داگرتنی فایلی PDF');
      return;
    }

    const rowsHtml = passcodes
      .map((p, index) => {
        const student = p.student_name && p.student_name.trim()
          ? p.student_name.trim()
          : '<span style="color:#94a3b8; font-style:italic;">دیاری نەکراوە</span>';
        const status = p.disqualified
          ? '<span style="color:#e11d48; font-weight:bold;">دەرکراوە (غەش)</span>'
          : p.is_used
          ? '<span style="color:#64748b; font-weight:bold;">بەکارهاتووە</span>'
          : '<span style="color:#059669; font-weight:bold;">بەردەستە (نوێ)</span>';
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; background: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 10px 14px; text-align: center; font-weight: bold; color: #475569; width: 50px;">${index + 1}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">${student}</td>
            <td style="padding: 10px 14px; text-align: center; font-family: monospace; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 1px; direction: ltr;">
              <span style="background: #f1f5f9; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; display: inline-block;">${p.code}</span>
            </td>
            <td style="padding: 10px 14px; text-align: center; font-size: 12px;">${status}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ckb">
      <head>
        <meta charset="utf-8" />
        <title>KSC Passcodes - ${examTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .logo-badge {
            display: inline-block;
            background: #0f172a;
            color: #fbbf24;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          h1 {
            margin: 4px 0 6px 0;
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
          }
          .exam-meta {
            font-size: 12px;
            color: #475569;
            margin-top: 4px;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          .notice-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-right: 4px solid #f59e0b;
            padding: 10px 14px;
            border-radius: 8px;
            margin-bottom: 18px;
            font-size: 12px;
            color: #334155;
            line-height: 1.6;
          }
          .notice-box strong {
            color: #b45309;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 14px;
            font-weight: 800;
            text-align: right;
          }
          th:first-child { border-top-right-radius: 8px; }
          th:last-child { border-top-left-radius: 8px; }
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px dashed #cbd5e1;
            text-align: center;
            font-size: 11px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; text-align: center; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 10px;">
          <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 24px; border-radius: 8px; font-family: inherit; font-size: 14px; font-weight: bold; cursor: pointer;">
            🖨️ چاپکردن یان دابەزاندن وەک PDF (Save as PDF)
          </button>
          <span style="display: block; font-size: 11px; color: #1e40af; margin-top: 6px;">
            دەتوانیت لە بەشی پەڕەی چاپ 'Destination' بکەیت بە 'Save as PDF' و یەکسەر بینێریتە گرووپی تێلیگرام
          </span>
        </div>

        <div class="header">
          <div class="logo-badge">Kurdish Students Competition (KSC)</div>
          <h1>لیستی فەرمیی ناوی قوتابییان و کۆدی تایبەتی تاقیکردنەوە</h1>
          <div class="exam-meta">
            <span><strong>تاقیکردنەوە:</strong> ${examTitle}</span>
            <span><strong>کاتی دەستپێکردن:</strong> ${examDate}</span>
            <span><strong>کۆی بەشداربووان:</strong> ${passcodes.length} قوتابی</span>
          </div>
        </div>

        <div class="notice-box">
          <strong>⚠️ ڕێنمایی گرنگ بۆ بەشداربووان:</strong><br />
          ١. هەر قوتابییەک تەنها ئەو پاسوۆردە بەکاربهێنێت کە بەرامبەر ناوی خۆی دیاریکراوە.<br />
          ٢. پاسوۆردەکان تەنها بۆ یەکجارن؛ لەگەڵ چوونەژوورەوە دەسووتێن و بۆ کەسی تر کار ناکەن.<br />
          ٣. تکایە لە کاتی دیاریکراوی تاقیکردنەوە لە پلاتفۆرمی فەرمیی KSC ئامادە بن.
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">#</th>
              <th>ناوی سیانیی قوتابی</th>
              <th style="text-align: center;">کۆدی پاسوۆرد (Passcode)</th>
              <th style="text-align: center; width: 120px;">دۆخ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          سیستەمی تاقیکردنەوەی ئۆنلاینی KSC • مێژووی دەرکردن: ${new Date().toLocaleDateString('ckb', { timeZone: 'Asia/Baghdad' })} • کاتژمێر: ${new Date().toLocaleTimeString('ckb', { timeZone: 'Asia/Baghdad' })}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

            {allExams.map((ex) => {
              const displayTitle = unpackTrilingual(ex.title).ku || ex.title;
              return (
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
                  {displayTitle.length > 25 ? displayTitle.slice(0, 25) + '...' : displayTitle}
                  {!ex.is_active && (
                    <span className="mr-1 text-[10px] text-slate-400">(ناچالاک)</span>
                  )}
                </button>
              );
            })}
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
            onClick={async () => {
              if (!exam?.id || isCreatingNew) {
                await handleNextFromSettings();
              } else {
                setActiveTab('questions');
              }
            }}
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
            onClick={async () => {
              if (!exam?.id || isCreatingNew) {
                await handleNextFromSettings();
              }
              setActiveTab('passcodes');
            }}
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
            <div className="max-w-2xl mx-auto space-y-6">
              <form onSubmit={handleSaveSettings} className="space-y-5">
                {/* Multilingual Selector for Exam Details */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400">زمانی زانیارییەکان / Language:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExamLang('ku')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          examLang === 'ku'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        کوردى (بنەڕەت)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamLang('en')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          examLang === 'en'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamLang('ar')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          examLang === 'ar'
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        عربي
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {examLang === 'ku' ? 'زانیاری تاقیکردنەوە بە کوردی' : examLang === 'en' ? 'Exam details in English' : 'تفاصيل الامتحان باللغة العربية'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ناوی سەرەکیی تاقیکردنەوە ({examLang === 'ku' ? 'کوردی' : examLang === 'en' ? 'English' : 'عربي'}):
                  </label>
                  <input
                    type="text"
                    value={examLang === 'ku' ? titleKu : examLang === 'en' ? titleEn : titleAr}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (examLang === 'ku') {
                        setTitleKu(v);
                        setTitle(v);
                      } else if (examLang === 'en') {
                        setTitleEn(v);
                      } else {
                        setTitleAr(v);
                      }
                    }}
                    placeholder={examLang === 'ku' ? 'نموونە: خولی فەرمیی پێشبڕکێی ئۆنلاینی KSC - خولی یەکەم' : examLang === 'en' ? 'e.g. KSC Official Live Online Exam - Round 1' : 'مثال: الامتحان الإلكتروني المباشر لمنصة KSC - الجولة الأولى'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    dir={examLang === 'en' ? 'ltr' : 'rtl'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    دەقی ڕوونکردنەوەی تاقیکردنەوە ({examLang === 'ku' ? 'کوردی' : examLang === 'en' ? 'English' : 'عربي'}):
                  </label>
                  <textarea
                    rows={3}
                    value={examLang === 'ku' ? descKu : examLang === 'en' ? descEn : descAr}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (examLang === 'ku') {
                        setDescKu(v);
                        setDescription(v);
                      } else if (examLang === 'en') {
                        setDescEn(v);
                      } else {
                        setDescAr(v);
                      }
                    }}
                    placeholder={examLang === 'ku' ? 'ڕێنمایی کورت بۆ قوتابییان (دەتوانیت بە Enter دێڕی نوێ بنووسیت)...' : examLang === 'en' ? 'Brief instructions for participants (press Enter for new line)...' : 'تعليمات موجزة للطلاب (يمكنك الضغط على Enter لإضافة سطر جديد)...'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                    dir={examLang === 'en' ? 'ltr' : 'rtl'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-400" />
                    <span>سپۆنسەر و دیارییەکان ({examLang === 'ku' ? 'کوردی' : examLang === 'en' ? 'English' : 'عربي'}):</span>
                  </label>
                  <textarea
                    rows={2}
                    value={examLang === 'ku' ? prizesKu : examLang === 'en' ? prizesEn : prizesAr}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (examLang === 'ku') {
                        setPrizesKu(v);
                        setSponsorsAndPrizes(v);
                      } else if (examLang === 'en') {
                        setPrizesEn(v);
                      } else {
                        setPrizesAr(v);
                      }
                    }}
                    placeholder={examLang === 'ku' ? 'سپۆنسەری فەرمی: کۆمپانیای ... • دیاری: ١ ملیۆن دینار و بڕوانامە' : examLang === 'en' ? 'Official Sponsor: ... • Prizes: 1M IQD and Gold Certificates' : 'الراعي الرسمي: شركة ... • الجوائز: مليون دينار وشهادات تقديرية'}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                    dir={examLang === 'en' ? 'ltr' : 'rtl'}
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

                {/* Active & Coming Soon Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <input
                      type="checkbox"
                      id="comingSoonToggle"
                      checked={isComingSoon}
                      onChange={(e) => setIsComingSoon(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor="comingSoonToggle" className="text-xs font-bold text-amber-300 cursor-pointer select-none flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>دیاریکردن وەک «بەمزوانە - لە ڕێگایە»</span>
                    </label>
                  </div>
                </div>

                {/* Exam Mode: Digital Online Exam vs Paper Soma Exam */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-white">
                      شێوازی تاقیکردنەوە و هەڵسەنگاندن (Exam Mode):
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mode 1: Digital Online Exam (No Soma, Instant Results) */}
                    <div
                      onClick={() => {
                        setExamMode('ONLINE');
                        setAllowScreenSelection(true);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        examMode === 'ONLINE'
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        id="digitalOnlineModeRadio"
                        name="examModeGroup"
                        checked={examMode === 'ONLINE'}
                        onChange={() => {
                          setExamMode('ONLINE');
                          setAllowScreenSelection(true);
                        }}
                        className="mt-0.5 text-emerald-500 focus:ring-emerald-400 bg-slate-900"
                      />
                      <label htmlFor="digitalOnlineModeRadio" className="cursor-pointer">
                        <span className="block text-xs font-black text-white flex items-center gap-1.5">
                          <span>١. تاقیکردنەوەی ئۆنلاین (بەبێ سۆما)</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            پێشنیارکراو
                          </span>
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-1 leading-relaxed">
                          قوتابی لەسەر شاشە کلیک لە وەڵامەکان دەکات و یەکسەر دەچێتە پرسیاری دواتر • ئەنجامەکان دەستبەجێ بە ناوی ئەم تاقیکردنەوەیە دەچنە ناو بەشی ئەنجامەکان و پێشبڕکێ و ڕیزبەندی ماڵپەڕ • لە کۆتاییدا نمرە و هەڵسەنگاندنی وەڵامە دروست و هەڵەکانی خۆی دەبینێت.
                        </span>
                      </label>
                    </div>

                    {/* Mode 2: Paper OMR Exam (Soma + Telegram) */}
                    <div
                      onClick={() => setExamMode('SOMA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        examMode === 'SOMA'
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        id="paperSomaModeRadio"
                        name="examModeGroup"
                        checked={examMode === 'SOMA'}
                        onChange={() => setExamMode('SOMA')}
                        className="mt-0.5 text-amber-500 focus:ring-amber-400 bg-slate-900"
                      />
                      <label htmlFor="paperSomaModeRadio" className="cursor-pointer">
                        <span className="block text-xs font-black text-white">
                          ٢. تاقیکردنەوە بە پەڕەی سۆما (Paper OMR)
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-1 leading-relaxed">
                          پرسیارەکان لەسەر شاشە دەردەکەون، قوتابی لەسەر پەڕەی سۆما بازنەکان پڕدەکاتەوە و لە کۆتاییدا بە وێنە بۆ گرووپی تێلیگرام دەنێردرێت.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                    <span>پاشەکەوتکردنی ڕێکخستنەکان</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromSettings}
                    disabled={saving}
                    className="w-full sm:flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>دواتر: هەنگاوی دانانی پرسیارەکان</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
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

                    {/* Multiple Choice Options (A, B, C, D) */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>هەڵبژاردنەکانی پرسیار (ABCD):</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (وەڵامەکان لەسەر شاشەی قوتابی دەردەکەون)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Paste 4 options from clipboard */}
                          <button
                            type="button"
                            onClick={() => handlePasteAllOptions(idx)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="پەیستکردنی چوار هەڵبژاردنەکە پێکەوە لە کلیپبۆرد"
                          >
                            <ClipboardPaste className="w-3 h-3 text-indigo-400" />
                            <span>پەیستی ٤ وەڵامەکە پێکەوە</span>
                          </button>

                          {/* Clear options */}
                          {(q.option_a || q.option_b || q.option_c || q.option_d) && (
                            <button
                              type="button"
                              onClick={() => handleClearOptions(idx)}
                              className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              پاککردنەوە
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2x2 Grid for ABCD Choices */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        
                        {/* Option A */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/40 transition-all">
                          <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-black shrink-0 shadow-sm">
                            A
                          </span>
                          <input
                            type="text"
                            value={q.option_a || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'option_a', e.target.value)}
                            placeholder="هەڵبژاردنی A بنووسە..."
                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                          />
                        </div>

                        {/* Option B */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/40 transition-all">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono text-xs font-black shrink-0 shadow-sm">
                            B
                          </span>
                          <input
                            type="text"
                            value={q.option_b || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'option_b', e.target.value)}
                            placeholder="هەڵبژاردنی B بنووسە..."
                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                          />
                        </div>

                        {/* Option C */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-2 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500/40 transition-all">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono text-xs font-black shrink-0 shadow-sm">
                            C
                          </span>
                          <input
                            type="text"
                            value={q.option_c || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'option_c', e.target.value)}
                            placeholder="هەڵبژاردنی C بنووسە..."
                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                          />
                        </div>

                        {/* Option D */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl p-2 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40 transition-all">
                          <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-mono text-xs font-black shrink-0 shadow-sm">
                            D
                          </span>
                          <input
                            type="text"
                            value={q.option_d || ''}
                            onChange={(e) => handleUpdateQuestion(idx, 'option_d', e.target.value)}
                            placeholder="هەڵبژاردنی D بنووسە..."
                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                          />
                        </div>

                      </div>

                      {/* Correct Answer Selection Bar */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>دیاریکردنی وەڵامی دروست:</span>
                          {q.correct_answer ? (
                            <span className="text-emerald-400 font-mono font-black">({q.correct_answer})</span>
                          ) : (
                            <span className="text-slate-500 font-normal text-[10px]">(دیاری نەکراوە)</span>
                          )}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleUpdateQuestion(idx, 'correct_answer', q.correct_answer === opt ? '' : opt)}
                              className={`w-7 h-7 rounded-lg font-mono text-xs font-black transition-all border ${
                                q.correct_answer === opt
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30 scale-105'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                              }`}
                              title={`دیاریکردنی (${opt}) وەک وەڵامی ڕاست`}
                            >
                              {opt}
                            </button>
                          ))}
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

              {/* Tab 2 Footer Navigation (Back to Settings & Next to Passcodes) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>گەڕانەوە بۆ ڕێکخستنەکان</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
                    <span>پاشەکەوتکردنی پرسیارەکان</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromQuestions}
                    disabled={saving}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span>دواتر: دروستکردنی پاسوۆرد</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
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

                {/* Generator Bar & Primary Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800">
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
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                    <span>خۆکارانە پاسوۆرد دروست بکە</span>
                  </button>

                  {/* Batch Paste Names Button */}
                  <button
                    type="button"
                    onClick={() => setShowBatchPasteModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-500/50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-indigo-300" />
                    <span>دابەشکردنی خێرای ناوەکان (Batch Paste)</span>
                  </button>

                  {/* Save Names Button */}
                  <button
                    type="button"
                    onClick={handleSavePasscodeNames}
                    disabled={savingNames}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                      hasUnsavedNames
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {savingNames ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{hasUnsavedNames ? '💾 پاشەکەوتکردنی ناوەکان *' : 'پاشەکەوتکردنی ناوەکان'}</span>
                  </button>

                  {/* Official PDF Report Button */}
                  <button
                    type="button"
                    onClick={handleDownloadPdfReport}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-200" />
                    <span>📄 دابەزاندنی فایلی فەرمیی PDF</span>
                  </button>

                  <div className="flex-1" />

                  {/* Actions: Copy & Download TXT */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAvailableCodes}
                      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      title="کۆپیکردنی کۆدەکان بۆ تێلێگرام"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>کۆپیکردن ({availableCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTxt}
                      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      title="دابەزاندنی لیستی دەقی TXT"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>TXT</span>
                    </button>
                  </div>
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
                        <th className="p-3">ناوی قوتابی (دەستکاری دەکرێت)</th>
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
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="ناوی سیانیی قوتابی لێرە بنووسە..."
                                value={p.student_name || ''}
                                onChange={(e) => handleStudentNameChange(p.id, e.target.value)}
                                className="w-full min-w-[200px] max-w-sm px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
                              />
                              {p.student_phone && (
                                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                  {p.student_phone}
                                </span>
                              )}
                            </div>
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

              {/* Tab 3 Footer Navigation (Back to Questions & Official Publish) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>گەڕانەوە بۆ پرسیارەکان</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {hasUnsavedNames && (
                    <button
                      type="button"
                      onClick={handleSavePasscodeNames}
                      disabled={savingNames}
                      className="px-4 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>پاشەکەوتکردنی ناوەکان</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPublishModal(true)}
                    className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>تەواوکردن و بڵاوکردنەوەی فەرمی (Publish Exam) ✨</span>
                  </button>
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

      {/* Batch Paste Student Names Modal */}
      {showBatchPasteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <ClipboardPaste className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">دابەشکردنی خێرای ناوی قوتابییان</h3>
                  <span className="text-xs text-slate-400">
                    ناوەکان لە تێلێگرام یان ئێکسڵ کۆپی بکە و پەیستیان بکە
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchPasteModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                لیستی ناوی قوتابییان (هەر دێڕێک ناوێکی تێدا بێت):
              </label>
              <textarea
                rows={8}
                value={batchNamesText}
                onChange={(e) => setBatchNamesText(e.target.value)}
                placeholder={"ئەحمەد عەلی حەسەن\nمحەممەد کەریم قادر\nسارا کامەران ڕەئووف\n..."}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                سیستەمەکە بە پێی ڕیزبەندی پاسوۆردەکان هەر ناوێک دەبەستێتەوە بە کۆدێکی پاسوۆردەوە.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchPasteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                پەشیمانبوونەوە
              </button>
              <button
                type="button"
                onClick={handleApplyBatchNames}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                <span>دابەشکردن بەسەر پاسوۆردەکان</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Exam Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-emerald-500/40 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">ئایا دڵنیایت لە بڵاوکردنەوەی ئەم تاقیکردنەوەیە؟</h3>
                <span className="text-xs text-emerald-400 font-bold">بڵاوکردنەوە لەسەر پەڕەی سەرەکی بۆ هەموو قوتابییان</span>
              </div>
            </div>

            {/* Exam Summary Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-bold">ناوی تاقیکردنەوە:</span>
                <span className="text-white font-black">{title || 'تاقیکردنەوە'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-bold">شێوازی تاقیکردنەوە:</span>
                <span className="text-amber-400 font-black">
                  {examMode === 'ONLINE' ? 'ئۆنلاینی تەواو (دیجیتاڵی بەبێ سۆما)' : 'فۆڕمی سۆما (Paper OMR)'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-bold">ژمارەی پرسیارەکان:</span>
                <span className="text-indigo-300 font-mono font-black">{questions.length} پرسیار</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-bold">ژمارەی پاسوۆردەکان:</span>
                <span className="text-emerald-400 font-mono font-black">{passcodes.length} قوتابی</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400 font-bold">کاتی دەستپێکردن:</span>
                <span className="text-slate-200 font-mono font-bold">
                  {startTime ? new Date(startTime).toLocaleString('ckb') : 'دەستبەجێ'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              بە کلیک لەسەر «بەڵێ، ئێستا بڵاوی بکەرەوە»، تاقیکردنەوەکە دەبێتە Active و لەسەر پەڕەی پێشبڕکێ و ڕیزبەندی ماڵپەڕ کاتژمێری پێچەوانە دەستپێدەکات.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                پێداچوونەوە و گەڕانەوە
              </button>

              <button
                type="button"
                onClick={handlePublishExam}
                disabled={publishing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>بەڵێ، ئێستا بڵاوی بکەرەوە (Publish Now)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
