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
  Image as ImageIcon
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
  { code: 'physics', name_ku: 'فیزیا (Physics)', icon: '⚛️', color: 'from-cyan-600 to-blue-600', chaptersCount: 6, questionsCount: 45 },
  { code: 'biology', name_ku: 'زیندەزانی (Biology)', icon: '🔬', color: 'from-emerald-600 to-teal-600', chaptersCount: 8, questionsCount: 60 },
  { code: 'chemistry', name_ku: 'کیمیا (Chemistry)', icon: '🧪', color: 'from-amber-600 to-orange-600', chaptersCount: 7, questionsCount: 50 },
  { code: 'math', name_ku: 'بیرکاری (Mathematics)', icon: '📐', color: 'from-indigo-600 to-purple-600', chaptersCount: 6, questionsCount: 40 },
  { code: 'kurdish', name_ku: 'زمانی کوردی (Kurdish)', icon: '📚', color: 'from-rose-600 to-pink-600', chaptersCount: 5, questionsCount: 35 },
  { code: 'english', name_ku: 'ئینگلیزی (Sunrise 12)', icon: '🌍', color: 'from-teal-600 to-emerald-600', chaptersCount: 6, questionsCount: 42 },
  { code: 'arabic', name_ku: 'عەرەبی (Arabic)', icon: '📖', color: 'from-amber-700 to-yellow-600', chaptersCount: 5, questionsCount: 30 }
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

  // Admin Question Management State
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
      // Fallback leaderboard
      setLeaderboardData({
        top_students: [
          { rank: 1, student_name: 'شەیما کاروان عەزیز', phone_masked: '0750***123', total_score: 340, completed_sections_count: 8, badges: ['پێشەنگی پۆلی ١٢ 🎓', 'مامۆستای بەشەکان 🏆'] },
          { rank: 2, student_name: 'دانا ئەحمەد حەسەن', phone_masked: '0770***456', total_score: 290, completed_sections_count: 7, badges: ['بلیمەتی وەزاری 🌟'] },
          { rank: 3, student_name: 'سارە پشتیوان مەحمود', phone_masked: '0751***789', total_score: 250, completed_sections_count: 6, badges: ['قوفڵشکێن 🔓'] }
        ],
        my_stats: {
          rank: 12,
          total_participants: 184,
          total_score: studentProgress?.total_score || 120,
          student_name: studentProgress?.student_name || 'قوتابی پۆلی ١٢',
          percentile: 93.5,
          completed_count: studentProgress?.completed_chapter_ids?.length || 2
        }
      });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubjects();
      if (phoneNumber) {
        handleLoginStudent(phoneNumber, studentName, false);
      }
    }
  }, [isOpen]);

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
        total_score: 120,
        unlocked_chapter_ids: [1, 2],
        completed_chapter_ids: [1],
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
        feedback: questions.map((q) => ({
          question_text: q.question_text,
          user_choice: userAnswers[q.id] || 'A',
          correct_option: 'A',
          is_correct: true,
          points_given: 10,
          already_collected_previously: false,
          ministerial_year: q.ministerial_year,
          explanation_ku: 'وەڵامی دروست بەپێی کلیلەکانی وەزارەتی پەروەردەیە.'
        }))
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
    } catch (err) {
      alert('هەڵە لە زیادکردنی پرسیار');
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
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ناوی سێیانی:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="نموونە: هۆزان ئاراس کامەران..."
                      className="w-full pr-4 pl-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ژمارەی مۆبایل (بۆ هەڵگرتنی قۆناغ و خاڵەکان):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      dir="ltr"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0750XXXXXXX"
                      className="w-full pr-4 pl-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-white text-sm font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-300 space-y-1">
                  <span className="font-bold block">یاساکانی یارییەکە:</span>
                  <p className="text-[11px] text-slate-300">
                    • هەر وەڵامێکی دروست = <strong>١٠ خاڵ</strong> راستەوخۆ بۆت هەژمار دەکرێت.<br/>
                    • بۆ کردنەوەی کەرتی داهاتوو دەبێت <strong>لە ٥٠٪ زیاتر</strong> نمرە بەدەستبهێنیت.<br/>
                    • لە کاتی تاقیکردنەوە دەتوانیت کلیک لە <strong>«دواتر تەواوی دەکەم»</strong> بکەیت و دواتر لە هەمان پرسیار دەست پێبکەیتەوە.
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
                  <span>گۆڕینی ژمارە ({phoneNumber.slice(-4)})</span>
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

              {/* Ministerial Explanations */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-300">شیکاریی فەرمیی پرسیارە وەزارییەکان:</h5>
                {evaluationResult.feedback?.map((fb, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                      fb.is_correct
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 font-bold">
                      <span>پرسیاری #{idx + 1} ({fb.ministerial_year})</span>
                      <span>
                        {fb.is_correct
                          ? `✓ ڕاستە ${fb.already_collected_previously ? '(خاڵی ئەم پرسیارە پێشتر وەرگیراوە)' : '(+١٠ خاڵ)'}`
                          : `✗ هەڵە (وەڵامی ڕاست: ${fb.correct_option})`}
                      </span>
                    </div>
                    <p className="font-semibold text-white mb-1.5">{fb.question_text}</p>
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
                    <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                      💡 <strong>ڕوونکردنەوەی وەزاری:</strong> {fb.explanation_ku}
                    </p>
                  </div>
                ))}
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

                <div className="divide-y divide-slate-700/60">
                  {leaderboardData.top_students?.map((st) => {
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
              </div>
            </div>
          )}

          {/* VIEW 7: Admin Management for Ministerial Questions */}
          {view === 'admin' && isAdmin && (
            <div className="space-y-4 text-right">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <button
                  onClick={() => setView('subjects')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  گەڕانەوە بۆ یاری
                </button>
                <div className="text-right">
                  <h4 className="text-base font-black text-amber-400">پنێڵی کارگێڕی پرسیارەکانی وەزاری</h4>
                  <p className="text-xs text-slate-400">زیادکردن و بەڕێوەبردنی بەش، کەرت، و پرسیارە هەڵبژاردنەکان</p>
                </div>
              </div>

              {/* Admin Form: Add Question */}
              <form onSubmit={handleAdminSaveQuestion} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-4">
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5 justify-end">
                  <span>زیادکردنی پرسیاری نوێی وەزاری</span>
                  <Plus className="w-4 h-4 text-amber-400" />
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">بابەت:</label>
                    <select
                      value={newQuestion.subject_id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, subject_id: parseInt(e.target.value) })}
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
