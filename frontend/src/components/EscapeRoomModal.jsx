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
  Flame,
  Star
} from 'lucide-react';

// Built-in Synthesized Web Audio Sound Effects (Zero latency, no external mp3s needed)
function playSound(type, soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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
    // Ignore audio policies
  }
}

// 5 Stages with Curated Questions
const STAGES_DATA = [
  {
    stageId: 1,
    title: 'قوفڵی ١: بیرکاری و ئەندازە',
    subject: 'بیرکاری',
    icon: '📐',
    color: 'from-blue-600 to-indigo-600',
    questions: [
      {
        question: 'ئەگەر کۆی پێنج ژمارەی یەک لەدوای یەک یەکسان بێت بە ٥٠، گەورەترین ژمارە کامەیە؟',
        options: ['١٢', '١٠', '١٤', '١١'],
        correctIndex: 0,
        hint: 'ژمارەی ناوەڕاست بریتییە لە ٥٠ دابەشی ٥ کە دەبێتە ١٠...'
      },
      {
        question: 'ڕووبەری چوارگۆشەیەک کە چێوەکەی ٣٦ سم بێت چەند سانتیمەتری دووجایە؟',
        options: ['٨١', '٧٢', '٣٦', '٦٤'],
        correctIndex: 0,
        hint: 'درێژی لایەک دەبێتە ٣٦ دابەشی ٤ = ٩ سم، ڕووبەرەکەشی بریتییە لە ٩ × ٩'
      },
      {
        question: 'ئەگەر سێگۆشەیەکی گۆشەوەستاو دوو لایە ستوونەکەی ۳ سم و ٤ سم بن، ژێیەکەی چەندە؟',
        options: ['٥ سم', '٦ سم', '٧ سم', '٤.٥ سم'],
        correctIndex: 0,
        hint: 'بەپێی تیۆرمی فیساگۆرس: رەگی (٩ + ١٦)'
      }
    ]
  },
  {
    stageId: 2,
    title: 'قوفڵی ٢: زانست و گەردوون',
    subject: 'زانست',
    icon: '🔬',
    color: 'from-emerald-600 to-teal-600',
    questions: [
      {
        question: 'خێرایی ڕووناکی لە بۆشاییدا بە نزیکەیی چەند کیلۆمەترە لە چرکەیەکدا؟',
        options: ['٣٠٠,٠٠٠ کم/چ', '١٥٠,٠٠٠ کم/چ', '١,٠٠٠,٠٠٠ کم/چ', '٥٠,٠٠٠ کم/چ'],
        correctIndex: 0,
        hint: 'ڕووناکی لە یەک چرکەدا دەتوانێت ۷ جار بە دەوری زەویدا بسووڕێتەوە!'
      },
      {
        question: 'کام توخم لە خشتەی خولیدا بە هێمای (Fe) دەناسرێتەوە؟',
        options: ['ئاسن (Iron)', 'زێڕ (Gold)', 'زیو (Silver)', 'مس (Copper)'],
        correctIndex: 0,
        hint: 'ناوی لاتینیەکەی بریتییە لە Ferrum'
      },
      {
        question: 'خانەی سەرەکیی بەرپرسیار لە گواستنەوەی ئۆکسجین لە لەشی مرۆڤدا کامەیە؟',
        options: ['خڕۆکەی سووری خوێن', 'خڕۆکەی سپی', 'پەڕەکانی خوێن', 'پلازمای دەمار'],
        correctIndex: 0,
        hint: 'هیمۆگلۆبینی تێدایە و ڕەنگی سووری پێدەبەخشێت'
      }
    ]
  },
  {
    stageId: 3,
    title: 'قوفڵی ٣: زمانی کوردی و ئەدەب',
    subject: 'کوردی',
    icon: '📚',
    color: 'from-amber-600 to-orange-600',
    questions: [
      {
        question: 'شاخی هەڵگورد کە بەرزترین لوتکە شاخی باشووری کوردستانە، بەرزییەکەی چەند مەترە؟',
        options: ['٣,٦٠٧ مەتر', '٢,٨٥٠ مەتر', '٤,١٠٠ مەتر', '٣,٢٠٠ مەتر'],
        correctIndex: 0,
        hint: 'دەکەوێتە زنجیرە چیاکانی حەسارۆست لە دەڤەری باڵەکایەتی'
      },
      {
        question: 'شاعیری مەزنی کورد کە بە پێشەنگی شیعری کلاسیکی کوردی دادەنرێت و شاکاری "مەم و زین"ی نووسیوە کێیە؟',
        options: ['ئەحمەدی خانی', 'مەلای جزیری', 'نالی', 'مەحوی'],
        correctIndex: 0,
        hint: 'لە ساڵی ١٦٥١ لە شاری بایەزید لەدایکبووە'
      },
      {
        question: 'کام لەم وشانە "هاودژ" (دژواتا)ی وشەی "ئازا"یە؟',
        options: ['ترسنۆک', 'بێباک', 'وریا', 'چاوکراوە'],
        correctIndex: 0,
        hint: 'کەسێکە کە لە ڕووبەڕووبوونەوە بترسێت'
      }
    ]
  },
  {
    stageId: 4,
    title: 'قوفڵی ٤: زمانی ئینگلیزی (English)',
    subject: 'English',
    icon: '🌍',
    color: 'from-purple-600 to-pink-600',
    questions: [
      {
        question: "What is the past tense form of the irregular verb 'catch'?",
        options: ['Caught', 'Catched', 'Cought', 'Catching'],
        correctIndex: 0,
        hint: "Spelled with 'augh' like taught..."
      },
      {
        question: "Choose the correct synonym for the word 'Enormous':",
        options: ['Huge / Gigantic', 'Tiny / Micro', 'Weak / Fragile', 'Slow / Lazy'],
        correctIndex: 0,
        hint: 'Means extremely large in size or amount'
      },
      {
        question: "Which preposition completes: 'She has been studying ... morning.'?",
        options: ['since', 'for', 'from', 'until'],
        correctIndex: 0,
        hint: 'Used with a specific starting point in time'
      }
    ]
  },
  {
    stageId: 5,
    title: 'قوفڵی ٥: بلیمەتی و بیرکردنەوەی باڵا (IQ)',
    subject: 'IQ',
    icon: '🧠',
    color: 'from-rose-600 to-red-600',
    questions: [
      {
        question: 'کام ژمارە لە جێگەی نیشانەی پرسیار دادەنرێت لەم زنجیرەیەدا؟\n2, 6, 12, 20, 30, (?)',
        options: ['٤٢', '٤٠', '٣٦', '٤٨'],
        correctIndex: 0,
        hint: 'سەیری جیاوازی نێوان ژمارەکان بکە: +٤، +٦، +٨، +١٠، ...'
      },
      {
        question: 'ئەگەر ٥ ئامێر لە ٥ خولەکدا ٥ بەرهەم دروست بکەن، ١٠٠ ئامێر لە چەند خولەکدا ١٠٠ بەرهەم دروست دەکەن؟',
        options: ['٥ خولەک', '١٠٠ خولەک', '٢٠ خولەک', '٥٠ خولەک'],
        correctIndex: 0,
        hint: 'هەر یەک ئامێر ٥ خولەکی پێویستە بۆ دروستکردنی یەک بەرهەم!'
      },
      {
        question: 'ئەگەر ڕۆژی دوێنێ پێش دوو ڕۆژ دووشەممە بووبێت، سبەی سێ ڕۆژ دوای ئەو ڕۆژە چی دەبێت؟',
        options: ['دووشەممەی داهاتوو', 'یەکشەممە', 'شەممە', 'سێشەممە'],
        correctIndex: 0,
        hint: 'سەرەتا ڕۆژی ئەمڕۆ بدۆزەرەوە...'
      }
    ]
  }
];

export default function EscapeRoomModal({ isOpen, onClose }) {
  const [gameState, setGameState] = useState('intro'); // 'intro', 'playing', 'won', 'lost'
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [unlockedLocks, setUnlockedLocks] = useState([false, false, false, false, false]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: bool, text: string }
  const [timer, setTimer] = useState(30);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dialogue, setDialogue] = useState('');

  const timerRef = useRef(null);

  // Set initial dialogue
  useEffect(() => {
    if (gameState === 'intro') {
      setDialogue('سڵاو بلیمەتەکان! من «ژوان»م. دەروازەی خەزێنەی زانست بە ٥ قوفڵی زێڕین داخراوە. یارمەتیم بدە بە زانینەکەت قوفڵەکان بکەینەوە و پێش تەواوبوونی کات ڕزگارمان بێت!');
    }
  }, [gameState]);

  // Pick question for stage
  const startStage = (stageIdx) => {
    const stage = STAGES_DATA[stageIdx];
    const randomQ = stage.questions[Math.floor(Math.random() * stage.questions.length)];
    setActiveQuestion(randomQ);
    setSelectedOption(null);
    setFeedback(null);
    setTimer(35);
    setIsEvaluating(false);

    const stageDialogues = [
      'ئامادەبە بۆ قوفڵی ١! با بە بیرکاری و ئەندازە دەست پێبکەین 📐',
      'ئافەرم! قوفڵی ٢ بەردەممانە، کاتی زانست و گەردوونە 🔬',
      'زۆر باش دەڕۆین! ئێستا قوفڵی ٣: زمانی شیرینی کوردی و نیشتمان 📚',
      'قوفڵی ٤: با بزانین چەند لە ئینگلیزیدا لێهاتووی! 🌍',
      'گەیشتینە قوفڵی کۆتایی! ئەمە قورسترین پرسیاری بلیمەتییە (IQ) 🧠'
    ];
    setDialogue(stageDialogues[stageIdx]);
  };

  const handleStartGame = () => {
    setGameState('playing');
    setCurrentStageIndex(0);
    setUnlockedLocks([false, false, false, false, false]);
    setTimeSpent(0);
    setStreak(0);
    startStage(0);
  };

  // Timer Countdown
  useEffect(() => {
    if (gameState !== 'playing' || isEvaluating) return;

    timerRef.current = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 6 && soundEnabled) {
          // Soft ticking
          playSound('unlock', false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, isEvaluating, currentStageIndex]);

  const handleTimeOut = () => {
    setIsEvaluating(true);
    playSound('wrong', soundEnabled);
    setFeedback({
      isCorrect: false,
      text: 'کاتت تەواو بوو پێش ئەوەی قوفڵەکە بکەیتەوە!'
    });
    setDialogue('ئای کاتمان لێ ڕۆیشت! بەڵام مەشکێ، هەوڵبدەرەوە!');
  };

  const handleSelectOption = (idx) => {
    if (isEvaluating || selectedOption !== null) return;
    setSelectedOption(idx);
    setIsEvaluating(true);
    clearInterval(timerRef.current);

    const isCorrect = idx === activeQuestion.correctIndex;

    if (isCorrect) {
      playSound('correct', soundEnabled);
      setTimeout(() => playSound('unlock', soundEnabled), 200);

      const newLocks = [...unlockedLocks];
      newLocks[currentStageIndex] = true;
      setUnlockedLocks(newLocks);
      setStreak((s) => s + 1);

      setFeedback({
        isCorrect: true,
        text: 'وەڵامەکەت دروستە! کلیلەکە سووڕایەوە و قوفڵەکە کرایەوە 🔓✨'
      });

      const cheering = [
        'دەستخۆش! کلیلێکی زێڕینت بەدەستهێنا! ✨',
        'ئافەرم بلیمەت! قوفڵێکی تر شکێندرا! 🔓',
        'زۆر خێرایت! بەم شێوەیە دەتوانیت ڕزگارت بێت! ⚡',
        'تەنها یەک قوفڵ ماوە بۆ سەرکەوتنی گەورە! 🌟'
      ];
      setDialogue(cheering[Math.floor(Math.random() * cheering.length)]);

      // Check win condition
      setTimeout(() => {
        if (currentStageIndex + 1 < STAGES_DATA.length) {
          setCurrentStageIndex((prev) => prev + 1);
          startStage(currentStageIndex + 1);
        } else {
          // ALL 5 LOCKS UNLOCKED!
          setGameState('won');
          playSound('victory', soundEnabled);
          setDialogue('پیرۆزەەە! هەموو قوفڵەکان کرانەوە و دەرگای خەزێنەی زانست ڕووناک بووەوە! تۆ بلیمەتی ڕاستەقینەی کوردستانی! 🎓🎉');
        }
      }, 1600);
    } else {
      playSound('wrong', soundEnabled);
      setFeedback({
        isCorrect: false,
        text: `وەڵامەکە دروست نەبوو! وەڵامی ڕاست: (${activeQuestion.options[activeQuestion.correctIndex]})`
      });
      setStreak(0);
      setDialogue('ئۆو نەخێر، ئەم قوفڵە نەکڕایەوە! با دووبارە هەوڵبدەینەوە 💪');
    }
  };

  const handleRetryCurrent = () => {
    startStage(currentStageIndex);
  };

  if (!isOpen) return null;

  const currentStage = STAGES_DATA[currentStageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-amber-500/20 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  ژووری ڕزگاربوونی KSC
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  ٥ قوفڵی زێڕین
                </span>
              </div>
              <p className="text-[11px] text-slate-400">سەرکێشیی دەرچوون بە زانین لە تاقیگەی بلیمەتان</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'بێدەنگکردن' : 'چالاککردنی دەنگ'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Locks Progress Tracker Bar */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 py-3 shrink-0">
          <div className="flex items-center justify-between max-w-xl mx-auto gap-2">
            {STAGES_DATA.map((stage, idx) => {
              const isUnlocked = unlockedLocks[idx];
              const isCurrent = idx === currentStageIndex && gameState === 'playing';

              return (
                <div key={stage.stageId} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                        : isCurrent
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/40 animate-bounce'
                        : 'bg-slate-800/90 border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    {isUnlocked ? (
                      <Unlock className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                    ) : (
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-bold truncate max-w-[65px] sm:max-w-none text-center ${
                      isUnlocked ? 'text-emerald-400' : isCurrent ? 'text-amber-300' : 'text-slate-500'
                    }`}
                  >
                    {stage.subject}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Main Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {gameState === 'intro' && (
            <div className="flex flex-col md:flex-row items-center gap-6 py-4 max-w-3xl mx-auto">
              {/* Character Presentation */}
              <div className="relative shrink-0 w-44 sm:w-56 group">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 to-indigo-500/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all"></div>
                <img
                  src="/game/heroine.jpg"
                  alt="ژوان - پاڵەوانی KSC"
                  className="relative w-full h-auto object-cover rounded-3xl border-2 border-amber-400/40 shadow-2xl shadow-amber-500/20"
                />
                <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-amber-400 text-slate-950 rounded-full font-black text-xs shadow-lg flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                  <span>ژوان • ڕێبەر</span>
                </div>
              </div>

              {/* Story Intro & Player Input */}
              <div className="flex-1 space-y-4 text-center md:text-right">
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-500/20 relative shadow-inner">
                  <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-bold text-[10px]">
                    پەیامی ژوان 💬
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium mt-1">
                    «سڵاو بلیمەتی کورد! من ناوم <strong>ژوان</strong>ـە. دەروازەی خەزێنەی زانست داخراوە و کلیلەکان لەناو ٥ پرسیاری سەرنجڕاکێش شاردراونەتەوە. بۆ ئەوەی بگەینە تاقیگەکە و ڕزگارمان بێت، دەبێت هەر ٥ قوفڵەکە بکەینەوە!»
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="text-xs text-amber-400 font-bold block mb-1">⏱️ ٣٥ چرکە بۆ هەر قوفڵێک</span>
                    <span className="text-[11px] text-slate-400">کاتی سنوردار بۆ تاقیکردنەوەی خێرایی بیرکردنەوە</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
                    <span className="text-xs text-emerald-400 font-bold block mb-1">🏆 کارتی بلیمەتی فەرمی</span>
                    <span className="text-[11px] text-slate-400">لە کۆتاییدا کارتی ڕزگاربووی بلیمەت بەدەست دەهێنیت</span>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                    ناوی خۆت بنووسە (بۆ سەر کارتی سەرکەوتن):
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="نموونە: هۆگر کاروان، لانە پشتیوان..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-amber-400 text-white text-sm outline-none transition-all text-right font-medium"
                  />
                </div>

                <button
                  onClick={handleStartGame}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Key className="w-5 h-5" />
                  <span>دەستپێکردنی ڕزگاربوون و شکانەوەی قوفڵەکان</span>
                </button>
              </div>
            </div>
          )}

          {gameState === 'playing' && activeQuestion && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {/* Stage Info & Timer & Character Mini Bubble */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <img
                    src="/game/heroine.jpg"
                    alt="ژوان"
                    className="w-12 h-12 rounded-xl object-cover border border-amber-400/40 shrink-0 shadow-md"
                  />
                  <div className="text-right">
                    <span className="text-[10px] text-amber-400 font-bold block">
                      {currentStage.title}
                    </span>
                    <p className="text-xs text-slate-200 font-medium line-clamp-1">{dialogue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border ${
                      timer <= 7
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                        : 'bg-slate-900 text-amber-300 border-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{timer} چرکە</span>
                  </div>

                  {streak > 1 && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" />
                      <span>{streak} بەدوایەک</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Question Card */}
              <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900 border border-amber-500/20 shadow-xl text-right relative">
                <div className="absolute top-4 left-4 text-2xl opacity-40 select-none">
                  {currentStage.icon}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-bold">
                    پرسیاری قوفڵی {currentStageIndex + 1}
                  </span>
                  <span className="text-xs text-slate-400">بابەت: {currentStage.subject}</span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-6 whitespace-pre-line">
                  {activeQuestion.question}
                </h4>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === activeQuestion.correctIndex;
                    let btnStyle = 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200 hover:border-amber-400/50';

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20';
                      } else if (isSelected) {
                        btnStyle = 'bg-rose-500/20 border-rose-400 text-rose-300';
                      } else {
                        btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={selectedOption !== null}
                        className={`p-4 rounded-2xl border text-right font-medium text-sm transition-all flex items-center justify-between group ${btnStyle}`}
                      >
                        <span className="flex-1 font-semibold">{opt}</span>
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mr-2 transition-colors ${
                            selectedOption !== null && isCorrect
                              ? 'bg-emerald-500 text-slate-950'
                              : selectedOption === idx
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-700/80 text-slate-300 group-hover:bg-amber-400 group-hover:text-slate-950'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][idx]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback & Actions */}
                {feedback && (
                  <div
                    className={`mt-5 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fadeIn ${
                      feedback.isCorrect
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {feedback.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                      <span>{feedback.text}</span>
                    </div>

                    {!feedback.isCorrect && (
                      <button
                        onClick={handleRetryCurrent}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>دووبارە تاقیبکەرەوە</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Victory Escape Screen */}
          {gameState === 'won' && (
            <div className="py-6 max-w-xl mx-auto text-center space-y-6 animate-fadeIn">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 mx-auto relative shadow-2xl shadow-amber-500/40">
                  <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
                  </div>
                </div>
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black inline-flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  دەروازەی خەزێنەی زانست کرایەوە!
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  پیرۆزە! بە سەرکەوتوویی ڕزگارت بوو 🎓
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  تۆ توانیت بە زانین و ژیریی خۆت هەموو ٥ قوفڵە زێڕینەکە بکەیتەوە لە ماوەی{' '}
                  <span className="text-amber-300 font-bold font-mono">{timeSpent}</span> چرکەدا!
                </p>
              </div>

              {/* Official Digital Certificate Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 border-2 border-amber-400/40 shadow-2xl relative text-right">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="KSC" className="h-8 w-auto" />
                    <div>
                      <span className="text-xs font-black text-white block">کارتی فەرمیی ڕزگاربووی بلیمەت</span>
                      <span className="text-[10px] text-amber-400 font-mono">KSC ESCAPE ROOM MASTER</span>
                    </div>
                  </div>
                  <Award className="w-8 h-8 text-amber-400" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-400 text-xs">ناوی پاڵەوان:</span>
                    <span className="font-bold text-white">{playerName || 'بلیمەتی بێناو'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-400 text-xs">کات:</span>
                    <span className="font-bold font-mono text-amber-300">{timeSpent} چرکە</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                    <span className="text-slate-400 text-xs">قوفڵە کراوەکان:</span>
                    <span className="font-bold text-emerald-400">٥ لە ٥ (١٠٠٪)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 text-xs">پلەی بەدەستهاتوو:</span>
                    <span className="font-black text-amber-400">مامۆستای لێهاتوو • قەڵغانی زێڕین 🛡️</span>
                  </div>
                </div>
              </div>

              {/* Play Again & Share */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStartGame}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>دووبارە یاری بکەرەوە (پرسیاری نوێ)</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-colors"
                >
                  داخستن
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            سیستەمی ژووری ڕزگاربوونی زانستی KSC
          </span>
          <span className="font-mono text-[10px] text-slate-500">v2.0 • Interactive Game Engine</span>
        </div>
      </div>
    </div>
  );
}
