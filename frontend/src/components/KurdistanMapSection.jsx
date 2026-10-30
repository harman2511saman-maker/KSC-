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
  RotateCcw,
  Crown,
  Layers
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

  // Region Definitions with exact matching colors from the official graphic
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
        // Exact detected pin center on 1024x794 image: (440, 324)
        pos: { x: 43.0, y: 40.8 },
        color: '#22c55e', // Vibrant Neon Green
        dotClass: 'bg-emerald-500',
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
        // (662, 318)
        pos: { x: 64.6, y: 40.1 },
        color: '#f97316', // Vibrant Glowing Orange
        dotClass: 'bg-orange-500',
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
        // (370, 174)
        pos: { x: 36.1, y: 21.9 },
        color: '#eab308', // Bright Golden Yellow
        dotClass: 'bg-yellow-500',
        keywords: ['دهۆک', 'duhok', 'dohuk', 'دهوك', 'دهۆکی']
      },
      {
        id: 'zakho',
        nameKu: 'ئیدارەی سەربەخۆی زاخۆ',
        nameEn: 'Zakho Administration',
        nameAr: 'إدارة زاخو المستقلة',
        badgeKu: 'دەروازەی نێودەوڵەتی خابوور',
        badgeEn: 'International Gateway',
        badgeAr: 'بوابة خابور الدولية',
        isCapital: false,
        // (225, 181)
        pos: { x: 22.0, y: 22.8 },
        color: '#a855f7', // Vibrant Glowing Purple
        dotClass: 'bg-purple-500',
        keywords: ['زاخۆ', 'zakho', 'زاخو', 'خابوور']
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
        // (757, 421)
        pos: { x: 73.9, y: 53.0 },
        color: '#d946ef', // Vibrant Magenta / Fuchsia
        dotClass: 'bg-fuchsia-500',
        keywords: ['هەڵەبجە', 'halabja', 'حلبجة', 'هەڵەبجەی']
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
        // (804, 582)
        pos: { x: 78.5, y: 73.3 },
        color: '#ef4444', // Deep Glowing Red
        dotClass: 'bg-red-500',
        keywords: ['گەرمیان', 'garmian', 'كرميان', 'کەلار', 'کفری', 'kalar']
      },
      {
        id: 'raparin',
        nameKu: 'ئیدارەی سەربەخۆی ڕاپەڕین',
        nameEn: 'Raparin Administration',
        nameAr: 'إدارة ڕاپەرين المستقلة',
        badgeKu: 'دەروازەی ڕاپەڕینی مەزن',
        badgeEn: 'Gateway of Great Uprising',
        badgeAr: 'بوابة الانتفاضة العظيمة',
        isCapital: false,
        // (617, 472)
        pos: { x: 60.3, y: 59.4 },
        color: '#06b6d4', // Neon Cyan / Light Teal
        dotClass: 'bg-cyan-500',
        keywords: ['ڕاپەڕین', 'raparin', 'رانية', 'ڕانیە', 'قەڵادزێ', 'پشدەر']
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
        // (589, 213)
        pos: { x: 57.5, y: 26.8 },
        color: '#0284c7', // Electric Blue
        dotClass: 'bg-sky-600',
        keywords: ['سۆران', 'soran', 'سوران', 'ڕەواندز', 'چۆمان', 'مێرگەسۆر']
      }
    ],
    []
  );

  // Derive Region Statistics from schools data
  const regionStats = useMemo(() => {
    const stats = {};
    regions.forEach((r) => {
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

  // Active region for HUD
  const activeRegion = useMemo(() => {
    if (hoveredRegionId) {
      return regions.find((r) => r.id === hoveredRegionId) || regions[0];
    }
    if (selectedRegion) {
      return regions.find((r) => r.id === selectedRegion) || regions[0];
    }
    return regions[0]; // Erbil by default
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
                  OFFICIAL 3D RELIEF
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

        {/* Governorates & Administrations with exact matching colors */}
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
                  ? 'text-slate-950 shadow-md font-black ring-2'
                  : isHovered
                  ? 'bg-slate-800 text-white border'
                  : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: isSelected ? reg.color : undefined,
                borderColor: isHovered ? reg.color : undefined,
                boxShadow: isSelected ? `0 0 16px ${reg.color}66` : undefined
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: reg.color }}
              />
              <span>{getRegionName(reg)}</span>
              {reg.isCapital && (
                <span className="text-[9px] bg-black/20 text-slate-900 px-1 py-0.2 rounded font-mono font-bold">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main Dual Panel: Left is Official 3D Relief Graphic with Interactive Hotspots, Right is HUD Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (8 cols): Official High Definition Kurdistan Relief Map */}
        <div className="lg:col-span-8 bg-[#070b16] rounded-3xl border border-slate-800/90 p-2 sm:p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          {/* Map Top Status Bar */}
          <div className="relative z-20 flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-2 mb-2 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-slate-300">
                KURDISTAN REGION • RELIEF 3D GIS
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
              <span className="hidden sm:inline">SCALE: 1:500,000</span>
              <span className="text-amber-400 font-bold">8 REGIONS & ADMINISTRATIONS</span>
            </div>
          </div>

          {/* Interactive Map Visual Layer with Exact Pin Radar Overlays */}
          <div className="relative z-10 w-full overflow-hidden rounded-2xl bg-black border border-slate-800/80 shadow-2xl group select-none">
            {/* The Official Graphic provided by User */}
            <img
              src="/kurdistan-map.jpg"
              alt="Official Kurdistan Region Governorates Map"
              className="w-full h-auto object-contain block rounded-2xl"
              loading="eager"
            />

            {/* Interactive Radar Hotspots Overlay positioned exactly over each territory's pin */}
            {regions.map((reg) => {
              const isSelected = selectedRegion === reg.id;
              const isHovered = hoveredRegionId === reg.id;
              const isHighlighted = isSelected || isHovered;

              return (
                <div
                  key={reg.id}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(reg.id);
                  }}
                  onMouseEnter={() => setHoveredRegionId(reg.id)}
                  onMouseLeave={() => setHoveredRegionId(null)}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 flex items-center justify-center p-3 group/pin z-20"
                  style={{
                    left: `${reg.pos.x}%`,
                    top: `${reg.pos.y}%`
                  }}
                  title={getRegionName(reg)}
                >
                  {/* Glowing Radar Pulse Wave emanating directly from the printed circle */}
                  <span
                    className={`absolute rounded-full pointer-events-none transition-all duration-300 ${
                      isHighlighted
                        ? 'w-9 h-9 sm:w-11 sm:h-11 animate-ping opacity-85'
                        : 'w-6 h-6 sm:w-7 sm:h-7 animate-pulse opacity-40'
                    }`}
                    style={{ backgroundColor: reg.color }}
                  />

                  {/* Outer Glowing Ring aligned with printed circle */}
                  <span
                    className={`absolute rounded-full border-2 transition-all duration-300 pointer-events-none ${
                      isHighlighted
                        ? 'w-6 h-6 sm:w-7 sm:h-7 border-white shadow-xl scale-110'
                        : 'w-5 h-5 sm:w-6 sm:h-6 border-white/50 opacity-60'
                    }`}
                    style={{
                      boxShadow: isHighlighted ? `0 0 16px ${reg.color}` : `0 0 6px ${reg.color}80`
                    }}
                  />

                  {/* Center Dot matching territory color */}
                  <span
                    className={`relative rounded-full transition-all duration-300 border border-white shadow-md ${
                      isHighlighted ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 scale-110' : 'w-2 h-2 sm:w-2.5 sm:h-2.5 opacity-90'
                    }`}
                    style={{ backgroundColor: reg.color }}
                  />

                  {/* Interactive Floating Hover Pill */}
                  <div
                    className={`absolute bottom-full mb-1.5 whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-950/95 border text-[11px] font-black text-white shadow-2xl pointer-events-none transition-all duration-200 ${
                      isHighlighted
                        ? 'opacity-100 scale-100 -translate-y-1'
                        : 'opacity-0 scale-90 translate-y-1'
                    }`}
                    style={{ borderColor: reg.color }}
                  >
                    <span>{getRegionName(reg)}</span>
                    {reg.isCapital && <span className="text-amber-400 ml-1">★</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Footer Note */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 px-2 border-t border-slate-800/60 mt-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('clickRegionToFilter')}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">KSC OFFICIAL COMPETITION GIS</span>
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
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-lg"
                      style={{
                        backgroundColor: activeRegion.color,
                        boxShadow: `0 0 10px ${activeRegion.color}`
                      }}
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

          {/* Quick Governorates League Podium Card with Exact Matching Colors */}
          <div className="bg-[#080d1a] rounded-3xl border border-slate-800/90 p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs font-black text-white pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                <span>{t('governoratesCup')}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">KRG LEAGUE</span>
            </div>

            <div className="space-y-1.5 pt-2.5 text-xs">
              {regions.slice(0, 4).map((reg, idx) => (
                <div
                  key={reg.id}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(reg.id);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    selectedRegion === reg.id
                      ? 'bg-slate-800/90 border text-white font-bold'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                  style={{
                    borderColor: selectedRegion === reg.id ? reg.color : undefined
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: reg.color }}
                    />
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
