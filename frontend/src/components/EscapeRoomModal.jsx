import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  Award,
  Clock,
  ArrowRight,
  Zap,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  BookOpen,
  Phone,
  User,
  Plus,
  Trash2,
  Settings,
  GraduationCap,
  ShieldCheck,
  Check,
  Save,
  Medal,
  Crown,
  TrendingUp,
  Percent,
  ZoomIn,
  ZoomOut,
  UploadCloud,
  Image as ImageIcon,
  Search,
  Users,
  Edit2
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Built-in Synthesized Web Audio Sound Effects (Zero latency, cross-browser)
function playSound(type, soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'unlock') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'victory') {
      const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
      const times = [0, 0.12, 0.24, 0.36, 0.6, 0.9];
      const durs = [0.1, 0.1, 0.1, 0.2, 0.25, 0.8];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.22, ctx.currentTime + times[idx]);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + times[idx] + durs[idx]);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + times[idx]);
        osc.stop(ctx.currentTime + times[idx] + durs[idx] + 0.05);
      });
    }
  } catch (e) {
    // Audio Context policy
  }
}

// Fallback Subjects for Grade 12
const FALLBACK_SUBJECTS = [
  { code: 'physics', name_ku: 'فیزیا (Physics)', icon: '⚛️', color: 'from-cyan-600 to-blue-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'biology', name_ku: 'زیندەزانی (Biology)', icon: '🔬', color: 'from-emerald-600 to-teal-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'chemistry', name_ku: 'کیمیا (Chemistry)', icon: '🧪', color: 'from-amber-600 to-orange-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'math', name_ku: 'بیرکاری (Mathematics)', icon: '📐', color: 'from-indigo-600 to-purple-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'kurdish', name_ku: 'زمانی کوردی (Kurdish)', icon: '📚', color: 'from-rose-600 to-pink-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'english', name_ku: 'ئینگلیزی (Sunrise 12)', icon: '🌍', color: 'from-teal-600 to-emerald-600', chaptersCount: 0, questionsCount: 0 },
  { code: 'arabic', name_ku: 'عەرەبی (Arabic)', icon: '📖', color: 'from-amber-700 to-yellow-600', chaptersCount: 0, questionsCount: 0 }
];

export default function EscapeRoomModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Navigation views: 'auth' | 'subjects' | 'chapters' | 'gameplay' | 'result' | 'leaderboard' | 'admin'
  const [view, setView] = useState('auth');

  // Student Profile by Phone Number
  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem('ksc_student_phone') || '');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('ksc_student_name') || '');
  const [studentProgress, setStudentProgress] = useState(null);

  // Subject & Chapter State
  const [subjects, setSubjects] = useState(FALLBACK_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);

  // Gameplay State
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [timer, setTimer] = useState(45);
  const [timeSpent, setTimeSpent] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dialogue, setDialogue] = useState('سڵاو بلیمەتی پۆلی ١٢! ژمارەی مۆبایلەکەت بنووسە بۆ دەستپێکردن لە شوێنی خۆت.');
  const [floatingPoints, setFloatingPoints] = useState(null); // +10 points pop animation
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Resume In-Progress Section Modal Prompt
  const [pendingSavedSession, setPendingSavedSession] = useState(null);

  // Competitive Leaderboard State
  const [leaderboardData, setLeaderboardData] = useState({ top_students: [], my_stats: null });
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Lightbox Image Zoom Modal
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageInfo, setUploadedImageInfo] = useState(null);

  // Student Phone Identity Check
  const [phoneCheckStatus, setPhoneCheckStatus] = useState(null); // { registered: bool, student_name: str }

  // Admin Tab & Student Management State
  const [adminTab, setAdminTab] = useState('questions'); // 'questions' | 'students'
  const [adminStudents, setAdminStudents] = useState([]);
  const [adminStudentSearch, setAdminStudentSearch] = useState('');
  const [loadingAdminStudents, setLoadingAdminStudents] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // { id, student_name, total_score, phone_number }

  // Admin Question Management State
  const [adminChapters, setAdminChapters] = useState([]);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [loadingAdminQuestions, setLoadingAdminQuestions] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterData, setNewChapterData] = useState({
    unit_title_ku: '',
    section_title_ku: '',
    order: 1
  });

  const [newQuestion, setNewQuestion] = useState({
    subject_id: 1,
    chapter_id: 1,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A',
    ministerial_year: '٢٠٢٤ خولی یەکەم',
    explanation_ku: '',
    image_url: ''
  });

  const timerRef = useRef(null);

  // Load Subjects from API
  const fetchSubjects = async () => {
    try {
      const res = await api.get('/quiz/subjects');
      if (res.data && res.data.length > 0) {
        setSubjects(res.data);
      }
    } catch (e) {
      // Keep fallback
    }
  };

  // Fetch Leaderboard with Personal Rank
  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await api.get('/quiz/leaderboard', {
        params: {
          phone_number: phoneNumber || undefined,
          subject_code: selectedSubject?.code || undefined
        }
      });
      setLeaderboardData(res.data);
    } catch (e) {
      // Empty leaderboard fallback when no real students yet
      setLeaderboardData({
        top_students: [],
        my_stats: null
      });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Admin Methods to Load Chapters & Questions
  const fetchAdminChapters = async (subjId) => {
    const subj = subjects.find(s => s.id === subjId || s.code === subjId) || subjects[0];
    if (!subj) return;
    try {
      const res = await api.get(`/quiz/subject/${subj.code}/chapters`);
      const chList = res.data?.chapters || [];
      setAdminChapters(chList);
      if (chList.length > 0) {
        setNewQuestion(prev => ({ ...prev, subject_id: subj.id || prev.subject_id, chapter_id: chList[0].id }));
        fetchAdminQuestions(chList[0].id);
      } else {
        setAdminQuestions([]);
      }
    } catch (e) {
      setAdminChapters([]);
      setAdminQuestions([]);
    }
  };

  const fetchAdminQuestions = async (chapterId) => {
    if (!chapterId) return;
    setLoadingAdminQuestions(true);
    try {
      const res = await api.get('/quiz/admin/questions', { params: { chapter_id: chapterId } });
      setAdminQuestions(res.data || []);
    } catch (e) {
      setAdminQuestions([]);
    } finally {
      setLoadingAdminQuestions(false);
    }
  };

  const handleAdminSaveChapter = async (e) => {
    e.preventDefault();
    if (!newChapterData.unit_title_ku.trim() || !newChapterData.section_title_ku.trim()) {
      alert('تکایە ناونیشانی بەش و کەرت بنووسە');
      return;
    }
    try {
      await api.post('/quiz/admin/chapter', {
        subject_id: newQuestion.subject_id || subjects[0]?.id || 1,
        unit_title_ku: newChapterData.unit_title_ku.trim(),
        section_title_ku: newChapterData.section_title_ku.trim(),
        order: parseInt(newChapterData.order) || (adminChapters.length + 1)
      });
      alert('کەرتەکە بە سەرکەوتوویی دروستکرا!');
      setShowAddChapterModal(false);
      setNewChapterData({ unit_title_ku: '', section_title_ku: '', order: 1 });
      fetchAdminChapters(newQuestion.subject_id || subjects[0]?.id || 1);
    } catch (err) {
      alert(err.response?.data?.detail || 'هەڵە لە دروستکردنی کەرت');
    }
  };

  const handleAdminDeleteQuestion = async (qId) => {
    if (!window.confirm('ئایا دڵنیایت لە سڕینەوەی ئەم پرسیارە؟')) return;
    try {
      await api.delete(`/quiz/admin/question/${qId}`);
      alert('پرسیارەکە بە سەرکەوتوویی سڕدرایەوە');
      fetchAdminQuestions(newQuestion.chapter_id);
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.detail || 'هەڵە لە سڕینەوەی پرسیار');
    }
  };

  // Admin Methods to Manage Participating Students
  const fetchAdminStudents = async (query = adminStudentSearch) => {
    setLoadingAdminStudents(true);
    try {
      const res = await api.get('/quiz/admin/students', {
        params: { search: query || undefined }
      });
      setAdminStudents(res.data || []);
    } catch (e) {
      setAdminStudents([]);
    } finally {
      setLoadingAdminStudents(false);
    }
  };

  const handleUpdateStudent = async (studentId, updatedData) => {
    try {
      await api.put(`/quiz/admin/student/${studentId}`, updatedData);
      alert('زانیارییەکانی قوتابی بە سەرکەوتوویی لە سێرڤەر نوێکرانەوە');
      setEditingStudent(null);
      fetchAdminStudents();
      fetchLeaderboard();
    } catch (e) {
      alert(e.response?.data?.detail || 'هەڵە لە نوێکردنەوەی قوتابی');
    }
  };

  const handleDeleteStudent = async (studentId, name) => {
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی یەکجارەکیی «${name}» و گشت خاڵەکانی لە سێرڤەر؟`)) return;
    try {
      const res = await api.delete(`/quiz/admin/student/${studentId}`);
      alert(res.data?.message || 'بەشداربوو بە سەرکەوتوویی لە سێرڤەر سڕدرایەوە');
      fetchAdminStudents();
      fetchLeaderboard();
    } catch (e) {
      alert(e.response?.data?.detail || 'هەڵە لە سڕینەوەی قوتابی');
    }
  };

  // Check phone registration dynamically as student types
  const handlePhoneInputChange = async (val) => {
    setPhoneNumber(val);
    const clean = val.trim().replace(/\s+/g, '').replace(/-/g, '');
    if (clean.length >= 10) {
      try {
        const res = await api.get('/quiz/student/check-phone', {
          params: { phone_number: clean }
        });
        if (res.data?.registered) {
          setStudentName(res.data.student_name);
          setPhoneCheckStatus({ registered: true, student_name: res.data.student_name });
        } else {
          setPhoneCheckStatus({ registered: false, student_name: null });
        }
      } catch (e) {
        setPhoneCheckStatus(null);
      }
    } else {
      setPhoneCheckStatus(null);
    }
  };

  useEffect(() => {
    if (view === 'admin') {
      const targetSubjId = newQuestion.subject_id || subjects[0]?.id || 1;
      fetchAdminChapters(targetSubjId);
      fetchAdminStudents();
    }
  }, [view]);

  useEffect(() => {
    if (isOpen) {
      if (isAdmin) {
        setView('admin');
      }
      fetchSubjects();
      if (phoneNumber) {
        handleLoginStudent(phoneNumber, studentName, false);
      }
    }
  }, [isOpen, isAdmin]);

  // Login / Resume Student by Phone
  const handleLoginStudent = async (phoneToUse, nameToUse, navigate = true) => {
    const cleanPhone = (phoneToUse || phoneNumber).trim();
    if (!cleanPhone) return;

    try {
      localStorage.setItem('ksc_student_phone', cleanPhone);
      if (nameToUse) localStorage.setItem('ksc_student_name', nameToUse);

      const res = await api.post('/quiz/student/login', {
        phone_number: cleanPhone,
        student_name: nameToUse || studentName || 'قوتابی پۆلی ١٢',
        subject_code: selectedSubject?.code || 'physics'
      });

      setStudentProgress(res.data);
      setDialogue(`بەخێربێیتەوە ${res.data.student_name}! کۆی خاڵەکانت: ${res.data.total_score} خاڵ 🌟`);
      if (navigate) {
        setView('subjects');
      }
    } catch (err) {
      const mockProgress = {
        phone_number: cleanPhone,
        student_name: nameToUse || studentName || 'قوتابی پۆلی ١٢',
        total_score: 0,
        unlocked_chapter_ids: [1],
        completed_chapter_ids: [],
        badges: ['پێشەنگی پۆلی ١٢ 🎓'],
        saved_sessions: {}
      };
      setStudentProgress(mockProgress);
      if (navigate) setView('subjects');
    }
  };

  // Select Subject & Fetch Chapters
  const handleSelectSubject = async (subj) => {
    setSelectedSubject(subj);
    try {
      const res = await api.get(`/quiz/subject/${subj.code}/chapters`, {
        params: { phone_number: phoneNumber }
      });
      if (res.data && res.data.chapters) {
        setChapters(res.data.chapters);
      }
    } catch (e) {
      setChapters([
        { id: 1, unit_title_ku: 'بەشی ١: بارگە کارەباییەکان', section_title_ku: 'کەرتی ١: بارگە و گەیەنەرەکان', order: 1, question_count: 5, is_unlocked: true, is_completed: true, has_saved_session: false },
        { id: 2, unit_title_ku: 'بەشی ١: بارگە کارەباییەکان', section_title_ku: 'کەرتی ٢: یاسای کۆڵۆم و بوار', order: 2, question_count: 5, is_unlocked: true, is_completed: false, has_saved_session: false },
        { id: 3, unit_title_ku: 'بەشی ٢: وزەی کارەبایی و توانست', section_title_ku: 'کەرتی ١: جیاوازی پۆتانسێل', order: 3, question_count: 5, is_unlocked: false, is_completed: false, has_saved_session: false },
        { id: 4, unit_title_ku: 'بەشی ٢: وزەی کارەبایی و توانست', section_title_ku: 'کەرتی ٢: توانست و بەستنی کۆندێنسەر', order: 4, question_count: 5, is_unlocked: false, is_completed: false, has_saved_session: false }
      ]);
    }
    setView('chapters');
    setDialogue(`بابەتی ${subj.name_ku} هەڵبژێردرا. ئەو کەرتە هەڵبژێرە کە دەتەوێت قوفڵەکەی بکەیتەوە 🔓`);
  };

  // Select Chapter & Check for Saved In-Progress Session
  const handleStartChapter = async (ch, forceRestart = false) => {
    if (!ch.is_unlocked && !isAdmin) {
      playSound('wrong', soundEnabled);
      setDialogue('ئەم کەرتە هێشتا کڵۆمکراوە! دەبێت کەرتی پێشوو بە سەروو ٥٠٪ تەواو بکەیت تا بکرێتەوە 🔒');
      return;
    }

    setSelectedChapter(ch);
    setEvaluationResult(null);
    setSaveSuccessMsg(null);

    try {
      const res = await api.get(`/quiz/section/${ch.id}/questions`, {
        params: { phone_number: phoneNumber }
      });
      const qList = res.data?.questions || [];
      const saved = res.data?.saved_session;

      setQuestions(qList);

      // Check if student has an existing paused session
      if (saved && !forceRestart && saved.answers && Object.keys(saved.answers).length > 0) {
        setPendingSavedSession(saved);
        return;
      }

      // Fresh start
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeSpent(0);
      setTimer(45);
      setView('gameplay');
      setDialogue(`دەستمان پێکرد! پرسیارەکان دەقاودەق وەزارین. هەر وەڵامێکی دروست ١٠ خاڵ وەردەگریت 🎯`);
    } catch (e) {
      // Fallback questions
      const fbQ = [
        {
          id: 101,
          question_text: 'کام لەم تەنۆلکانە بارگەی کارەبایی نەرێنی هەڵدەگرێت لەناو گەردیلەدا؟',
          options: ['ئەلیکترۆن', 'پڕۆتۆن', 'نیوترۆن', 'فۆتۆن'],
          ministerial_year: 'وەزاری ٢٠٢٣ خولی یەکەم'
        },
        {
          id: 102,
          question_text: 'هێزی کارەبایی نێوان دوو بارگەی خاڵی بەپێی کام یاسای فیزیکی دیاری دەکرێت؟',
          options: ["یاسای کۆڵۆم (Coulomb's Law)", 'یاسای ئۆم', 'یاسای فارادای', 'یاسای لێنز'],
          ministerial_year: 'وەزاری ٢٠٢٤ خولی دووەم'
        },
        {
          id: 103,
          question_text: 'ئەگەر دووری نێوان دوو بارگە دوو هێندە زیاد بکرێت، هێزی کارەبایی نێوانیان چی بەسەر دێت؟',
          options: ['چوار یەکی لێ دێت (١/٤ دەبێتەوە)', 'دوو هێندە زیاد دەکات', 'ناگۆڕێت', 'نیوە دەبێتەوە'],
          ministerial_year: 'وەزاری ٢٠٢٢ خولی یەکەم'
        }
      ];
      setQuestions(fbQ);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setTimeSpent(0);
      setTimer(45);
      setView('gameplay');
    }
  };

  // Resume from saved in-progress session
  const handleApplyResumeSession = (saved) => {
    setCurrentQuestionIndex(saved.current_question_index || 0);
    setUserAnswers(saved.answers || {});
    setTimeSpent(saved.time_spent_seconds || 0);
    setTimer(45);
    setPendingSavedSession(null);
    setView('gameplay');
    playSound('unlock', soundEnabled);
    setDialogue(`بە سەرکەوتوویی گەڕایتەوە بۆ پرسیاری #${(saved.current_question_index || 0) + 1}! کات و وەڵامەکانت پارێزراون ✨`);
  };

  // Timer Tick
  useEffect(() => {
    if (view !== 'gameplay') return;

    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setTimer((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [view, currentQuestionIndex]);

  // Answer selection with instant +10 points feedback
  const handleSelectAnswer = async (optionLetter) => {
    const activeQ = questions[currentQuestionIndex];
    if (!activeQ) return;

    setUserAnswers((prev) => ({
      ...prev,
      [activeQ.id]: optionLetter
    }));

    playSound('unlock', soundEnabled);

    // Call instant answer endpoint to update points in real-time
    try {
      const res = await api.post('/quiz/answer-instant', {
        phone_number: phoneNumber,
        student_name: studentName,
        question_id: activeQ.id,
        chosen_option: optionLetter
      });

      if (res.data?.is_correct) {
        playSound('correct', soundEnabled);
        if (!res.data.already_awarded && res.data.points_added > 0) {
          // Trigger floating +10 animation!
          setFloatingPoints('+10');
          setTimeout(() => setFloatingPoints(null), 1200);
          setStudentProgress((prev) => prev ? { ...prev, total_score: res.data.total_score } : null);
        }
      }
    } catch (e) {
      // Local animation fallback
      setFloatingPoints('+10');
      setTimeout(() => setFloatingPoints(null), 1200);
      setStudentProgress((prev) => prev ? { ...prev, total_score: (prev.total_score || 0) + 10 } : null);
    }

    // Auto advance to next question
    if (currentQuestionIndex + 1 < questions.length) {
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setTimer(45);
      }, 350);
    }
  };

  // "دواتر تەواوی دەکەم" (Pause & Save Session Endpoint)
  const handleSaveAndExitLater = async () => {
    if (!selectedChapter) return;
    try {
      await api.post(`/quiz/section/${selectedChapter.id}/save-progress`, {
        phone_number: phoneNumber,
        student_name: studentName,
        current_question_index: currentQuestionIndex,
        answers: userAnswers,
        time_spent_seconds: timeSpent
      });

      playSound('unlock', soundEnabled);
      setSaveSuccessMsg(`پێشکەوتنەکەت لە پرسیاری #${currentQuestionIndex + 1} بە سەرکەوتوویی پاشەکەوت کرا!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setView('chapters');
      }, 1500);
    } catch (e) {
      // Local fallback
      setSaveSuccessMsg(`پێشکەوتنەکەت پاشەکەوت کرا!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setView('chapters');
      }, 1500);
    }
  };

  // Submit Section (Requires > 50% to unlock next section)
  const handleSubmitSection = async () => {
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const res = await api.post(`/quiz/section/${selectedChapter.id}/submit`, {
        phone_number: phoneNumber,
        student_name: studentName,
        answers: userAnswers,
        time_spent_seconds: timeSpent
      });

      setEvaluationResult(res.data);
      if (res.data.passed) {
        playSound('victory', soundEnabled);
        setDialogue(`ئافەرم بلیمەت! قوفڵی کەرتی داهاتوو کرایەوە چونکە نمرەکەت زیاتر بوو لە ٥٠٪ 🔓✨`);
      } else {
        playSound('wrong', soundEnabled);
        setDialogue(`نمرەکەت کەمتر بوو لە ٥٠٪! بۆ کردنەوەی کەرتی داهاتوو دەبێت زۆرینەی پرسیارەکان بە دروستی وەڵام بدەیتەوە. 💪`);
      }
      setView('result');
    } catch (e) {
      const correctCount = Object.keys(userAnswers).length;
      const totalQ = questions.length || 3;
      const pct = (correctCount / totalQ) * 100.0;
      const passed = pct > 50.0;

      const mockResult = {
        passed: passed,
        score_earned: correctCount * 10,
        total_score: (studentProgress?.total_score || 0) + (correctCount * 10),
        correct_count: correctCount,
        wrong_count: Math.max(0, totalQ - correctCount),
        total_questions: totalQ,
        percentage: Math.round(pct),
        required_percentage: 50.1,
        next_chapter_unlocked: passed,
        newly_unlocked_chapter_title: 'کەرتی داهاتوو',
        badges: ['قوفڵشکێن 🔓', 'بلیمەتی وەزاری 🌟'],
        feedback: questions.map((q) => {
          const userChoice = userAnswers[q.id] || 'A';
          const correctOpt = q.correct_option || 'A';
          const isCorrect = userChoice === correctOpt;
          const optA = q.option_a || q.options?.[0]?.text || 'هەڵبژاردنی A';
          const optB = q.option_b || q.options?.[1]?.text || 'هەڵبژاردنی B';
          const optC = q.option_c || q.options?.[2]?.text || 'هەڵبژاردنی C';
          const optD = q.option_d || q.options?.[3]?.text || 'هەڵبژاردنی D';
          const map = { A: optA, B: optB, C: optC, D: optD };

          return {
            question_id: q.id,
            question_text: q.question_text,
            user_choice: userChoice,
            user_choice_text: map[userChoice] || '',
            correct_option: correctOpt,
            correct_option_text: map[correctOpt] || '',
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            is_correct: isCorrect,
            points_given: isCorrect ? 10 : 0,
            already_collected_previously: false,
            ministerial_year: q.ministerial_year,
            explanation_ku: q.explanation_ku || 'وەڵامی دروست بەپێی کلیلەکانی وەزارەتی پەروەردەیە.',
            image_url: q.image_url
          };
        })
      };
      setEvaluationResult(mockResult);
      if (passed) playSound('victory', soundEnabled);
      else playSound('wrong', soundEnabled);
      setView('result');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Upload Question Diagram / Image (Auto-compressed to tiny WebP)
  const handleUploadQuestionImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingImage(true);
    try {
      const res = await api.post('/quiz/admin/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewQuestion((prev) => ({ ...prev, image_url: res.data.url }));
      setUploadedImageInfo({ url: res.data.url, size_kb: res.data.size_kb });
    } catch (err) {
      alert(err.response?.data?.detail || 'هەڵە لە بارکردنی وێنە');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Admin Create Question
  const handleAdminSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quiz/admin/question', newQuestion);
      alert('پرسیارەکە بە سەرکەوتوویی زیادکرا!');
      setNewQuestion({
        ...newQuestion,
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        explanation_ku: '',
        image_url: ''
      });
      setUploadedImageInfo(null);
      if (newQuestion.chapter_id) {
        fetchAdminQuestions(newQuestion.chapter_id);
      }
      fetchSubjects();
    } catch (err) {
      alert('هەڵە لە زیادکردنی پرسیار');
    }
  };

  // Admin Reset / Wipe All Test Data
  const handleResetQuizData = async (mode = 'all') => {
    const confirmMsg = mode === 'all'
      ? 'ئایا دڵنیایت لە سڕینەوەی هەموو داتاکانی تاقیکردنەوە (گشت پرسیارەکان، و خاڵ و ڕیزبەندیی قوتابییان)؟'
      : 'ئایا دڵنیایت لە سڕینەوە و ڕیسێتکردنی هەموو خاڵ و پێشکەوتنی قوتابییان؟';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.post('/quiz/admin/reset-data', { mode });
      alert(res.data?.message || 'سەرجەم داتاکان بە سەرکەوتوویی سڕدرانەوە');
      localStorage.removeItem('ksc_student_phone');
      localStorage.removeItem('ksc_student_name');
      setPhoneNumber('');
      setStudentName('');
      setStudentProgress(null);
      setUserAnswers({});
      setQuestions([]);
      fetchSubjects();
      fetchLeaderboard();
      setView('subjects');
    } catch (err) {
      alert(err.response?.data?.detail || 'هەڵە لە سڕینەوەی داتاکان');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      
      {/* Lightbox Image Zoom Modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[90vh] bg-slate-900 border border-amber-400/40 rounded-3xl p-3 shadow-2xl flex flex-col items-center"
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-3 left-3 p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5 text-rose-400 stroke-[2.5]" />
            </button>
            <img
              src={zoomedImage}
              alt="شێوەکاری پرسیار بە قەبارەی گەورە"
              className="max-h-[75vh] w-auto object-contain rounded-2xl"
            />
            <span className="text-xs text-slate-400 mt-2">
              کلیک لە داخستن یان دەرەوەی وێنەکە بکە بۆ داخستنی ئەم پەنجەرەیە
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Header - Fully Mobile-Responsive & Prominent Controls */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-amber-500/20 px-3 sm:px-6 py-2.5 sm:py-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Brand Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[10px] sm:rounded-[14px] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    بانکی پرسیاری وەزاریی پۆلی ١٢
                  </h3>
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    ١٠ خاڵ بۆ هەر پرسیارێک
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  منافەسەی پێشەنگان و شکاندنی قوفڵی کەرتەکان
                </p>
              </div>
            </div>

            {/* Actions: Leaderboard, Sound, and High-Contrast Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Leaderboard Button */}
              <button
                onClick={() => {
                  fetchLeaderboard();
                  setView(view === 'leaderboard' ? 'subjects' : 'leaderboard');
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                  view === 'leaderboard'
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25'
                    : 'bg-slate-800 text-amber-400 border-amber-400/30 hover:bg-slate-700'
                }`}
                title="ڕیزبەندی و منافەسە"
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">ڕیزبەندی</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setView(view === 'admin' ? 'subjects' : 'admin')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                    view === 'admin'
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-amber-400 border-amber-400/30 hover:bg-slate-700'
                  }`}
                  title="پنێڵی ئەدمین"
                >
                  <Settings className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">ئەدمین</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'بێدەنگکردن' : 'چالاککردنی دەنگ'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center justify-center shrink-0 cursor-pointer active:scale-95"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {/* Prominent High-Contrast Close Button */}
              <button
                onClick={onClose}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white transition-all border border-rose-500/40 flex items-center gap-1 text-xs font-black shrink-0 cursor-pointer active:scale-95 shadow-sm"
                title="داخستن و چوونەدەرەوە"
              >
                <X className="w-4 h-4 text-rose-400 stroke-[2.5] shrink-0" />
                <span className="text-[11px] font-bold">داخستن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Character Speech / Status Ribbon with Floating Points Animation */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-2.5">
            <img
              src="/game/heroine.jpg"
              alt="ژوان"
              className="w-8 h-8 rounded-lg object-cover border border-amber-400/50 shadow"
            />
            <p className="text-xs text-slate-200 font-medium line-clamp-1">{dialogue}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 relative">
            {/* Real-time floating +10 point animation */}
            {floatingPoints && (
              <span className="absolute -top-3 left-2 font-black text-xs text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/50 animate-bounce shadow-lg">
                {floatingPoints} ✨
              </span>
            )}

            {studentProgress && (
              <span className="text-[11px] font-bold text-amber-400 font-mono bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{studentProgress.total_score || 0} خاڵ</span>
              </span>
            )}

            {studentProgress && (
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                {studentProgress.student_name}
              </span>
            )}
          </div>
        </div>

        {/* Modal Prompt: Resume In-Progress Section */}
        {pendingSavedSession && (
          <div className="p-4 bg-amber-500/15 border-b border-amber-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn text-right">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-white">
                  ئاگاداری: تۆ پێشتر لە کاتی تاقیکردنەوەدا ڕاگرتنت کردووە!
                </h5>
                <p className="text-[11px] text-slate-300">
                  تا پرسیاری #{(pendingSavedSession.current_question_index || 0) + 1}ت وەڵام داوەتەوە بە {Object.keys(pendingSavedSession.answers || {}).length} وەڵام. دەتەوێت لە هەمان شوێن دەست پێبکەیتەوە؟
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleApplyResumeSession(pendingSavedSession)}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-yellow-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
              >
                بەردەوامبوون لە هەمان شوێن ⚡
              </button>
              <button
                onClick={() => {
                  setPendingSavedSession(null);
                  handleStartChapter(selectedChapter, true);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                دەستپێکردنەوە لە سەرەتا
              </button>
            </div>
          </div>
        )}

        {/* Main Body Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* VIEW 1: Phone Login / Resume Profile */}
          {view === 'auth' && (
            <div className="max-w-md mx-auto py-6 space-y-6 text-right">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 mx-auto shadow-lg shadow-amber-500/20 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-slate-950" />
                </div>
                <h4 className="text-xl font-black text-white">چوونەژوورەوەی بلیمەتانی پۆلی ١٢</h4>
                <p className="text-xs text-slate-400">
                  بە ژمارەی مۆبایلەکەت پێشکەوتن و کەرتی وەستاوەکەت پاشەکەوت دەبێت تا هەر کاتێک هاتیتەوە لە هەمان شوێن دەست پێبکەیتەوە بەبێ فەوتانی خاڵەکان.
                </p>
              </div>

              <div className="space-y-4 bg-slate-800/60 p-5 rounded-2xl border border-slate-700">
                {/* 1. Phone Number Input First */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      ژمارەی مۆبایل (ناسنامەی تایبەتی قوتابی):
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Iraqi Kurdistan (07xxxxxxxxx)</span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder="0750XXXXXXX"
                      className="w-full pr-4 pl-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Identity Lock Status Badge */}
                {phoneCheckStatus?.registered && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      ئەم ژمارەیە قوفڵکراوە بە ناوی <strong>«{phoneCheckStatus.student_name}»</strong>. کەسی تر ناتوانێت ناوی بگۆڕێت.
                    </span>
                  </div>
                )}
                {phoneCheckStatus && !phoneCheckStatus.registered && (
                  <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-300 flex items-center gap-2 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>ژمارەی نوێیە! تکایە ناوی سێیانیت بنووسە بۆ تۆمارکردن.</span>
                  </div>
                )}

                {/* 2. Student Name Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      ناوی سێیانی:
                    </label>
                    {phoneCheckStatus?.registered && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>پارێزراوە</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={studentName}
                      disabled={phoneCheckStatus?.registered}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={phoneCheckStatus?.registered ? phoneCheckStatus.student_name : "نموونە: هۆزان ئاراس کامەران..."}
                      className={`w-full pr-4 pl-10 py-2.5 rounded-xl border text-sm outline-none font-medium ${
                        phoneCheckStatus?.registered
                          ? 'bg-slate-800/80 border-emerald-500/30 text-emerald-300 cursor-not-allowed'
                          : 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white'
                      }`}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-300 space-y-1">
                  <span className="font-bold block">یاساکانی سیستەمی وەزاری:</span>
                  <p className="text-[11px] text-slate-300">
                    • ژمارە مۆبایل ناسنامەی تایبەتی تۆیە و خاڵەکانت لەسەر ئەم ژمارەیە پاشەکەوت دەبێت.<br/>
                    • هەر وەڵامێکی دروست = <strong>١٠ خاڵ</strong> راستەوخۆ بۆت هەژمار دەکرێت.<br/>
                    • بۆ کردنەوەی کەرتی داهاتوو دەبێت <strong>لە ٥٠٪ زیاتر</strong> نمرە بەدەستبهێنیت.<br/>
                    • دەتوانیت کلیک لە <strong>«دواتر تەواوی دەکەم»</strong> بکەیت تا دواتر لە هەمان پرسیار دەست پێبکەیتەوە.
                  </p>
                </div>

                <button
                  onClick={() => handleLoginStudent(phoneNumber, studentName, true)}
                  disabled={!phoneNumber.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>دەستپێکردن لە شوێنی وەستاو</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: Grade 12 Subject Selector */}
          {view === 'subjects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="text-right">
                  <h4 className="text-base font-black text-white">بابەتەکانی تاقیکردنەوەی وەزاری</h4>
                  <p className="text-xs text-slate-400">بابەتێک هەڵبژێرە بۆ بینینی بەش و کەرتەکان</p>
                </div>
                <button
                  onClick={() => setView('auth')}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{phoneNumber ? `ژمارە: ${phoneNumber} (گۆڕین)` : 'چوونەژوورەوە بە ژمارە'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {subjects.map((subj) => (
                  <button
                    key={subj.code}
                    onClick={() => handleSelectSubject(subj)}
                    className="p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700 hover:border-amber-400/60 shadow-lg text-right transition-all transform hover:-translate-y-1 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl p-2 rounded-xl bg-slate-800 border border-slate-700/80 group-hover:scale-110 transition-transform">
                        {subj.icon}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                        پۆلی ١٢
                      </span>
                    </div>

                    <h5 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                      {subj.name_ku}
                    </h5>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>📖 {subj.total_chapters || subj.chaptersCount || 6} کەرت</span>
                      <span>•</span>
                      <span>❓ {subj.total_questions || subj.questionsCount || 40} پرسیار</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: Chapter / Section Lock Map */}
          {view === 'chapters' && selectedSubject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => setView('subjects')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>گەڕانەوە بۆ بابەتەکان</span>
                </button>

                <div className="text-right">
                  <h4 className="text-base font-black text-white flex items-center gap-2 justify-end">
                    <span>{selectedSubject.name_ku}</span>
                    <span>{selectedSubject.icon}</span>
                  </h4>
                  <p className="text-xs text-slate-400">کردنەوەی کەرتی داهاتوو پێویستی بە سەروو ٥٠٪ نمرەیە</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {chapters.map((ch) => {
                  const isUnlocked = ch.is_unlocked || isAdmin;
                  const isCompleted = ch.is_completed;
                  const hasSaved = ch.has_saved_session;

                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleStartChapter(ch)}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 text-right cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400'
                          : isUnlocked
                          ? 'bg-slate-800/90 border-amber-400/50 hover:bg-slate-800 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isCompleted
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : isUnlocked
                              ? 'bg-amber-400 text-slate-950 border-amber-300 animate-pulse'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : isUnlocked ? (
                            <Unlock className="w-5 h-5" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-amber-400 font-bold block">
                            {ch.unit_title_ku}
                          </span>
                          <h6 className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
                            <span>{ch.section_title_ku}</span>
                            {hasSaved && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                                دەستپێکردنەوە لە پرسیاری وەستاو 💾
                              </span>
                            )}
                          </h6>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                          {ch.question_count || 5} پرسیاری وەزاری
                        </span>
                        <div
                          className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                            isCompleted
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isUnlocked
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isCompleted ? 'تەواوکراو ✓' : isUnlocked ? (hasSaved ? 'بەردەوامبوون ⚡' : 'دەستپێکردن 🔓') : 'کڵۆمکراو 🔒'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 4: Ministerial Question Gameplay */}
          {view === 'gameplay' && questions.length > 0 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              
              {/* Save Success Banner */}
              {saveSuccessMsg && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                  ✓ {saveSuccessMsg}
                </div>
              )}

              {/* In-Game Header Toolbar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                {/* Pause & Finish Later Button */}
                <button
                  onClick={handleSaveAndExitLater}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="پاشەکەوتکردن و تەواوکردنی دواتر"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>دواتر تەواوی دەکەم</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] text-amber-400 font-bold block">
                    {selectedChapter?.section_title_ku}
                  </span>
                  <span className="text-xs text-slate-300 font-bold font-mono">
                    پرسیاری {currentQuestionIndex + 1} لە {questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                    +١٠ خاڵ بۆ دروست
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timer} چ</span>
                  </div>
                </div>
              </div>

              {/* Active Question Box */}
              {questions[currentQuestionIndex] && (
                <div className="p-6 rounded-3xl bg-slate-800/90 border border-amber-500/20 shadow-2xl text-right space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {questions[currentQuestionIndex].ministerial_year || 'پرسیاری فەرمیی وەزاری'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Q#{currentQuestionIndex + 1}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-line">
                    {questions[currentQuestionIndex].question_text}
                  </h4>

                  {/* Question Diagram / Image Display (Ultra-lightweight WebP) */}
                  {questions[currentQuestionIndex].image_url && (
                    <div className="my-3 flex flex-col items-center justify-center">
                      <div 
                        onClick={() => setZoomedImage(questions[currentQuestionIndex].image_url)}
                        className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-amber-400/30 bg-slate-950 p-1.5 shadow-lg max-h-72 transition-all hover:border-amber-400"
                        title="کلیک بکە بۆ گەورەکردنی هێڵکاری"
                      >
                        <img
                          src={questions[currentQuestionIndex].image_url}
                          alt="هێڵکاری پرسیارەکە"
                          className="rounded-xl max-h-64 object-contain mx-auto"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300">
                          <ZoomIn className="w-4 h-4 text-amber-400" />
                          <span>گەورەکردنی هێڵکاری</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4 Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {questions[currentQuestionIndex].options.map((opt, optIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][optIdx];
                      const isSelected = userAnswers[questions[currentQuestionIndex].id] === letter;

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(letter)}
                          className={`p-3.5 rounded-2xl border text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between group cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/20 scale-[1.02]'
                              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          <span className="flex-1 font-semibold">{opt}</span>
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mr-2 ${
                              isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400 group-hover:bg-amber-400 group-hover:text-slate-950'
                            }`}
                          >
                            {letter}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation / Submit bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/60">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                    >
                      پێشوو
                    </button>

                    <div className="text-[11px] text-slate-400">
                      پێویستە <strong>سەروو ٥٠٪</strong> وەڵامی دروست بدەیتەوە
                    </div>

                    {currentQuestionIndex + 1 === questions.length ? (
                      <button
                        onClick={handleSubmitSection}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>ناردنی وەڵامەکان و شیکاری</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>دواتر</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: Evaluation & Unlocking Result */}
          {view === 'result' && evaluationResult && (
            <div className="max-w-xl mx-auto py-4 space-y-5 text-right">
              <div className="p-6 rounded-3xl bg-slate-800/90 border border-amber-500/30 shadow-2xl text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg border bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950">
                  {evaluationResult.passed ? <Trophy className="w-8 h-8 animate-bounce" /> : <RotateCcw className="w-8 h-8" />}
                </div>

                <h4 className="text-xl font-black text-white">
                  {evaluationResult.passed
                    ? 'پیرۆزە! قوفڵی کەرتی داهاتوو شکێندرا 🔓'
                    : 'بە داخەوە، دەبێت ڕێژەی دەرچوونت زیاتر بێت لە ٥٠٪!'}
                </h4>

                <p className="text-xs text-slate-300">
                  {evaluationResult.passed
                    ? `تۆ بە ڕێژەی ${evaluationResult.percentage}٪ دەرچوویت و کەرتی نوێت بە سەرکەوتوویی کردەوە.`
                    : `ڕێژەی نمرەکەت ${evaluationResult.percentage}٪ بوو، تکایە دووبارە هەوڵبدەرەوە تا کەرتی داهاتوو بکرێتەوە.`}
                </p>

                <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">وەڵامی ڕاست</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {evaluationResult.correct_count} لە {evaluationResult.total_questions}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">ڕێژەی سەدی</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      {evaluationResult.percentage}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">خاڵی زیادکراو</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      +{evaluationResult.score_earned}
                    </span>
                  </div>
                </div>

                {evaluationResult.next_chapter_unlocked && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-pulse">
                    ✨ کەرتی داهاتوو ({evaluationResult.newly_unlocked_chapter_title}) بە فەرمی کرایەوە و لە پێشکەوتنەکەتدا پاشەکەوت بوو!
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setView('chapters')}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                  >
                    بەردەوامبوون بەرەو کەرتی داهاتوو
                  </button>
                  <button
                    onClick={() => handleStartChapter(selectedChapter, true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
                  >
                    دووبارەکردنەوە
                  </button>
                </div>
              </div>

              {/* Detailed Ministerial Explanations & Answer Review */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400 font-mono">
                    کۆی پرسیارەکان: {evaluationResult.total_questions || evaluationResult.feedback?.length}
                  </span>
                  <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>پێداچوونەوەی وەڵامەکان (پرسیار، هەڵەکەت، و وەڵامی دروست)</span>
                  </h5>
                </div>

                {evaluationResult.feedback?.map((fb, idx) => {
                  const userChoiceLetter = (fb.user_choice || '').trim().toUpperCase();
                  const correctLetter = (fb.correct_option || '').trim().toUpperCase();
                  const userChoiceText = fb.user_choice_text || fb[`option_${userChoiceLetter.toLowerCase()}`] || '';
                  const correctChoiceText = fb.correct_option_text || fb[`option_${correctLetter.toLowerCase()}`] || '';

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border text-xs transition-all space-y-3 text-right ${
                        fb.is_correct
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-900/90 border-rose-500/40 shadow-lg shadow-rose-500/5'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold">
                            {fb.ministerial_year || 'وەزاری'}
                          </span>
                        </div>

                        {/* Result Badge */}
                        {fb.is_correct ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>وەڵامەکەت ڕاستە {fb.already_collected_previously ? '(خاڵی وەرگیراوە)' : '(+١٠ خاڵ)'}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>وەڵامەکەت هەڵەیە (٠ خاڵ)</span>
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="font-bold text-white text-sm leading-relaxed">{fb.question_text}</p>

                      {/* Diagram / Image */}
                      {fb.image_url && (
                        <div className="my-2">
                          <img
                            src={fb.image_url}
                            alt="هێڵکاری پرسیار"
                            onClick={() => setZoomedImage(fb.image_url)}
                            className="max-h-36 rounded-xl border border-slate-700 bg-slate-950 p-1 cursor-zoom-in hover:border-amber-400 transition-colors"
                          />
                        </div>
                      )}

                      {/* Highlighted Answer Comparison Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {/* 1. Student's Answer */}
                        <div className={`p-3 rounded-xl border ${
                          fb.is_correct
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400">وەڵامەکەی تۆ:</span>
                            {fb.is_correct ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3 h-3" /> ڕاستە
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                <X className="w-3 h-3" /> هەڵەیە
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 ${
                              fb.is_correct ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                            }`}>
                              بژاردەی {userChoiceLetter || 'هیچ'}
                            </span>
                            <span className="font-bold text-white text-xs leading-normal">
                              {userChoiceText || 'وەڵام دیارینەکراوە'}
                            </span>
                          </div>
                        </div>

                        {/* 2. Official Correct Answer */}
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-emerald-400">وەڵامی دروستی وەزاری:</span>
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> کلیل
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/30 text-emerald-300 shrink-0">
                              بژاردەی {correctLetter}
                            </span>
                            <span className="font-bold text-white text-xs leading-normal">
                              {correctChoiceText || 'وەڵامی پەسەندکراو'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Options Overview Grid */}
                      {(fb.option_a || fb.option_b) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
                          {['A', 'B', 'C', 'D'].map((letter) => {
                            const optText = fb[`option_${letter.toLowerCase()}`];
                            if (!optText) return null;
                            const isThisUserChoice = userChoiceLetter === letter;
                            const isThisCorrect = correctLetter === letter;

                            return (
                              <div
                                key={letter}
                                className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                                  isThisCorrect
                                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 font-bold'
                                    : isThisUserChoice && !fb.is_correct
                                    ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 font-bold'
                                    : 'bg-slate-950/70 text-slate-400 border-slate-800'
                                }`}
                              >
                                <span className="truncate">
                                  <strong>{letter}:</strong> {optText}
                                </span>
                                {isThisCorrect && (
                                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold shrink-0">
                                    ڕاست ✓
                                  </span>
                                )}
                                {isThisUserChoice && !fb.is_correct && (
                                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                                    تۆ ✗
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Ministerial Explanation */}
                      {fb.explanation_ku && (
                        <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                          💡 <strong>ڕوونکردنەوەی وەزاری:</strong> {fb.explanation_ku}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 6: Competitive Leaderboard & Personal Rank ("منافەسەی نێوان قوتابییان") */}
          {view === 'leaderboard' && (
            <div className="space-y-5 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => setView('subjects')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  گەڕانەوە بۆ بابەتەکان
                </button>
                <div className="text-right">
                  <h4 className="text-base font-black text-amber-400 flex items-center gap-1.5 justify-end">
                    <span>ڕیزبەندی و منافەسەی بلیمەتانی پۆلی ١٢</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </h4>
                  <p className="text-xs text-slate-400">ڕیزبەندی زیندووی قوتابییانی بەشداربووی هەموو کوردستان بەپێی کۆی خاڵەکان</p>
                </div>
              </div>

              {/* Personal Placement Card ("کارتی پێگەی تۆ") */}
              {leaderboardData.my_stats && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-indigo-950 to-slate-900 border-2 border-amber-400/50 shadow-2xl">
                  <div className="flex items-center justify-between mb-3 border-b border-amber-400/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-black text-white">کارتی پێگەی فەرمیی تۆ لە کوردستان</span>
                    </div>
                    <span className="text-xs font-bold text-amber-300">
                      {leaderboardData.my_stats.student_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">پلەی تۆ لە کوردستان</span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        #{leaderboardData.my_stats.rank}
                      </span>
                      <span className="text-[9px] text-slate-500 block">لە نێوان {leaderboardData.my_stats.total_participants} قوتابی</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">کۆی خاڵەکانت</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        {leaderboardData.my_stats.total_score}
                      </span>
                      <span className="text-[9px] text-emerald-500/80 block">خاڵی تاقیگە</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">ڕێژەی باشتری (Percentile)</span>
                      <span className="text-lg font-black text-purple-400 font-mono">
                        {leaderboardData.my_stats.percentile}%
                      </span>
                      <span className="text-[9px] text-purple-400/80 block">لە بەشداربووان باشتریت</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700">
                      <span className="text-[10px] text-slate-400 block">کەرتە تەواوکراوەکان</span>
                      <span className="text-lg font-black text-cyan-400 font-mono">
                        {leaderboardData.my_stats.completed_count || 0}
                      </span>
                      <span className="text-[9px] text-cyan-400/80 block">قوفڵی کراوە</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 30 Students Leaderboard Table */}
              <div className="rounded-3xl bg-slate-800/80 border border-slate-700 overflow-hidden shadow-xl">
                <div className="p-3.5 bg-slate-900/90 border-b border-slate-700 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>٣٠ پێشەنگەکەی تاقیکردنەوەی وەزاری</span>
                  <span>کۆی خاڵ</span>
                </div>

                {(!leaderboardData.top_students || leaderboardData.top_students.length === 0) ? (
                  <div className="p-8 text-center space-y-2">
                    <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                    <h5 className="text-sm font-bold text-slate-300">هێشتا هیچ بەشداربوویەک نییە</h5>
                    <p className="text-xs text-slate-500">
                      یەکەم کەس بە کە پرسیارەکان بە دروستی وەڵام بداتەوە و ناوت لە پێشەنگەکاندا بنووسرێت!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/60">
                    {leaderboardData.top_students.map((st) => {
                      const isTop1 = st.rank === 1;
                      const isTop2 = st.rank === 2;
                      const isTop3 = st.rank === 3;

                      return (
                        <div
                          key={st.rank}
                          className={`p-3.5 flex items-center justify-between text-xs transition-colors ${
                            isTop1
                              ? 'bg-amber-400/10'
                              : isTop2
                              ? 'bg-slate-400/10'
                              : isTop3
                              ? 'bg-amber-700/10'
                              : 'hover:bg-slate-750'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                                isTop1
                                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                                  : isTop2
                                  ? 'bg-slate-300 text-slate-950'
                                  : isTop3
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isTop1 ? <Crown className="w-4 h-4" /> : `#${st.rank}`}
                            </div>

                            <div>
                              <span className="font-bold text-white block">{st.student_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {st.phone_masked} • {st.completed_sections_count} کەرت
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {st.badges?.slice(0, 1).map((b, bIdx) => (
                              <span key={bIdx} className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-amber-300 border border-slate-700 font-bold">
                                {b}
                              </span>
                            ))}
                            <span className="font-black text-sm text-amber-400 font-mono">
                              {st.total_score} خاڵ
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 7: Admin Full Control Panel (Students, Scores & Ministerial Questions) */}
          {view === 'admin' && isAdmin && (
            <div className="space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => setView('subjects')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  گەڕانەوە بۆ یاری
                </button>
                <div className="text-right">
                  <h4 className="text-base font-black text-amber-400">پنێڵی کارگێڕی و کۆنترۆڵی ئەدمین</h4>
                  <p className="text-xs text-slate-400">بەڕێوەبردنی بەشداربووان، دەستکاری و سڕینەوەی خاڵەکان، و بانکی پرسیار</p>
                </div>
              </div>

              {/* Admin Tabs */}
              <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('students');
                    fetchAdminStudents();
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    adminTab === 'students'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>کۆنترۆڵی قوتابییان و ڕیزبەندی</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    adminTab === 'students' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {adminStudents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminTab('questions')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    adminTab === 'questions'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>بەڕێوەبردنی پرسیار و کەرتەکان</span>
                </button>
              </div>

              {/* TAB 1: STUDENTS & SCORES MANAGEMENT */}
              {adminTab === 'students' && (
                <div className="space-y-4">
                  {/* Search and Refresh Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={adminStudentSearch}
                        onChange={(e) => {
                          setAdminStudentSearch(e.target.value);
                          fetchAdminStudents(e.target.value);
                        }}
                        placeholder="گەڕان بەپێی ناوی قوتابی یان ژمارە مۆبایل..."
                        className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-xs outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchAdminStudents()}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>نوێکردنەوەی لیست</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetQuizData('progress')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="سڕینەوەی هەموو خاڵەکانی قوتابییان"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>ڕیسێتی گشت خاڵەکان</span>
                    </button>
                  </div>

                  {/* Quick Summary Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">کۆی بەشداربووان</span>
                      <span className="text-lg font-black text-white font-mono">{adminStudents.length}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">بەرزترین نمرە</span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {adminStudents.length > 0 ? Math.max(...adminStudents.map(s => s.total_score || 0)) : 0} خاڵ
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block font-bold">ئاسایشی ژمارەکان</span>
                      <span className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>ناسنامەی قوفڵکراو</span>
                      </span>
                    </div>
                  </div>

                  {/* Student Table / Cards */}
                  {loadingAdminStudents ? (
                    <div className="p-8 text-center text-xs text-amber-400 animate-pulse">
                      چاوەڕوانبە، لیستی بەشداربووان دەهێنرێت...
                    </div>
                  ) : adminStudents.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                      <p className="text-xs text-slate-300 font-bold">هیچ قوتابییەک نەدۆزرایەوە</p>
                      <p className="text-[11px] text-slate-500">کاتێک قوتابییان بەشداری دەکەن، لێرەدا بە تەواوی زانیارییەکانیان دیار دەبێت.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                      {adminStudents.map((st) => (
                        <div
                          key={st.id}
                          className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-400/40 transition-colors space-y-2.5"
                        >
                          {/* Student Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-black shrink-0">
                                <User className="w-4 h-4" />
                              </span>
                              <div>
                                <h5 className="font-bold text-white text-sm">{st.student_name}</h5>
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>ژمارە تایبەتکراوە بەم قوتابییە</span>
                                </span>
                              </div>
                            </div>

                            {/* Actions: Edit & Delete */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingStudent({ ...st })}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="دەستکاریکردنی ناو یان نمرە"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>دەستکاری</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStudent(st.id, st.student_name)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="سڕینەوەی ئەم قوتابییە و گشت خاڵەکانی لە سێرڤەر"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>سڕینەوە لە سێرڤەر</span>
                              </button>
                            </div>
                          </div>

                          {/* Student Info Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block mb-0.5">ژمارەی مۆبایل (تەواو بۆ ئەدمین)</span>
                              <span className="font-mono text-xs font-bold text-amber-300 block tracking-wider" dir="ltr">
                                📱 {st.phone_number}
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block mb-0.5">کۆی خاڵەکان</span>
                              <span className="font-mono text-sm font-black text-emerald-400 block">
                                {st.total_score} خاڵ
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block mb-0.5">بابەت / کەرتەکان</span>
                              <span className="font-bold text-white block truncate">
                                {st.subject_code} • {st.completed_sections_count} کەرت
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span className="text-[10px] text-slate-400 block mb-0.5">دواین بەشداری</span>
                              <span className="text-[10px] text-slate-300 block font-mono">
                                {st.last_active ? new Date(st.last_active).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'نادیار'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Edit Student Modal */}
                  {editingStudent && (
                    <div
                      onClick={() => setEditingStudent(null)}
                      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl text-right space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <button
                            type="button"
                            onClick={() => setEditingStudent(null)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <h5 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                            <Edit2 className="w-4 h-4" />
                            <span>دەستکاریکردنی زانیارییەکانی قوتابی لە سێرڤەر</span>
                          </h5>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateStudent(editingStudent.id, {
                              student_name: editingStudent.student_name,
                              total_score: parseInt(editingStudent.total_score) || 0,
                              phone_number: editingStudent.phone_number
                            });
                          }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">ناوی قوتابی:</label>
                            <input
                              type="text"
                              value={editingStudent.student_name}
                              onChange={(e) => setEditingStudent({ ...editingStudent, student_name: e.target.value })}
                              required
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">ژمارەی مۆبایل:</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={editingStudent.phone_number}
                              onChange={(e) => setEditingStudent({ ...editingStudent, phone_number: e.target.value })}
                              required
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono text-xs outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">کۆی خاڵەکان (Total Score):</label>
                            <input
                              type="number"
                              min="0"
                              value={editingStudent.total_score}
                              onChange={(e) => setEditingStudent({ ...editingStudent, total_score: e.target.value })}
                              required
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono text-xs outline-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                            >
                              پاشەکەوتکردن لە سێرڤەر
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudent(null)}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                            >
                              داخستن
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUESTIONS & SECTIONS MANAGEMENT */}
              {adminTab === 'questions' && (
                <div className="space-y-4">
                  {/* Danger Zone: Wipe / Reset All Test Data */}
                  <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>سڕینەوەی داتا تاقیکارییەکان (Wipe Test Data)</span>
                      </span>
                      <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                        تایبەت بە ئەدمین
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      بۆ ئەوەی سیستەمی یاری و تاقیکردنەوە بە تەواوی خاوێن بێت بۆ دەستپێکردنی فەرمی، دەتوانیت لێرەوە هەموو خاڵەکانی تاقیکاری و پرسیارە تاقیکارییەکان بسڕیتەوە تا هیچ داتایەکی کۆن نەمێنێت.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleResetQuizData('all')}
                        className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>سڕینەوەی گشت داتاکان (پرسیار و خاڵەکان)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetQuizData('progress')}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>تەنها سڕینەوەی خاڵ و ڕیزبەندیی قوتابییان</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin Form: Add Question */}
                  <form onSubmit={handleAdminSaveQuestion} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
                    <h5 className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                      <span>زیادکردنی پرسیاری نوێی وەزاری</span>
                      <Plus className="w-4 h-4 text-amber-400" />
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">بابەت:</label>
                        <select
                          value={newQuestion.subject_id}
                          onChange={(e) => {
                            const sId = parseInt(e.target.value);
                            setNewQuestion({ ...newQuestion, subject_id: sId });
                            fetchAdminChapters(sId);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        >
                          {subjects.map((s) => (
                            <option key={s.id || s.code} value={s.id || 1}>
                              {s.name_ku}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-300">بەش و کەرت:</label>
                          <button
                            type="button"
                            onClick={() => setShowAddChapterModal(true)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                            title="زیادکردنی بەش یان کەرتی نوێ بۆ ئەم بابەتە"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ کەرتی نوێ</span>
                          </button>
                        </div>
                        <select
                          value={newQuestion.chapter_id}
                          onChange={(e) => {
                            const chId = parseInt(e.target.value);
                            setNewQuestion({ ...newQuestion, chapter_id: chId });
                            fetchAdminQuestions(chId);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        >
                          {adminChapters.length === 0 ? (
                            <option value="">(هیچ کەرتێک نییە - کلیک لە + بکە)</option>
                          ) : (
                            adminChapters.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.unit_title_ku} • {c.section_title_ku} ({c.question_count} پرسیار)
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">ساڵی وەزاری:</label>
                        <input
                          type="text"
                          value={newQuestion.ministerial_year}
                          onChange={(e) => setNewQuestion({ ...newQuestion, ministerial_year: e.target.value })}
                          placeholder="نموونە: وەزاری ٢٠٢٤ خولی یەکەم"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">دەقی پرسیارەکە:</label>
                      <textarea
                        rows={2}
                        value={newQuestion.question_text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                        placeholder="دەقی پرسیاری وەزاری بنووسە..."
                        required
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                      />
                    </div>

                    {/* Image Upload for Diagrams (Ultra-compressed WebP) */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>وێنەی هێڵکاری / دیاگرام (ئارەزوومەندانە):</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                          ⚡ چڕکردنەوەی خۆکار بۆ WebP (کەمتر لە ٢٥ کیلۆبایت!)
                        </span>
                      </div>

                      {newQuestion.image_url ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 border border-amber-400/30">
                          <div className="flex items-center gap-3">
                            <img
                              src={newQuestion.image_url}
                              alt="پێشبینینی وێنە"
                              className="w-16 h-16 rounded-lg object-contain bg-slate-950 border border-slate-700 cursor-zoom-in"
                              onClick={() => setZoomedImage(newQuestion.image_url)}
                              title="کلیک بکە بۆ بینینی بە قەبارەی تەواو"
                            />
                            <div className="text-right">
                              <span className="text-xs font-bold text-white block">وێنەکە بە سەرکەوتوویی بارکرا</span>
                              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                                قەبارە: {uploadedImageInfo?.size_kb || 'کەمتر لە ٢٥'} KB (زۆر کەم و پارێزراو بۆ داتابەیس)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setNewQuestion({ ...newQuestion, image_url: '' });
                              setUploadedImageInfo(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-bold flex items-center gap-1 border border-rose-500/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>سڕینەوە</span>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-700 hover:border-amber-400/60 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-800/40 transition-colors">
                            <div className="flex items-center gap-2 text-slate-300 text-xs font-bold">
                              {isUploadingImage ? (
                                <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                                  <Sparkles className="w-4 h-4 animate-spin" />
                                  <span>چڕکردنەوە و پاشەکەوتکردنی وێنە...</span>
                                </div>
                              ) : (
                                <>
                                  <UploadCloud className="w-5 h-5 text-amber-400" />
                                  <span>هەڵبژاردنی وێنەی دیاگرام لە ئامێرەکەت</span>
                                </>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">
                              PNG, JPG, WEBP — بە شێوەیەکی خۆکار قەبارەکەی زۆر کەم دەکرێتەوە تا داتابەیس قورس نەکات
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingImage}
                              onChange={handleUploadQuestionImage}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">هەڵبژاردنی A:</label>
                        <input
                          type="text"
                          value={newQuestion.option_a}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">هەڵبژاردنی B:</label>
                        <input
                          type="text"
                          value={newQuestion.option_b}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">هەڵبژاردنی C:</label>
                        <input
                          type="text"
                          value={newQuestion.option_c}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">هەڵبژاردنی D:</label>
                        <input
                          type="text"
                          value={newQuestion.option_d}
                          onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-400 mb-1">وەڵامی دروست:</label>
                        <select
                          value={newQuestion.correct_option}
                          onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400/50 text-white font-bold text-xs outline-none"
                        >
                          <option value="A">بژاردەی A</option>
                          <option value="B">بژاردەی B</option>
                          <option value="C">بژاردەی C</option>
                          <option value="D">بژاردەی D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">ڕوونکردنەوەی وەزاری (Explanation):</label>
                        <input
                          type="text"
                          value={newQuestion.explanation_ku}
                          onChange={(e) => setNewQuestion({ ...newQuestion, explanation_ku: e.target.value })}
                          placeholder="هۆکاری دروستیی وەڵامەکە..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                    >
                      تۆمارکردنی پرسیاری وەزاری لە داتابەیس
                    </button>
                  </form>

                  {/* Add Chapter / Section Modal */}
                  {showAddChapterModal && (
                    <div 
                      onClick={() => setShowAddChapterModal(false)}
                      className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    >
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl p-5 shadow-2xl text-right space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <button
                            type="button"
                            onClick={() => setShowAddChapterModal(false)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <h5 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                            <Plus className="w-4 h-4" />
                            <span>دروستکردنی بەش یان کەرتی نوێ</span>
                          </h5>
                        </div>

                        <form onSubmit={handleAdminSaveChapter} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">ناونیشانی بەش (Unit):</label>
                            <input
                              type="text"
                              value={newChapterData.unit_title_ku}
                              onChange={(e) => setNewChapterData({ ...newChapterData, unit_title_ku: e.target.value })}
                              placeholder="نموونە: بەشی ٢: تەوژمی کارەبایی و موگناتیسی"
                              required
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">ناونیشانی کەرت (Section):</label>
                            <input
                              type="text"
                              value={newChapterData.section_title_ku}
                              onChange={(e) => setNewChapterData({ ...newChapterData, section_title_ku: e.target.value })}
                              placeholder="نموونە: کەرتی ١: هێزی موگناتیسی لەسەر تەزوو"
                              required
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">ڕیزبەندی کەرتەکە (Order):</label>
                            <input
                              type="number"
                              min="1"
                              value={newChapterData.order}
                              onChange={(e) => setNewChapterData({ ...newChapterData, order: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer"
                            >
                              تۆمارکردن لە داتابەیس
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddChapterModal(false)}
                              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                            >
                              پەشیمانبوونەوە
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Questions Already in This Chapter / Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs text-slate-400 font-mono">
                        کۆی پرسیارەکان: {adminQuestions.length}
                      </span>
                      <h5 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>پرسیارە تۆمارکراوەکانی ئەم کەرتە</span>
                      </h5>
                    </div>

                    {loadingAdminQuestions ? (
                      <div className="p-6 text-center text-xs text-amber-400 animate-pulse">
                        چاوەڕوانبە، پرسیارەکان دەهێنرێن...
                      </div>
                    ) : adminQuestions.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-1">
                        <p className="text-xs text-slate-300 font-bold">هیچ پرسیارێک لەم کەرتەدا تۆمار نەکراوە</p>
                        <p className="text-[11px] text-slate-500">فۆڕمەکەی سەرەوە پڕبکەرەوە بۆ زیادکردنی یەکەم پرسیار بۆ ئەم کەرتە.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {adminQuestions.map((q, qIdx) => (
                          <div
                            key={q.id}
                            className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 transition-colors space-y-2 text-right"
                          >
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => handleAdminDeleteQuestion(q.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="سڕینەوەی ئەم پرسیارە"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>سڕینەوە</span>
                              </button>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-mono">#{qIdx + 1}</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-bold">
                                  {q.ministerial_year || 'وەزاری'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-white leading-relaxed">{q.question_text}</p>

                            {q.image_url && (
                              <div className="my-1.5">
                                <img
                                  src={q.image_url}
                                  alt="هێڵکاری"
                                  onClick={() => setZoomedImage(q.image_url)}
                                  className="h-20 rounded-lg object-contain bg-slate-950 border border-slate-700 p-1 cursor-zoom-in"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-slate-800">
                              <span className={`p-1.5 rounded-lg border ${q.correct_option === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                A: {q.option_a}
                              </span>
                              <span className={`p-1.5 rounded-lg border ${q.correct_option === 'B' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                B: {q.option_b}
                              </span>
                              <span className={`p-1.5 rounded-lg border ${q.correct_option === 'C' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                C: {q.option_c}
                              </span>
                              <span className={`p-1.5 rounded-lg border ${q.correct_option === 'D' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                                D: {q.option_d}
                              </span>
                            </div>

                            {q.explanation_ku && (
                              <p className="text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/80">
                                💡 {q.explanation_ku}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Bar Info */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            سیستەمی وەزاریی پۆلی ١٢ • پاشەکەوتی خۆکار و تاقیکردنەوەی خاڵەکان
          </span>
          <span className="font-mono text-[10px] text-slate-500">KSC Ministerial Quest v4.0</span>
        </div>
      </div>
    </div>
  );
}
