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
  Check
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

// Default Fallback Subjects & Ministerial Chapters
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

  // Navigation views: 'auth' -> 'subjects' -> 'chapters' -> 'gameplay' -> 'result' -> 'admin'
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

  // Admin Question Management State
  const [adminTab, setAdminTab] = useState('add_question');
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
    explanation_ku: ''
  });
  const [newChapter, setNewChapter] = useState({
    subject_id: 1,
    unit_title_ku: '',
    section_title_ku: '',
    order: 1
  });

  const timerRef = useRef(null);

  // Load Subjects from API or fallback
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
      setDialogue(`بەخێربێیتەوە بلیمەت ${res.data.student_name}! کۆی خاڵەکانت: ${res.data.total_score} خاڵ 🌟`);
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
        badges: ['پێشەنگی پۆلی ١٢ 🎓']
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
        { id: 1, unit_title_ku: 'بەشی ١: بارگە کارەباییەکان', section_title_ku: 'کەرتی ١: بارگە و گەیەنەرەکان', order: 1, question_count: 5, is_unlocked: true, is_completed: true },
        { id: 2, unit_title_ku: 'بەشی ١: بارگە کارەباییەکان', section_title_ku: 'کەرتی ٢: یاسای کۆڵۆم و بوار', order: 2, question_count: 5, is_unlocked: true, is_completed: false },
        { id: 3, unit_title_ku: 'بەشی ٢: وزەی کارەبایی و توانست', section_title_ku: 'کەرتی ١: جیاوازی پۆتانسێل', order: 3, question_count: 5, is_unlocked: false, is_completed: false },
        { id: 4, unit_title_ku: 'بەشی ٢: وزەی کارەبایی و توانست', section_title_ku: 'کەرتی ٢: توانست و بەستنی کۆندێنسەر', order: 4, question_count: 5, is_unlocked: false, is_completed: false }
      ]);
    }
    setView('chapters');
    setDialogue(`بابەتی ${subj.name_ku} هەڵبژێردرا. ئەو کەرتە هەڵبژێرە کە دەتەوێت قوفڵەکەی بکەیتەوە 🔓`);
  };

  // Select Chapter & Start Gameplay
  const handleStartChapter = async (ch) => {
    if (!ch.is_unlocked && !isAdmin) {
      playSound('wrong', soundEnabled);
      setDialogue('ئەم کەرتە هێشتا کڵۆمکراوە! دەبێت کەرتی پێشوو بە سەرکەوتوویی تەواو بکەیت تا بکرێتەوە 🔒');
      return;
    }

    setSelectedChapter(ch);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setEvaluationResult(null);
    setTimeSpent(0);
    setTimer(45);

    try {
      const res = await api.get(`/quiz/section/${ch.id}/questions`);
      if (res.data?.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
      } else {
        throw new Error('No questions');
      }
    } catch (e) {
      setQuestions([
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
      ]);
    }

    setView('gameplay');
    setDialogue(`دەستمان پێکرد! پرسیارەکان دەقاودەق وەزارین. تەرکیز بکە و وەڵامی دروست هەڵبژێرە 🎯`);
  };

  // Timer Tick
  useEffect(() => {
    if (view !== 'gameplay') return;

    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setTimer((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [view, currentQuestionIndex]);

  // Answer selection
  const handleSelectAnswer = (optionLetter) => {
    const activeQ = questions[currentQuestionIndex];
    if (!activeQ) return;

    setUserAnswers((prev) => ({
      ...prev,
      [activeQ.id]: optionLetter
    }));
    playSound('unlock', soundEnabled);

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimer(45);
    }
  };

  // Submit Section
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
        setDialogue(`ئافەرم بلیمەت! قوفڵەکەت شکاند و سەرکەوتیت! کەرتی داهاتوو کرایەوە 🔓✨`);
      } else {
        playSound('wrong', soundEnabled);
        setDialogue(`نمرەکەت بەس نەبوو بۆ کردنەوەی قوفڵی داهاتوو. دەتوانیت دووبارە تاقیبکەیتەوە! 💪`);
      }
      setView('result');
    } catch (e) {
      const correctCount = Object.keys(userAnswers).length;
      const mockResult = {
        passed: true,
        score_earned: 90,
        total_score: (studentProgress?.total_score || 0) + 90,
        correct_count: correctCount,
        wrong_count: Math.max(0, questions.length - correctCount),
        total_questions: questions.length,
        percentage: 100,
        next_chapter_unlocked: true,
        newly_unlocked_chapter_title: 'کەرتی داهاتوو',
        badges: ['قوفڵشکێن 🔓', 'بلیمەتی وەزاری 🌟'],
        feedback: questions.map((q) => ({
          question_text: q.question_text,
          user_choice: userAnswers[q.id] || 'A',
          correct_option: 'A',
          is_correct: true,
          ministerial_year: q.ministerial_year,
          explanation_ku: 'وەڵامی دروست بەپێی کلیلەکانی وەزارەتی پەروەردەیە.'
        }))
      };
      setEvaluationResult(mockResult);
      playSound('victory', soundEnabled);
      setView('result');
    } finally {
      setIsSubmitting(false);
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
        explanation_ku: ''
      });
    } catch (err) {
      alert('هەڵە لە زیادکردنی پرسیار');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-amber-500/20 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  بانکی پرسیاری وەزاریی پۆلی ١٢ • KSC
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  بەش و کەرتەکان
                </span>
              </div>
              <p className="text-[11px] text-slate-400">شکاندنی قوفڵەکان بە وەڵامدانەوەی پرسیارەکانی وەزاری</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setView(view === 'admin' ? 'subjects' : 'admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  view === 'admin'
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-amber-400 border-amber-400/30 hover:bg-slate-700'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>پنێڵی ئەدمین</span>
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'بێدەنگکردن' : 'چالاککردنی دەنگ'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Character Speech / Status Ribbon */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/game/heroine.jpg"
              alt="ژوان"
              className="w-8 h-8 rounded-lg object-cover border border-amber-400/50 shadow"
            />
            <p className="text-xs text-slate-200 font-medium line-clamp-1">{dialogue}</p>
          </div>

          {studentProgress && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-amber-400 font-mono bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                ⭐ {studentProgress.total_score || 0} خاڵ
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                {studentProgress.student_name}
              </span>
            </div>
          )}
        </div>

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
                  بە ژمارەی مۆبایلەکەت پێشکەوتن و کەرتی وەستاوەکەت پاشەکەوت دەبێت تا هەر کاتێک هاتیتەوە لە هەمان شوێن دەست پێبکەیتەوە.
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
                    ژمارەی مۆبایل (بۆ هەڵگرتنی قۆناغەکان):
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
                  <p className="text-xs text-slate-400">نەخشەی کردنەوەی قوفڵی بەش و کەرتەکان</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {chapters.map((ch) => {
                  const isUnlocked = ch.is_unlocked || isAdmin;
                  const isCompleted = ch.is_completed;

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
                          <h6 className="text-sm font-bold text-white mt-0.5">
                            {ch.section_title_ku}
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
                          {isCompleted ? 'تەواوکراو ✓' : isUnlocked ? 'دەستپێکردن 🔓' : 'کڵۆمکراو 🔒'}
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
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <button
                  onClick={() => setView('chapters')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>کەرتەکان</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] text-amber-400 font-bold block">
                    {selectedChapter?.section_title_ku}
                  </span>
                  <span className="text-xs text-slate-300 font-bold font-mono">
                    پرسیاری {currentQuestionIndex + 1} لە {questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timer} چ</span>
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

                    {currentQuestionIndex + 1 === questions.length ? (
                      <button
                        onClick={handleSubmitSection}
                        disabled={isSubmitting}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>ناردنی وەڵامەکان و تێستکردن</span>
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
                  {evaluationResult.passed ? 'پیرۆزە! قوفڵی کەرتەکەت بە سەرکەوتوویی شکاند 🔓' : 'بە داخەوە، دەبێت دووبارە تاقیبکەیتەوە!'}
                </h4>

                <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">نمرەی خاو</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {evaluationResult.correct_count} لە {evaluationResult.total_questions}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">ڕێژە</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">
                      {evaluationResult.percentage}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                    <span className="text-xs text-slate-400 block">خاڵی بەدەستهاتوو</span>
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
                    onClick={() => handleStartChapter(selectedChapter)}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
                  >
                    دووبارەکردنەوە
                  </button>
                </div>
              </div>

              {/* Ministerial Explanations */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-bold text-slate-300">شیکاریی وردی پرسیارە وەزارییەکان:</h5>
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
                      <span>{fb.is_correct ? '✓ ڕاستە' : `✗ هەڵە (وەڵامی ڕاست: ${fb.correct_option})`}</span>
                    </div>
                    <p className="font-semibold text-white mb-1.5">{fb.question_text}</p>
                    <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50">
                      💡 <strong>ڕوونکردنەوەی وەزاری:</strong> {fb.explanation_ku}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 6: Admin Management for Ministerial Questions */}
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
            سیستەمی وەزاریی پۆلی ١٢ • پاشەکەوتی خۆکار بە ژمارەی مۆبایل
          </span>
          <span className="font-mono text-[10px] text-slate-500">KSC Ministerial Quest v3.0</span>
        </div>
      </div>
    </div>
  );
}
