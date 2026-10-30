import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Users,
  Search,
  X,
  Printer,
  RotateCcw,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function OnlineExamLeaderboardModal({ exam, onClose }) {
  const { t, lang, isRTL, translateStudent } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PASSED, FAILED

  const examId = exam?.id || exam?.exam_id;

  useEffect(() => {
    if (!examId) return;
    let isMounted = true;
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/online-exam/exams/${examId}/public-leaderboard`);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load online exam leaderboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [examId]);

  // Filtered leaderboard
  const filteredList = useMemo(() => {
    if (!data?.leaderboard) return [];
    return data.leaderboard.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        item.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'PASSED' && item.status === 'PASSED') ||
        (filterStatus === 'FAILED' && item.status === 'FAILED');
      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl h-[92vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <header className="px-5 sm:px-7 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {lang === 'en'
                    ? 'Online Exam Arena'
                    : lang === 'ar'
                    ? 'حلبة الامتحانات الإلكترونية'
                    : 'ئارێنای تاقیکردنەوەی ئۆنلاین'}
                </span>
                <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
                  {exam?.title || data?.title}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                {lang === 'en'
                  ? `Tournament Results & Leaderboard`
                  : lang === 'ar'
                  ? `النتائج وترتيب المنافسة`
                  : `ئەنجام و ڕیزبەندیی تاقیکردنەوە`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title={lang === 'en' ? 'Print Leaderboard' : 'چاپکردنی ڕیزبەندی'}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">
                {lang === 'en' ? 'Print' : lang === 'ar' ? 'طباعة' : 'چاپکردن'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={lang === 'en' ? 'Close' : 'داخستن'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RotateCcw className="w-7 h-7 text-amber-400 animate-spin" />
              <span className="text-xs font-bold">
                {lang === 'en'
                  ? 'Loading Official Tournament Results...'
                  : lang === 'ar'
                  ? 'جاري تحميل النتائج الرسمية...'
                  : 'بارکردنی ئەنجامە فەرمییەکان...'}
              </span>
            </div>
          ) : !data || data.total_participants === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-center p-6 bg-slate-950/60 rounded-3xl border border-slate-800">
              <AlertCircle className="w-10 h-10 text-amber-400/80" />
              <h3 className="text-sm sm:text-base font-black text-white">
                {lang === 'en'
                  ? 'No Submissions Yet'
                  : lang === 'ar'
                  ? 'لا توجد مشاركات مسجلة حتى الآن'
                  : 'هێشتا هیچ ئەنجامێک بۆ ئەم تاقیکردنەوەیە تۆمار نەکراوە'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                {lang === 'en'
                  ? 'Participants who complete the exam with their passcode will automatically appear on this official leaderboard.'
                  : lang === 'ar'
                  ? 'المشاركون الذين يكملون الامتحان سيظهرون هنا تلقائياً في هذا الترتيب الرسمي.'
                  : 'بەشداربووان کاتێک بە پاسوۆرد تاقیکردنەوەکە تەواو دەکەن، راستەوخۆ لەم ڕیزبەندییە فەرمییە دەردەکەون.'}
              </p>
            </div>
          ) : (
            <>
              {/* Overview Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">
                      {lang === 'en' ? 'Participants' : lang === 'ar' ? 'المشاركون' : 'بەشداربووان'}
                    </span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2">
                    {data.total_participants}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">
                      {lang === 'en' ? 'Average Score' : lang === 'ar' ? 'متوسط الدرجات' : 'تێکڕای نمرە'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-2">
                    {data.average_score}%
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">
                      {lang === 'en' ? 'Highest Score' : lang === 'ar' ? 'أعلى درجة' : 'بەرزترین نمرە'}
                    </span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-2">
                    {data.highest_score}%
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold">
                      {lang === 'en' ? 'Pass Rate' : lang === 'ar' ? 'نسبة النجاح' : 'ڕێژەی دەرچوون'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="text-2xl font-black text-brand-400 mt-2">
                    {data.pass_rate}%
                  </div>
                </div>
              </div>

              {/* Olympic Podium: Top 3 Contestants */}
              {data.podium && data.podium.length > 0 && (
                <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-slate-950/80 to-slate-950/90 border border-amber-500/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm sm:text-base font-black text-amber-300">
                        {lang === 'en'
                          ? 'Podium of Champions'
                          : lang === 'ar'
                          ? 'منصة الأوائل والمتميزين'
                          : 'پلیکانی پاڵەوانانی یەکەم، دووەم و سێیەم'}
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-400/80 font-bold">
                      {lang === 'en' ? 'Top Ranked Contestants' : 'شایستەترین بەشداربووان'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                    {/* Rank 2 (Silver) */}
                    {data.podium[1] ? (
                      <div className="order-2 md:order-1 p-4 rounded-2xl bg-slate-900/90 border border-slate-400/30 flex flex-col items-center text-center space-y-2 shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-slate-400/20 border-2 border-slate-300 text-slate-200 flex items-center justify-center font-black text-base shadow-md">
                          🥈
                        </div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">
                          {lang === 'en' ? '2nd Place' : lang === 'ar' ? 'المركز الثاني' : 'پلەی دووەم'}
                        </span>
                        <div className="text-sm font-black text-white truncate max-w-full">
                          {translateStudent(data.podium[1].student_name)}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          {data.podium[1].code}
                        </span>
                        <div className="text-lg font-black text-emerald-400 pt-1">
                          {data.podium[1].percentage}%
                        </div>
                      </div>
                    ) : (
                      <div className="order-2 md:order-1" />
                    )}

                    {/* Rank 1 (Gold) */}
                    {data.podium[0] && (
                      <div className="order-1 md:order-2 p-5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-slate-900/90 border-2 border-amber-400 shadow-xl shadow-amber-500/20 flex flex-col items-center text-center space-y-2.5 relative -top-1 md:-top-2">
                        <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/40">
                          🥇
                        </div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          {lang === 'en' ? '1st Place Champion' : lang === 'ar' ? 'المركز الأول - البطل' : 'پاڵەوانی پلەی یەکەم'}
                        </span>
                        <div className="text-base font-black text-amber-300 truncate max-w-full">
                          {translateStudent(data.podium[0].student_name)}
                        </div>
                        <span className="text-[11px] font-mono font-bold text-amber-300/80 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-amber-400/40">
                          {data.podium[0].code}
                        </span>
                        <div className="text-2xl font-black text-amber-400 pt-1">
                          {data.podium[0].percentage}%
                        </div>
                      </div>
                    )}

                    {/* Rank 3 (Bronze) */}
                    {data.podium[2] ? (
                      <div className="order-3 p-4 rounded-2xl bg-slate-900/90 border border-amber-700/40 flex flex-col items-center text-center space-y-2 shadow-lg">
                        <div className="w-10 h-10 rounded-full bg-amber-700/20 border-2 border-amber-600 text-amber-300 flex items-center justify-center font-black text-base shadow-md">
                          🥉
                        </div>
                        <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider">
                          {lang === 'en' ? '3rd Place' : lang === 'ar' ? 'المركز الثالث' : 'پلەی سێیەم'}
                        </span>
                        <div className="text-sm font-black text-white truncate max-w-full">
                          {translateStudent(data.podium[2].student_name)}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                          {data.podium[2].code}
                        </span>
                        <div className="text-lg font-black text-emerald-400 pt-1">
                          {data.podium[2].percentage}%
                        </div>
                      </div>
                    ) : (
                      <div className="order-3" />
                    )}
                  </div>
                </div>
              )}

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTL ? 'right-3' : 'left-3'}`} />
                  <input
                    type="text"
                    placeholder={
                      lang === 'en'
                        ? 'Search participant by name or code...'
                        : lang === 'ar'
                        ? 'البحث بالاسم أو الرمز...'
                        : 'گەڕان بەپێی ناوی بەشداربوو یان کۆد...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    style={{ paddingRight: isRTL ? '2.5rem' : '0.75rem', paddingLeft: isRTL ? '0.75rem' : '2.5rem' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs ${isRTL ? 'left-3' : 'right-3'}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      filterStatus === 'ALL'
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'All' : lang === 'ar' ? 'الكل' : 'هەموو'} ({data.leaderboard.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('PASSED')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      filterStatus === 'PASSED'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    {lang === 'en' ? 'Passed' : lang === 'ar' ? 'ناجح' : 'سەرکەوتوو'} ({data.passed_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('FAILED')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      filterStatus === 'FAILED'
                        ? 'bg-rose-500 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-rose-400'
                    }`}
                  >
                    {lang === 'en' ? 'Failed' : lang === 'ar' ? 'راسب' : 'دەرنەچوو'} ({data.total_participants - data.passed_count})
                  </button>
                </div>
              </div>

              {/* Full Ranked Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right" dir={isRTL ? 'rtl' : 'ltr'}>
                    <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 text-center w-14">#</th>
                        <th className="py-3 px-4 text-start">
                          {lang === 'en' ? 'Contestant Name' : lang === 'ar' ? 'اسم المشارك' : 'ناوی بەشداربوو'}
                        </th>
                        <th className="py-3 px-4 text-center">
                          {lang === 'en' ? 'Passcode' : lang === 'ar' ? 'رمز الدخول' : 'کۆدی پاسوۆرد'}
                        </th>
                        <th className="py-3 px-4 text-center">
                          {lang === 'en' ? 'Percentage' : lang === 'ar' ? 'النسبة' : 'نمرە / ڕێژە'}
                        </th>
                        <th className="py-3 px-4 text-center">
                          {lang === 'en' ? 'Status' : lang === 'ar' ? 'الحالة' : 'ئەنجام'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredList.map((st) => {
                        const isTop3 = st.rank <= 3;
                        return (
                          <tr
                            key={st.code}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              st.rank === 1
                                ? 'bg-amber-500/10'
                                : st.rank === 2
                                ? 'bg-slate-300/5'
                                : st.rank === 3
                                ? 'bg-amber-700/10'
                                : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              {st.rank === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                                  1
                                </span>
                              ) : st.rank === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                                  2
                                </span>
                              ) : st.rank === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs shadow-md">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">#{st.rank}</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-start font-black text-white">
                              <div className="flex items-center gap-2">
                                <span>{translateStudent(st.student_name)}</span>
                                {isTop3 && (
                                  <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span className="font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-bold">
                                {st.code}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`font-black text-xs ${
                                    st.percentage >= 85
                                      ? 'text-amber-400'
                                      : st.percentage >= 50
                                      ? 'text-emerald-400'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {st.percentage}%
                                </span>
                                <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      st.percentage >= 85
                                        ? 'bg-amber-400'
                                        : st.percentage >= 50
                                        ? 'bg-emerald-400'
                                        : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(100, Math.max(0, st.percentage))}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              {st.status === 'PASSED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    {lang === 'en' ? 'Passed' : lang === 'ar' ? 'ناجح' : 'سەرکەوتوو'}
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  <span>
                                    {lang === 'en' ? 'Failed' : lang === 'ar' ? 'راسب' : 'دەرنەچوو'}
                                  </span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredList.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold">
                    {lang === 'en'
                      ? 'No contestants match your search filter.'
                      : lang === 'ar'
                      ? 'لا يوجد مشاركون مطابقون لفلتر البحث.'
                      : 'هیچ بەشداربوویەک بەپێی ئەم فلتەرە نەدۆزرایەوە.'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-[11px]">
              {lang === 'en'
                ? 'Official Verified Online Exam Results'
                : lang === 'ar'
                ? 'النتائج الرسمية المعتمدة للامتحان الإلكتروني'
                : 'ئەنجامی فەرمی و پەسەندکراوی تاقیکردنەوەی ئۆنلاین'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'Close' : lang === 'ar' ? 'إغلاق' : 'داخستن'}
          </button>
        </footer>
      </div>
    </div>
  );
}

