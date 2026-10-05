import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  ScanLine,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Camera,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import api from '../api';

export default function Dashboard({ setActiveTab, onSelectExamForScan, onOpenReview }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/results/dashboard-stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpis = [
    {
      title: 'ژمارەی قوتابیان',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      title: 'ژمارەی تاقیکردنەوەکان',
      value: stats?.total_exams || 0,
      icon: FileText,
      color: 'from-sky-600 to-cyan-600',
      bgLight: 'bg-sky-50 text-sky-700 border-sky-100',
    },
    {
      title: 'پەڕە خوێندراوەکانی ئەمڕۆ',
      value: stats?.sheets_today || 0,
      icon: ScanLine,
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      title: 'چاوەڕوانی پێداچوونەوە',
      value: stats?.pending_review || 0,
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-100',
      highlight: (stats?.pending_review || 0) > 0,
    },
    {
      title: 'تێکڕای نمرە',
      value: `${stats?.avg_score || 0}%`,
      icon: Award,
      color: 'from-purple-600 to-pink-600',
      bgLight: 'bg-purple-50 text-purple-700 border-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Scan Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>پلاتفۆرمی خوێندنەوەی پەڕەی وەڵامی تاقیکردنەوە بە زمانی کوردی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              بەخێربێیت بۆ سیستەمی فەرمی OMR
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              خوێندنەوەی پەڕەی وەڵام بە کامێرای مۆبایل و فایلەکانی PDF بە وردبینی بەرز لەگەڵ ڕاستکردنەوەی گۆشە و پەستاندنەوەی وێنەکان.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('scanner')}
              className="flex items-center gap-2.5 bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/30 transition-all transform active:scale-95"
            >
              <Camera className="w-5 h-5" />
              <span>سکانکردنی پەڕەی نوێ</span>
            </button>
            <button
              onClick={() => setActiveTab('sheets')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-2xl font-semibold text-sm backdrop-blur-md border border-white/10 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>چاپکردنی پەڕەی وەڵام</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid / Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                kpi.highlight ? 'ring-2 ring-amber-500/30 bg-amber-50/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{kpi.title}</span>
                <div className={`p-2 rounded-xl border ${kpi.bgLight}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {loading ? '...' : kpi.value}
                </span>
                {kpi.highlight && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                  >
                    <span>پێداچوونەوە</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Dashboard Split: Recent Exams & Scanning Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exams (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">تاقیکردنەوەکانی ئەم دواییە</h3>
            </div>
            <button
              onClick={() => setActiveTab('exams')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>هەموو تاقیکردنەوەکان</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats?.recent_exams?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_exams.map((ex) => (
                <div
                  key={ex.id}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{ex.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ex.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ex.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ex.status === 'ACTIVE' ? 'چالاک' : ex.status === 'COMPLETED' ? 'تەواوبوو' : 'ڕەشنووس'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {ex.subject} • {ex.grade} • {ex.results_count} ئەنجامی تۆمارکراو
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        onSelectExamForScan(ex.id);
                        setActiveTab('scanner');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>سکانکردن</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      ئەنجامەکان
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              هێشتا هیچ تاقیکردنەوەیەک دروست نەکراوە
            </div>
          )}
        </div>

        {/* Scanning Jobs & Quick Help (1 col) */}
        <div className="space-y-6">
          {/* Recent Jobs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm">کاری سکانکردنی دەستەیی</h3>
              </div>
              <button
                onClick={fetchStats}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                نوێکردنەوە
              </button>
            </div>

            {stats?.recent_jobs?.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recent_jobs.map((j) => (
                  <div key={j.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800">{j.id}</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {j.status === 'COMPLETED' ? 'تەواوبوو' : j.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{j.processed_pages} لە {j.total_pages} پەڕە تەواوبوو</span>
                      <span className="font-bold text-slate-700">
                        {Math.round((j.processed_pages / Math.max(1, j.total_pages)) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                هیچ کاری سکانێکی ئەم دواییە نییە
              </div>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50 border border-brand-100 space-y-2">
            <h4 className="font-bold text-xs text-brand-900">ڕێنمایی خێرای مامۆستا:</h4>
            <ul className="text-[11px] text-brand-800 space-y-1 leading-relaxed list-disc list-inside">
              <li>پەڕەی وەڵامی ستاندارد چاپ بکە لە بەشی «پەڕەی وەڵام».</li>
              <li>کلیلی وەڵام دابنێ پێش ئەوەی تاقیکردنەوەکە چالاک بکەیت.</li>
              <li>بە کامێرای مۆبایل وێنەی تەواوی پەڕەکە بگرە.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
