import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Trophy,
  Building2,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Layers,
  Crown,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function KurdistanMapSection({
  schools = [],
  selectedRegion = '',
  onSelectRegion,
  onResetRegion
}) {
  const { t, lang, isRTL } = useLanguage();
  const { isDark } = useTheme();
  const [hoveredRegionId, setHoveredRegionId] = useState(null);

  // Region Definitions with accurate Kurdish, English, and Arabic names
  const regions = useMemo(
    () => [
      {
        id: 'erbil',
        nameKu: 'هەولێر',
        nameEn: 'Erbil',
        nameAr: 'أربيل',
        badgeKu: 'پایتەختی هەرێمی کوردستان',
        badgeEn: 'Capital of Kurdistan Region',
        badgeAr: 'عاصمة إقليم كوردستان',
        isCapital: true,
        center: { x: 420, y: 260 },
        color: '#f59e0b', // Amber / Gold
        accentBg: 'rgba(245, 158, 11, 0.16)',
        path: 'M 320 200 C 370 170, 460 170, 500 220 C 530 250, 520 300, 470 330 C 430 355, 360 360, 320 310 C 290 270, 290 220, 320 200 Z',
        keywords: ['هەولێر', 'erbil', 'arbil', 'hawler', 'أربيل', 'هەولێری']
      },
      {
        id: 'sulaymaniyah',
        nameKu: 'سلێمانی',
        nameEn: 'Sulaymaniyah',
        nameAr: 'السليمانية',
        badgeKu: 'پایتەختی ڕۆشنبیری',
        badgeEn: 'Cultural Capital',
        badgeAr: 'عاصمة الثقافة',
        isCapital: false,
        center: { x: 620, y: 360 },
        color: '#10b981', // Emerald
        accentBg: 'rgba(16, 185, 129, 0.16)',
        path: 'M 515 285 C 570 260, 670 270, 715 325 C 750 365, 735 430, 680 445 C 610 460, 545 425, 515 375 C 495 340, 495 305, 515 285 Z',
        keywords: ['سلێمانی', 'sulaymaniyah', 'slemani', 'sulaimani', 'السليمانية', 'سلێمانیی']
      },
      {
        id: 'duhok',
        nameKu: 'دهۆک',
        nameEn: 'Duhok',
        nameAr: 'دهوك',
        badgeKu: 'دڵی بادینان',
        badgeEn: 'Heart of Badinan',
        badgeAr: 'قلب بادينان',
        isCapital: false,
        center: { x: 230, y: 175 },
        color: '#6366f1', // Indigo
        accentBg: 'rgba(99, 102, 241, 0.16)',
        path: 'M 170 120 C 240 100, 310 115, 335 165 C 355 210, 330 265, 275 275 C 215 285, 155 250, 145 195 C 140 155, 150 125, 170 120 Z',
        keywords: ['دهۆک', 'duhok', 'dohuk', 'دهوك', 'دهۆکی']
      },
      {
        id: 'halabja',
        nameKu: 'هەڵەبجە',
        nameEn: 'Halabja',
        nameAr: 'حلبجة',
        badgeKu: 'پارێزگای ئاشتی و شەهیدان',
        badgeEn: 'City of Peace & Martyrs',
        badgeAr: 'مدينة السلام والشهداء',
        isCapital: false,
        center: { x: 740, y: 440 },
        color: '#f43f5e', // Rose
        accentBg: 'rgba(244, 63, 94, 0.16)',
        path: 'M 695 390 C 740 375, 805 395, 825 440 C 840 480, 810 520, 765 525 C 720 530, 675 490, 680 440 C 682 415, 685 400, 695 390 Z',
        keywords: ['هەڵەبجە', 'halabja', 'حلبجة', 'هەڵەبجەی']
      },
      {
        id: 'soran',
        nameKu: 'ئیدارەی سەربەخۆی سۆران',
        nameEn: 'Soran Administration',
        nameAr: 'إدارة سوران المستقلة',
        badgeKu: 'لووتکەی چیا بەرزەکان',
        badgeEn: 'Highland Mountain Peaks',
        badgeAr: 'قمم الجبال العالية',
        isCapital: false,
        center: { x: 575, y: 135 },
        color: '#0ea5e9', // Sky Blue
        accentBg: 'rgba(14, 165, 233, 0.16)',
        path: 'M 480 85 C 560 55, 665 65, 700 120 C 725 165, 695 215, 630 225 C 565 235, 495 200, 475 155 C 465 125, 468 95, 480 85 Z',
        keywords: ['سۆران', 'soran', 'سوران', 'ڕەواندز', 'چۆمان', 'مێرگەسۆر']
      },
      {
        id: 'zakho',
        nameKu: 'ئیدارەی سەربەخۆی زاخۆ',
        nameEn: 'Zakho Administration',
        nameAr: 'إدارة زاخو المستقلة',
        badgeKu: 'دەروازەی نێودەوڵەتی خابوور',
        badgeEn: 'International Border Gateway',
        badgeAr: 'بوابة خابور الدولية',
        isCapital: false,
        center: { x: 135, y: 95 },
        color: '#f97316', // Orange
        accentBg: 'rgba(249, 115, 22, 0.16)',
        path: 'M 75 60 C 130 45, 185 55, 205 95 C 220 135, 195 175, 150 180 C 105 185, 65 150, 60 110 C 58 85, 65 65, 75 60 Z',
        keywords: ['زاخۆ', 'zakho', 'زاخو', 'خابوور']
      },
      {
        id: 'garmian',
        nameKu: 'ئیدارەی سەربەخۆی گەرمیان',
        nameEn: 'Garmian Administration',
        nameAr: 'إدارة كرميان المستقلة',
        badgeKu: 'مەڵبەندی مێژوو و خۆڕاگری',
        badgeEn: 'Historic Resistance Heartland',
        badgeAr: 'معقل الصمود والتاريخ',
        isCapital: false,
        center: { x: 575, y: 505 },
        color: '#d97706', // Warm Gold
        accentBg: 'rgba(217, 119, 6, 0.16)',
        path: 'M 490 445 C 555 430, 645 440, 675 490 C 695 530, 665 575, 605 585 C 540 595, 475 560, 465 510 C 460 480, 475 455, 490 445 Z',
        keywords: ['گەرمیان', 'garmian', 'كرميان', 'کەلار', 'کفری', 'kalar']
      },
      {
        id: 'raparin',
        nameKu: 'ئیدارەی سەربەخۆی ڕاپەڕین',
        nameEn: 'Raparin Administration',
        nameAr: 'إدارة ڕاپەرين المستقلة',
        badgeKu: 'دەروازەی ڕاپەڕینی مەزن',
        badgeEn: 'Gateway of the Great Uprising',
        badgeAr: 'بوابة الانتفاضة العظيمة',
        isCapital: false,
        center: { x: 625, y: 245 },
        color: '#14b8a6', // Teal
        accentBg: 'rgba(20, 184, 166, 0.16)',
        path: 'M 545 195 C 615 185, 695 195, 725 240 C 740 275, 715 310, 660 320 C 600 330, 545 300, 530 260 C 525 230, 535 205, 545 195 Z',
        keywords: ['ڕاپەڕین', 'raparin', 'رانية', 'ڕانیە', 'قەڵادزێ', 'پشدەر']
      }
    ],
    []
  );

  // Derive Region Statistics from schools data
  const regionStats = useMemo(() => {
    const stats = {};
    regions.forEach((r) => {
      // Find matching schools by keyword
      const matchingSchools = schools.filter((s) => {
        const sName = (s.name || s.school_name || '').toLowerCase();
        return r.keywords.some((kw) => sName.includes(kw.toLowerCase()));
      });

      const count = matchingSchools.length;
      let avg = 0;
      if (count > 0) {
        const sum = matchingSchools.reduce((acc, curr) => acc + (curr.average || curr.score || 0), 0);
        avg = Math.round((sum / count) * 10) / 10;
      }

      stats[r.id] = {
        schoolsCount: count,
        average: avg,
        leadingSchool: matchingSchools[0]?.school_name || matchingSchools[0]?.name || null
      };
    });
    return stats;
  }, [schools, regions]);

  // Active region to display in HUD (hovered or selected or first capital)
  const activeRegion = useMemo(() => {
    if (hoveredRegionId) {
      return regions.find((r) => r.id === hoveredRegionId) || regions[0];
    }
    if (selectedRegion) {
      return regions.find((r) => r.id === selectedRegion) || regions[0];
    }
    return regions[0]; // Default to Erbil
  }, [hoveredRegionId, selectedRegion, regions]);

  const activeStats = regionStats[activeRegion.id] || { schoolsCount: 0, average: 0, leadingSchool: null };

  const getRegionName = (reg) => {
    if (lang === 'en') return reg.nameEn;
    if (lang === 'ar') return reg.nameAr;
    return reg.nameKu;
  };

  const getRegionBadge = (reg) => {
    if (lang === 'en') return reg.badgeEn;
    if (lang === 'ar') return reg.badgeAr;
    return reg.badgeKu;
  };

  return (
    <div className="w-full my-8 scroll-mt-24" id="kurdistan-interactive-map" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Header with Golden Emblem & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2">
                <span>{t('kurdistanMapTitle')}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  LIVE GIS
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('kurdistanMapSubtitle')}
            </p>
          </div>
        </div>

        {/* Reset Filter Button if active */}
        {selectedRegion && (
          <button
            type="button"
            onClick={onResetRegion}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-amber-400/40 text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('showAllSchools')}</span>
          </button>
        )}
      </div>

      {/* 2. Interactive Region Selector Chips (Quick Mobile & Desktop Tap) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-4 scrollbar-none text-xs">
        {/* All Kurdistan Chip */}
        <button
          type="button"
          onClick={onResetRegion}
          className={`px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
            !selectedRegion
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🌍</span>
          <span>{t('allKurdistan')}</span>
        </button>

        {/* Governorates & Administrations */}
        {regions.map((reg) => {
          const isSelected = selectedRegion === reg.id;
          const isHovered = hoveredRegionId === reg.id;
          return (
            <button
              key={reg.id}
              type="button"
              onClick={() => {
                if (onSelectRegion) onSelectRegion(reg.id);
              }}
              onMouseEnter={() => setHoveredRegionId(reg.id)}
              onMouseLeave={() => setHoveredRegionId(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 font-black ring-2 ring-amber-300'
                  : isHovered
                  ? 'bg-slate-800 text-white border border-amber-400/40'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: reg.color }}
              />
              <span>{getRegionName(reg)}</span>
              {reg.isCapital && (
                <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded font-mono">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Dual Panel: Left is Neon SVG Map, Right is Dynamic HUD Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (8 cols): High Precision Vector SVG Map */}
        <div className="lg:col-span-8 bg-[#070b16] rounded-3xl border border-slate-800/90 p-3 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          {/* Cybernetic Grid & Radar Background Details */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Map Top Status Bar */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-slate-300">
                KURDISTAN REGION • GIS VECTOR MAP
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-slate-500">
              <span>LAT: 36°11' N</span>
              <span>LON: 44°00' E</span>
              <span>GRID: KRG-8Z</span>
            </div>
          </div>

          {/* SVG Map Container */}
          <div className="relative z-10 w-full h-[320px] sm:h-[400px] md:h-[460px] flex items-center justify-center">
            <svg
              viewBox="0 0 920 620"
              className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] select-none"
            >
              <defs>
                {/* Glow Filter for Selected / Hovered Territory */}
                <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Subtle Grid Pattern */}
                <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1" fill="#1e293b" opacity="0.6" />
                </pattern>
              </defs>

              {/* Background Radar Grid */}
              <rect x="0" y="0" width="920" height="620" fill="url(#grid-dots)" />

              {/* Decorative Geographic Latitude & Longitude Guidelines */}
              <line x1="40" y1="200" x2="880" y2="200" stroke="#1e293b" strokeDasharray="3 3" opacity="0.4" />
              <line x1="40" y1="380" x2="880" y2="380" stroke="#1e293b" strokeDasharray="3 3" opacity="0.4" />
              <line x1="300" y1="40" x2="300" y2="580" stroke="#1e293b" strokeDasharray="3 3" opacity="0.4" />
              <line x1="600" y1="40" x2="600" y2="580" stroke="#1e293b" strokeDasharray="3 3" opacity="0.4" />

              {/* Compass Rose in Upper Corner */}
              <g transform="translate(850, 70)" opacity="0.8">
                <circle cx="0" cy="0" r="26" fill="#0b1329" stroke="#334155" strokeWidth="1" />
                <polygon points="0,-22 5,-4 0,0 -5,-4" fill="#f59e0b" />
                <polygon points="0,22 5,4 0,0 -5,4" fill="#475569" />
                <polygon points="-22,0 -4,5 0,0 -4,-5" fill="#475569" />
                <polygon points="22,0 4,5 0,0 4,-5" fill="#475569" />
                <circle cx="0" cy="0" r="3" fill="#f59e0b" />
                <text x="0" y="-28" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="900">
                  N
                </text>
              </g>

              {/* 1. Territory Polygons */}
              {regions.map((reg) => {
                const isSelected = selectedRegion === reg.id;
                const isHovered = hoveredRegionId === reg.id;
                const isHighlighted = isSelected || isHovered;

                return (
                  <g
                    key={reg.id}
                    className="cursor-pointer transition-all duration-300 group"
                    onClick={() => {
                      if (onSelectRegion) onSelectRegion(reg.id);
                    }}
                    onMouseEnter={() => setHoveredRegionId(reg.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                  >
                    {/* Glowing Underlay if Highlighted */}
                    {isHighlighted && (
                      <path
                        d={reg.path}
                        fill={reg.color}
                        opacity="0.35"
                        filter="url(#neon-glow)"
                      />
                    )}

                    {/* Main Territory Shape */}
                    <path
                      d={reg.path}
                      fill={isHighlighted ? reg.accentBg : '#0b1426'}
                      stroke={isHighlighted ? reg.color : '#1e293b'}
                      strokeWidth={isHighlighted ? '2.8' : '1.5'}
                      strokeLinejoin="round"
                      className="transition-all duration-300"
                    />

                    {/* Territory Name Label on Map */}
                    <text
                      x={reg.center.x}
                      y={reg.center.y - 12}
                      textAnchor="middle"
                      fill={isHighlighted ? '#ffffff' : '#94a3b8'}
                      fontSize={reg.isCapital ? '14' : '12'}
                      fontWeight="900"
                      className="select-none pointer-events-none drop-shadow-md"
                    >
                      {getRegionName(reg)}
                    </text>

                    {/* Beacon Node Circle with Animated Pulse */}
                    <circle
                      cx={reg.center.x}
                      cy={reg.center.y + 10}
                      r={isHighlighted ? '7' : '5'}
                      fill={reg.color}
                      className="transition-all duration-300 drop-shadow"
                    />

                    {/* Pulse wave when hovered/selected */}
                    {isHighlighted && (
                      <circle
                        cx={reg.center.x}
                        cy={reg.center.y + 10}
                        r="14"
                        fill="none"
                        stroke={reg.color}
                        strokeWidth="1.5"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="r"
                          from="6"
                          to="22"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.9"
                          to="0"
                          dur="1.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Capital Star Emblem if Erbil */}
                    {reg.isCapital && (
                      <g transform={`translate(${reg.center.x - 7}, ${reg.center.y + 3})`}>
                        <polygon
                          points="7,0 9,5 14,5 10,8 12,13 7,10 2,13 4,8 0,5 5,5"
                          fill="#ffffff"
                        />
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Footer Note */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('clickRegionToFilter')}</span>
            </span>
            <span className="font-mono text-slate-500">8 GOVERNORATES & REGIONS</span>
          </div>
        </div>

        {/* Right Column (4 cols): Interactive Info HUD Card */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {/* Active Territory Card */}
          <div className="bg-[#080d1a] rounded-3xl border border-slate-800/90 p-4 sm:p-5 shadow-2xl relative overflow-hidden flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Region Top Banner */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-md"
                      style={{ backgroundColor: activeRegion.color }}
                    />
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {getRegionName(activeRegion)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-400 block mt-1">
                    {getRegionBadge(activeRegion)}
                  </span>
                </div>

                {activeRegion.isCapital && (
                  <span className="px-2 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase font-mono shrink-0">
                    CAPITAL
                  </span>
                )}
              </div>

              {/* Performance Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {t('participatingSchools')}
                  </span>
                  <span className="text-xl font-black text-white mt-0.5 block">
                    {activeStats.schoolsCount > 0 ? activeStats.schoolsCount : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {t('avgScore')}
                  </span>
                  <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                    {activeStats.average > 0 ? `${activeStats.average}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Leading School Info */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold text-slate-300">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('leadingSchool')}</span>
                  </span>
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xs font-black text-white truncate">
                  {activeStats.leadingSchool || 'لە چاوەڕوانی تاقیکردنەوەی فەرمی'}
                </p>
              </div>
            </div>

            {/* Action Filter Button */}
            <div className="pt-4 border-t border-slate-800 mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onSelectRegion) onSelectRegion(activeRegion.id);
                }}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg ${
                  selectedRegion === activeRegion.id
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {selectedRegion === activeRegion.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {lang === 'en'
                        ? 'Filter Applied to Rankings'
                        : lang === 'ar'
                        ? 'تم تطبيق التصفية على الترتيب'
                        : 'فلتەری ئەم پارێزگایە چالاکە'}
                    </span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>{t('filterByGovernorate')}</span>
                  </>
                )}
              </button>

              {selectedRegion && (
                <button
                  type="button"
                  onClick={onResetRegion}
                  className="w-full py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('showAllSchools')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Governorates League Podium Card */}
          <div className="bg-[#080d1a] rounded-3xl border border-slate-800/90 p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-black text-white pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>{t('governoratesCup')}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">TOP KRG</span>
            </div>

            <div className="space-y-1.5 pt-2.5 text-xs">
              {regions.slice(0, 3).map((reg, idx) => (
                <div
                  key={reg.id}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(reg.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    selectedRegion === reg.id
                      ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-black font-mono text-amber-400">
                      {idx + 1}
                    </span>
                    <span className="font-bold">{getRegionName(reg)}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    {reg.isCapital ? '★ CAPITAL' : 'ACTIVE'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
