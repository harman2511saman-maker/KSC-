import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Building2,
  Users,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Flame,
  Globe,
  Share2,
  GraduationCap,
  Star,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Crown,
  CheckCircle,
  Copy,
  Printer,
  ShieldCheck,
  Zap,
  BookOpen,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Percent,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function Competitions({ onShowToast }) {
  const [leaderboard, setLeaderboard] = useState(null);
  const [exams, setExams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [scoreRange, setScoreRange] = useState('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rank_asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Student Search
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pagination for Students List
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 12;

  // Image preview modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/competitions/leaderboard', {
        params: {
          exam_id: selectedExamId || undefined,
          class_id: selectedSchoolId || undefined
        }
      });
      setLeaderboard(res.data);
      if (res.data.exams_list) {
        setExams(res.data.exams_list.map(e => ({ id: e.id, exam_name: e.name, subject: e.subject })));
      }
      if (res.data.classes_list) {
        setSchools(res.data.classes_list.map(c => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedExamId, selectedSchoolId]);

  const handleSearchStudent = async (codeToSearch) => {
    const targetCode = typeof codeToSearch === 'string' ? codeToSearch : searchCode;
    if (!targetCode || !targetCode.trim()) return;

    try {
      setSearchLoading(true);
      const res = await api.get('/competitions/public-search', {
        params: { student_code: targetCode.trim() }
      });
      setSearchResult(res.data);
      if (!res.data.found) {
        onShowToast({ type: 'warning', message: res.data.message_ku || 'قوتابی بەم کۆدە نەدۆزرایەوە' });
      } else {
        onShowToast({ type: 'success', message: `ئەنجام و ڕیزبەندی (${res.data.student_name}) دۆزرایەوە` });
        // Smooth scroll to result section
        const el = document.getElementById('student-result-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const copyStudentCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onShowToast({ type: 'success', message: 'کۆدی قوتابی کۆپیکرا' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetFilters = () => {
    setSelectedExamId('');
    setSelectedSchoolId('');
    setScoreRange('all');
    setStudentSearchTerm('');
    setSortBy('rank_asc');
    setCurrentPage(1);
    onShowToast({ type: 'info', message: 'گشت فلتەرەکان پاککرانەوە' });
  };

  const top3 = leaderboard?.schools_ranking?.slice(0, 3) || [];
  const schoolsRanking = leaderboard?.schools_ranking || [];

  // Filter and Sort Students Leaderboard
  const allStudents = leaderboard?.students_leaderboard || [];
  const filteredStudents = allStudents
    .filter((st) => {
      if (studentSearchTerm.trim()) {
        const term = studentSearchTerm.toLowerCase().trim();
        const matchName = st.student_name.toLowerCase().includes(term);
        const matchCode = st.student_code.toLowerCase().includes(term);
        const matchSchool = st.school_name.toLowerCase().includes(term);
        if (!matchName && !matchCode && !matchSchool) return false;
      }
      if (scoreRange === '90-100') return st.percentage >= 90;
      if (scoreRange === '80-89') return st.percentage >= 80 && st.percentage < 90;
      if (scoreRange === '65-79') return st.percentage >= 65 && st.percentage < 80;
      if (scoreRange === '50-64') return st.percentage >= 50 && st.percentage < 65;
      if (scoreRange === 'fail') return st.percentage < 50;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rank_asc') return a.rank - b.rank;
      if (sortBy === 'score_desc') return b.percentage - a.percentage;
      if (sortBy === 'score_asc') return a.percentage - b.percentage;
      if (sortBy === 'name_asc') return a.student_name.localeCompare(b.student_name, 'ku');
      return 0;
    });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-[1400px] mx-auto pb-20 px-2 sm:px-4 text-slate-100 font-kurdish">
      {/* 1. HERO SECTION (Dark Glowing Theme as requested) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080d1a] border border-slate-800/80 p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          {/* Hero Left Widgets (Search + Compact Stats) in RTL Left / Visual Start */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3.5 order-2 lg:order-1 w-full lg:w-auto shrink-0">
            {/* Student Code Lookup Box */}
            <div className="bg-[#0f172a]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-xl space-y-3 flex-1 sm:w-80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  STD CODE
                </span>
                <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>پشکنینی ڕیزبەندی قوتابی:</span>
                </label>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchStudent();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  placeholder="کۆدی قوتابی بنووسە..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs shrink-0 transition-transform active:scale-95 shadow-md flex items-center gap-1"
                >
                  <span>{searchLoading ? '...' : 'پشکنین'}</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>ڕیزبەندی کوردستان و پۆل</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  پشتڕاستکراو
                </span>
              </div>
            </div>

            {/* Compact Metric Summary Card */}
            {leaderboard && (
              <div className="bg-[#0f172a]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-700/60 shadow-xl flex-1 sm:w-56 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3 text-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">تێکڕای نمرە</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {leaderboard.overall_average ?? 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ڕێژەی سەرکەوتن</span>
                    <span className="text-2xl font-black text-brand-400 flex items-center justify-center gap-0.5">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      {leaderboard.overall_success_rate ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">قوتابخانەکان</span>
                    <span className="text-lg font-black text-amber-400">{leaderboard.schools_count ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">کۆی قوتابییان</span>
                    <span className="text-lg font-black text-white">{leaderboard.total_participants ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hero Right Header Text (in RTL Right side) */}
          <div className="space-y-4 order-1 lg:order-2 max-w-2xl text-right">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-amber-500/25 blur-md pointer-events-none animate-pulse" />
                <img
                  src="/logo.png"
                  alt="KSC Kurdistan Students Competition Official Emblem"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>پڕۆژەی پاڵپشتی قوتابیانی کوردستان (KSC)</span>
                </div>
                <span className="block text-[11px] text-slate-400 font-semibold">سەکۆی نیشتمانی بۆ ڕیزبەندی و ئەنجامی تاقیکردنەوەکان</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              ڕیزبەندی و پێشبڕکێی <span className="text-amber-400">قوتابیان و قوتابخانەکان</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              شیکاری و ڕیزبەندی ڕاستەوخۆ بەپێی نمرە، پلەی سەرکەوتن لەسەر ئاستی هەر قوتابخانەیەک و سەرجەم پارێزگاکانی کوردستان.
            </p>
          </div>
        </div>

        {/* Quick Demo Test Chips */}
        {leaderboard?.top_students?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 text-[11px] font-bold">تاقیکردنەوەی خێرای نموونە بۆ قوتابی:</span>
            {leaderboard.top_students.slice(0, 4).map((st) => (
              <button
                key={st.student_code}
                onClick={() => {
                  setSearchCode(st.student_code);
                  handleSearchStudent(st.student_code);
                }}
                className="px-3 py-1 bg-slate-800/80 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1.5"
              >
                <span>{st.student_code}</span>
                <span className="text-[10px] opacity-75">({st.student_name.split(' ')[0]})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. DUAL COLUMN SECTION (Schools Ranking Table + Olympic Podium Pedestal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Full Schools Ranking Dark Table */}
        <div className="lg:col-span-7 bg-[#080d1a] rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-brand-400" />
              <h3 className="text-base sm:text-lg font-black text-white">
                خشتەی تەواوی ڕیزبەندی قوتابخانەکان
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              {schoolsRanking.length} قوتابخانە
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="animate-spin w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full mx-auto mb-2" />
              لە بارکردندایە...
            </div>
          ) : schoolsRanking.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              هیچ داتایەکی قوتابخانە بەردەست نییە
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="py-3 px-3 text-center">ڕ</th>
                    <th className="py-3 px-3 text-center">میدالیا</th>
                    <th className="py-3 px-4">ناوی قوتابخانە</th>
                    <th className="py-3 px-3 text-center">قوتابییان</th>
                    <th className="py-3 px-3 text-center">بەشداربووان</th>
                    <th className="py-3 px-3 text-center">تێکڕای نمرە</th>
                    <th className="py-3 px-3 text-center">تێکڕای سەرکەوتن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {schoolsRanking.map((s) => (
                    <tr key={s.school_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-300">
                        {s.rank}
                      </td>
                      <td className="py-3 px-3 text-center text-base">
                        {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : '🎖️'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-100 block">{s.school_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">SCH-{s.school_id}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">
                        {s.students_participated}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-bold">
                        {s.passed_students}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-cyan-400 text-sm">
                        {s.average_percentage}%
                      </td>
                      <td className="py-3 px-3 text-center font-black text-emerald-400 text-sm">
                        {s.success_rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Olympic Podium Pedestals */}
        <div className="lg:col-span-5 bg-[#080d1a] rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>سکۆی شەرەف</span>
            </span>

            <h3 className="text-base sm:text-lg font-black text-white">
              سێ قوتابخانەی پێشەنگی کوردستان
            </h3>
          </div>

          {top3.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              پاش پشکنینی فۆڕمەکان، ٣ پێشەنگەکە لێرە دەردەکەون
            </div>
          ) : (
            <div className="flex items-end justify-center gap-2 sm:gap-3 pt-4">
              {/* 2nd Place (Silver - Left in Podium) */}
              {top3[1] ? (
                <div className="flex-1 bg-gradient-to-t from-slate-900 to-slate-800/80 border border-slate-600/60 rounded-2xl p-3 text-center space-y-2 shadow-lg flex flex-col justify-between h-56">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-slate-400">👑</span>
                    <div className="w-9 h-9 rounded-xl bg-slate-300 text-slate-950 font-black text-sm flex items-center justify-center shadow-md my-1">
                      2
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SCH-{top3[1].school_id}</span>
                    <h4 className="font-bold text-xs text-slate-100 truncate w-full mt-1">
                      {top3[1].school_name}
                    </h4>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1.5 space-y-0.5">
                    <div>{top3[1].students_participated} قوتابی • {top3[1].passed_students} دەرچوو</div>
                    <div className="font-black text-cyan-300 text-xs">تێکڕای {top3[1].average_percentage}%</div>
                    <div className="text-slate-300 font-bold">پلەی دووەم</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl h-48 flex items-center justify-center text-slate-600 text-xs">
                  2nd
                </div>
              )}

              {/* 1st Place (Gold - Center in Podium, Elevated) */}
              {top3[0] && (
                <div className="flex-1 bg-gradient-to-t from-amber-950/40 via-slate-900 to-amber-950/20 border-2 border-amber-400 rounded-2xl p-3.5 text-center space-y-2 shadow-2xl gold-glow flex flex-col justify-between h-64 -mt-4 relative">
                  <div className="flex flex-col items-center">
                    <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-amber-400/30 my-1">
                      1
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono">SCH-{top3[0].school_id}</span>
                    <h4 className="font-black text-sm text-white truncate w-full mt-1">
                      {top3[0].school_name}
                    </h4>
                  </div>

                  <div className="text-[10px] text-slate-300 border-t border-amber-400/30 pt-1.5 space-y-0.5">
                    <div>{top3[0].students_participated} قوتابی • {top3[0].passed_students} دەرچوو</div>
                    <div className="font-black text-amber-400 text-sm">تێکڕای {top3[0].average_percentage}% نمرە</div>
                    <div className="text-amber-300 font-black">پلەی یەکەم 🥇</div>
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze - Right in Podium) */}
              {top3[2] ? (
                <div className="flex-1 bg-gradient-to-t from-slate-900 to-amber-950/30 border border-amber-700/60 rounded-2xl p-3 text-center space-y-2 shadow-lg flex flex-col justify-between h-52">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-amber-600">👑</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-700 text-white font-black text-sm flex items-center justify-center shadow-md my-1">
                      3
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SCH-{top3[2].school_id}</span>
                    <h4 className="font-bold text-xs text-slate-100 truncate w-full mt-1">
                      {top3[2].school_name}
                    </h4>
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-1.5 space-y-0.5">
                    <div>{top3[2].students_participated} قوتابی • {top3[2].passed_students} دەرچوو</div>
                    <div className="font-black text-cyan-300 text-xs">تێکڕای {top3[2].average_percentage}%</div>
                    <div className="text-amber-500 font-bold">پلەی سێیەم</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl h-44 flex items-center justify-center text-slate-600 text-xs">
                  3rd
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. STUDENT DETAILED RESULT & RANK CARD (Appears upon search) */}
      {searchResult?.found && (
        <div
          id="student-result-card"
          className="bg-gradient-to-br from-[#0c1324] via-[#080d1a] to-[#0f172a] rounded-3xl p-6 sm:p-8 border-2 border-amber-400/80 shadow-2xl space-y-6 animate-fadeIn"
        >
          {/* Official Verification Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Emblem"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-900 bg-amber-400 px-3 py-0.5 rounded-lg">
                    کارتی فەرمی ئەنجامی پێشبڕکێ
                  </span>
                  <button
                    onClick={() => copyStudentCode(searchResult.student_code)}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCode ? 'کۆپیکرا!' : searchResult.student_code}</span>
                  </button>
                </div>

                <h3 className="font-black text-2xl sm:text-3xl text-white mt-1">
                  {searchResult.student_name}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                  <span>قوتابخانە: <strong className="text-amber-300">{searchResult.school_name}</strong></span>
                  <span>•</span>
                  <span>پۆل: <strong className="text-amber-300">{searchResult.grade || 'گشتی'}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>چاپکردنی بڕوانامە</span>
              </button>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>
          </div>

          {searchResult.results?.map((res, i) => (
            <div key={i} className="space-y-6">
              {/* 3 Prominent Rank Placement Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Kurdistan Rank */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-amber-950/20 border border-amber-400/60 shadow-lg text-center space-y-1">
                  <span className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>ڕیزبەندی لەسەر ئاستی کوردستان</span>
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    پلەی #{res.overall_rank}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    لە کۆی {res.total_participants} قوتابی کوردستان
                  </span>
                </div>

                {/* School Rank */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/20 via-slate-900 to-brand-950/20 border border-brand-400/60 shadow-lg text-center space-y-1">
                  <span className="text-xs font-black text-brand-300 flex items-center justify-center gap-1">
                    <Building2 className="w-4 h-4 text-brand-400" />
                    <span>ڕیزبەندی لە قوتابخانەکەتدا</span>
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white">
                    پلەی #{res.school_rank}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    لە کۆی {res.total_in_school} قوتابی لە قوتابخانەکەت
                  </span>
                </div>

                {/* Percentile Ranking */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-emerald-950/20 border border-emerald-400/60 shadow-lg text-center space-y-1">
                  <span className="text-xs font-black text-emerald-300 flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>ئاستی باڵا (Percentile)</span>
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                    {res.percentile}%
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    لە پێشەوەی سەرجەم بەشداربووانیت
                  </span>
                </div>
              </div>

              {/* Score & Answers Breakdown */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-base text-white">{res.exam_name}</h4>
                    <span className="text-xs text-slate-400">بابەت: {res.subject || 'گشتی'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">کۆی نمرە</span>
                      <span className="text-lg font-black text-white">{res.total_score} / {res.max_score}</span>
                    </div>
                    <div className={`px-5 py-2.5 rounded-xl font-black text-xl ${
                      res.percentage >= 50 ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}>
                      {res.percentage}%
                    </div>
                  </div>
                </div>

                {/* 4 Score Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="font-black text-lg block">{res.correct_count}</span>
                    <span>وەڵامی دروست</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    <span className="font-black text-lg block">{res.incorrect_count}</span>
                    <span>وەڵامی هەڵە</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                    <span className="font-black text-lg block">{res.blank_count}</span>
                    <span>بەتاڵ</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <span className="font-black text-lg block">{res.multiple_count || 0}</span>
                    <span>دوو وەڵام</span>
                  </div>
                </div>

                {/* Scanned OMR Sheet Preview if available */}
                {res.debug_file && (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-amber-400" />
                        پەڕەی وەڵامی سکانکراوی OMR:
                      </span>
                      <button
                        onClick={() => setPreviewImage(getUploadUrl(`/uploads/debug/${res.debug_file}`))}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>بینینی گەورەکراو</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div
                      onClick={() => setPreviewImage(getUploadUrl(`/uploads/debug/${res.debug_file}`))}
                      className="rounded-2xl border border-slate-700 bg-black/90 p-2 max-h-80 overflow-y-auto cursor-pointer flex items-center justify-center hover:border-amber-500/50 transition-colors"
                    >
                      <img
                        src={getUploadUrl(`/uploads/debug/${res.debug_file}`)}
                        alt="پەڕەی وەڵامی سکانکراوی قوتابی"
                        className="w-full max-h-76 object-contain rounded-xl opacity-95 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. STUDENTS OVERALL RANKING & DIRECTORY (With Advanced Filter Controls) */}
      <div className="bg-[#080d1a] rounded-3xl border border-slate-800/80 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              ڕیزبەندی گشتی قوتابیانی کوردستان
            </h3>
            <span className="text-xs text-slate-400 font-mono">({filteredStudents.length} قوتابی)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="گەڕان بەپێی ناوی قوتابی..."
                value={studentSearchTerm}
                onChange={(e) => {
                  setStudentSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pr-8 pl-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              title="فلتەر"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">تاقیکردنەوە:</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">هەموو تاقیکردنەوەکان</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.exam_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">قوتابخانە:</label>
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">هەموو قوتابخانەکان</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">ئاستی نمرە:</label>
              <select
                value={scoreRange}
                onChange={(e) => setScoreRange(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">هەموو نمرەکان</option>
                <option value="90-100">نایاب (٩٠٪ - ١٠٠٪)</option>
                <option value="80-89">زۆر باش (٨٠٪ - ٨٩٪)</option>
                <option value="65-79">باش (٦٥٪ - ٧٩٪)</option>
                <option value="50-64">پەسەند (٥٠٪ - ٦٤٪)</option>
                <option value="fail">دەرنەچوو (خوار ٥٠٪)</option>
              </select>
            </div>
          </div>
        )}

        {/* Student Leaderboard Cards Grid */}
        {paginatedStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            هیچ قوتابییەک بەم مەرجانە نەدۆزرایەوە
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedStudents.map((st) => (
              <div
                key={st.result_id}
                onClick={() => {
                  setSearchCode(st.student_code);
                  handleSearchStudent(st.student_code);
                }}
                className="group p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-400/80 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                      st.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : st.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : st.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {st.rank <= 3 ? (st.rank === 1 ? '🥇' : st.rank === 2 ? '🥈' : '🥉') : `#${st.rank}`}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {st.student_name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[150px]">
                        {st.school_name}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-black text-cyan-400 bg-slate-800 px-2.5 py-1 rounded-xl">
                    {st.percentage}%
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg">
                    {st.student_code}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {st.score} / {st.max_score} نمرە
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400">
              پەڕەی {currentPage} لە {totalPages}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30"
              >
                پێشتر
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-30"
              >
                دواتر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl p-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 px-2 text-white">
              <span className="text-xs font-bold">پەڕەی وەڵامی سکانکراو</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold"
              >
                داخستن
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center">
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
