import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Sliders,
  Palette,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import api from '../api';

export const THEME_GRADIENTS = [
  {
    id: 'amber',
    name: 'ئاڵتوونی / زەرد (ڕێنمایی)',
    gradient: 'from-amber-600 via-amber-800 to-slate-950',
    border: 'border-amber-500/40',
    previewBg: 'bg-gradient-to-r from-amber-500 to-yellow-600'
  },
  {
    id: 'emerald',
    name: 'سەوزی شاھانە (سپۆنسەر)',
    gradient: 'from-emerald-700 via-emerald-800 to-slate-900',
    border: 'border-emerald-500/40',
    previewBg: 'bg-gradient-to-r from-emerald-500 to-teal-600'
  },
  {
    id: 'indigo',
    name: 'شینی ئیندیگۆ (کۆمپانیا)',
    gradient: 'from-indigo-700 via-slate-900 to-slate-950',
    border: 'border-indigo-500/40',
    previewBg: 'bg-gradient-to-r from-indigo-500 to-blue-600'
  },
  {
    id: 'purple',
    name: 'مۆری شکۆدار (VIP)',
    gradient: 'from-purple-800 via-slate-900 to-slate-950',
    border: 'border-purple-500/40',
    previewBg: 'bg-gradient-to-r from-purple-500 to-pink-600'
  },
  {
    id: 'rose',
    name: 'سووری سەرنجڕاکێش (گرنگ)',
    gradient: 'from-rose-800 via-slate-900 to-slate-950',
    border: 'border-rose-500/40',
    previewBg: 'bg-gradient-to-r from-rose-500 to-red-600'
  },
  {
    id: 'slate',
    name: 'ڕەشی مۆدێرن (کلاسیک)',
    gradient: 'from-slate-800 via-slate-900 to-black',
    border: 'border-slate-600/40',
    previewBg: 'bg-gradient-to-r from-slate-700 to-slate-950'
  }
];

export const INITIAL_DEFAULT_SLIDES = [
  {
    id: 1,
    badge: 'سپۆنسەری فەرمی',
    title: 'پاڵپشتی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC)',
    description: 'بەشداری لە بەهێزترین پێشبڕکێی زانستی و خوێندنی کوردستان • دیاری و بڕوانامەی شایستە بۆ قوتابخانە و قوتابییە یەکەمەکان',
    tag: 'KSC VIP',
    link: 'https://t.me/KurdishOMR',
    link_text: 'پەیوەندی لە تێلیگرام',
    bg_gradient: 'from-emerald-700 via-emerald-800 to-slate-900'
  },
  {
    id: 2,
    badge: 'ڕێنمایی تاقیکردنەوە',
    title: 'سیستەمی سکان و پشکنینی ئەلیکترۆنیی فۆڕمی وەڵام',
    description: 'تەنها یەک بازنە بە قەڵەمی جافی تۆخ پڕبکەرەوە • ئەنجامەکان بە شێوازی دەستبەجێ بە ژیری دەستکرد شیکاری دەکرێن',
    tag: 'OMR GUIDE',
    link: '#',
    link_text: 'خوێندنەوەی یاساکان',
    bg_gradient: 'from-amber-600 via-amber-800 to-slate-950'
  },
  {
    id: 3,
    badge: 'ڕێکلام و هاوبەشی',
    title: 'دەرگای سپۆنسەری و هاوبەشی کراوەیە بۆ کۆمپانیا و ناوەندەکان',
    description: 'بۆ ناساندنی براندەکەت بە دەیان هەزار قوتابی و مامۆستا لە سەرانسەری هەرێمی کوردستان، پەیوەندیمان پێوە بکەن',
    tag: 'SPONSOR',
    link: 'https://wa.me/HarmanGaraway',
    link_text: 'پەیوەندی لە وەتسئاپ',
    bg_gradient: 'from-indigo-700 via-slate-900 to-slate-950'
  }
];

export default function PromoSlideEditor({ onShowToast, onPublished }) {
  const [slides, setSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [fullSettings, setFullSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/competitions/settings');
      setFullSettings(res.data || {});
      if (res.data?.promo_slides && res.data.promo_slides.length > 0) {
        setSlides(res.data.promo_slides);
      } else {
        setSlides(INITIAL_DEFAULT_SLIDES);
      }
    } catch (err) {
      setSlides(INITIAL_DEFAULT_SLIDES);
    } finally {
      setLoading(false);
    }
  };

  const currentSlide = slides[activeSlideIndex] || slides[0] || {
    id: Date.now(),
    badge: 'ڕێنمایی',
    title: 'ناونیشانی نوێ',
    description: 'ڕوونکردنەوەی نوێ لێرە بنووسە',
    tag: 'INFO',
    link: '#',
    link_text: 'کردنەوەی بەستەر',
    bg_gradient: THEME_GRADIENTS[0].gradient
  };

  const updateCurrentSlide = (field, value) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (!updated[activeSlideIndex]) return prev;
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        [field]: value
      };
      return updated;
    });
  };

  const handleAddNewSlide = () => {
    const newSlide = {
      id: Date.now(),
      badge: 'ڕێنمایی / ڕیکلامی نوێ',
      title: 'ناونیشانی سلایدی نوێ لێرە بنووسە',
      description: 'ڕوونکردنەوەی تەواو لەسەر ڕێنماییەکان، یاساکان یان ئۆفەری سپۆنسەر لێرە بنووسە.',
      tag: 'NEW',
      link: 'https://',
      link_text: 'کردنەوەی بەستەر',
      bg_gradient: THEME_GRADIENTS[(slides.length) % THEME_GRADIENTS.length].gradient
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    if (onShowToast) onShowToast({ type: 'success', message: 'سلایدی نوێ زیادکرا' });
  };

  const handleDeleteSlide = (indexToDelete) => {
    if (slides.length <= 1) {
      if (onShowToast) onShowToast({ type: 'error', message: 'دەبێت لانیکەم یەک سلاید هەبێت لەسەر پلاتفۆرم' });
      return;
    }
    const updated = slides.filter((_, idx) => idx !== indexToDelete);
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, indexToDelete - 1));
    if (onShowToast) onShowToast({ type: 'success', message: 'سلایدەکە بە سەرکەوتوویی سڕایەوە' });
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const payload = {
        ...fullSettings,
        promo_slides: slides
      };
      await api.put('/competitions/settings', payload);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: 'سلایدەکان بە سەرکەوتوویی بڵاوکرانەوە و ڕاستەوخۆ لەسەر پلاتفۆرم کارا کران!'
        });
      }
      if (onPublished) onPublished(slides);
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: err.response?.data?.detail || err.message || 'هەڵەیەک ڕوویدا لە کاتی بڵاوکردنەوە'
        });
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleResetToDefault = () => {
    setSlides(INITIAL_DEFAULT_SLIDES);
    setActiveSlideIndex(0);
    if (onShowToast) onShowToast({ type: 'info', message: 'سلایدەکان گەڕێندرانەوە سەر شێوازی بنەڕەت' });
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-bold">بارکردنی سلایدەکانی پلاتفۆرم...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>بەڕێوەبردن و بڵاوکردنەوەی سلایدەکانی پەڕەی سەرەکی</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            کۆنترۆڵی تەواوی نووسین، بەستەر، ڕەنگ و ژمارەکان بکە و بە یەک کلیک بڵاوی بکەرەوە لەسەر www.ksciq.com
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleAddNewSlide}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی سلایدی نوێ</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Save className="w-4 h-4 text-slate-950" />
            )}
            <span>بڵاوکردنەوە لەسەر پلاتفۆرم (Publish)</span>
          </button>
        </div>
      </div>

      {/* Slide Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {slides.map((s, idx) => (
          <button
            key={s.id || idx}
            type="button"
            onClick={() => setActiveSlideIndex(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
              activeSlideIndex === idx
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>سلایدی {idx + 1}:</span>
            <span className="truncate max-w-[130px]">{s.badge || s.title}</span>
          </button>
        ))}
      </div>

      {/* LIVE INTERACTIVE PREVIEW */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <Eye className="w-4 h-4" />
            <span>پێشبینینی ڕاستەوخۆ (Live Preview): لەسەر ماڵپەڕ ئاوا پێشاندەدرێت</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            سلایدی {activeSlideIndex + 1} لە کۆی {slides.length}
          </span>
        </div>

        {/* The Exact Banner UI */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br ${currentSlide.bg_gradient || 'from-amber-600 via-amber-800 to-slate-950'} border border-white/20 shadow-2xl overflow-hidden transition-all duration-300`}
        >
          {/* Ambient Decorative Lighting */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] space-y-4">
            
            {/* Top Tag & Emblem */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentSlide.badge || 'ڕێنمایی تاقیکردنەوە'}</span>
                </span>
                {currentSlide.tag && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white/90 font-mono text-[10px] font-bold border border-white/10">
                    {currentSlide.tag}
                  </span>
                )}
              </div>

              <img
                src="/logo.png"
                alt="KSC"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-md rounded-lg"
              />
            </div>

            {/* Center Main Text */}
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                {currentSlide.title || 'ناونیشانی سەرەکی سلاید لێرە دەردەکەوێت'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl font-medium">
                {currentSlide.description || 'دەقی ڕوونکردنەوە و زانیاری زیاتر دەربارەی تاقیکردنەوە یان سپۆنسەر لێرەدا دەردەکەوێت.'}
              </p>
            </div>

            {/* Bottom Bar: Action link & Tag */}
            <div className="flex items-center justify-between pt-3 border-t border-white/15">
              {currentSlide.link && currentSlide.link !== '#' ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20 shadow-md">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                  <span>{currentSlide.link_text || 'کردنەوەی بەستەر'}</span>
                </div>
              ) : (
                <span className="text-[11px] text-white/70 font-medium">
                  {currentSlide.link_text || 'پلاتفۆرمی فەرمی KSC'}
                </span>
              )}

              <span className="text-xs font-bold text-white/80">
                {currentSlide.badge || 'KSC Platform'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* EDITING FORM FOR CURRENT SLIDE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-black text-sm">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>دەستکاریکردنی سلایدی ژمارە {activeSlideIndex + 1}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDeleteSlide(activeSlideIndex)}
              disabled={slides.length <= 1}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-500/20 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>سڕینەوەی ئەم سلایدە</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              نیشانەی سەرەوە (Badge / دەقی ئاگاداری):
            </label>
            <input
              type="text"
              value={currentSlide.badge || ''}
              onChange={(e) => updateCurrentSlide('badge', e.target.value)}
              placeholder="نموونە: ڕێنمایی تاقیکردنەوە، سپۆنسەری فەرمی، ئاگاداری"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Tag Code */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              تێگی کورت (Tag Code):
            </label>
            <input
              type="text"
              value={currentSlide.tag || ''}
              onChange={(e) => updateCurrentSlide('tag', e.target.value)}
              placeholder="نموونە: OMR GUIDE, KSC VIP, SPONSOR"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              dir="ltr"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            ناونیشانی سەرەکیی سلاید (Main Title):
          </label>
          <input
            type="text"
            value={currentSlide.title || ''}
            onChange={(e) => updateCurrentSlide('title', e.target.value)}
            placeholder="سیستەمی سکان و پشکنینی ئەلیکترۆنیی فۆڕمی وەڵام"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            دەقی ڕوونکردنەوە و زانیاری (Description):
          </label>
          <textarea
            rows={2}
            value={currentSlide.description || ''}
            onChange={(e) => updateCurrentSlide('description', e.target.value)}
            placeholder="تەنها یەک بازنە بە قەڵەمی جافی تۆخ پڕبکەرەوە • ئەنجامەکان بە شێوازی دەستبەجێ بە ژیری دەستکرد شیکاری دەکرێن"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Link and Link Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>بەستەری ڕاستەوخۆ (Direct URL Link):</span>
            </label>
            <input
              type="text"
              value={currentSlide.link || ''}
              onChange={(e) => updateCurrentSlide('link', e.target.value)}
              placeholder="https://t.me/... یان https://wa.me/... یان #"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              دەقی دوگمەی بەستەر (Button Action Text):
            </label>
            <input
              type="text"
              value={currentSlide.link_text || ''}
              onChange={(e) => updateCurrentSlide('link_text', e.target.value)}
              placeholder="خوێندنەوەی یاساکان / پەیوەندی لە تێلیگرام"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Gradient Color Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>دیاریکردنی شێوازی ڕەنگ و باکگراوند (Color Theme):</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {THEME_GRADIENTS.map((theme) => {
              const isSelected = currentSlide.bg_gradient === theme.gradient;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updateCurrentSlide('bg_gradient', theme.gradient)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`h-6 w-full rounded-lg ${theme.previewBg} shadow-inner`} />
                  <span className="text-[11px] font-bold text-slate-200 truncate">{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls at Bottom */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>گەڕاندنەوە بۆ بنەڕەت</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Save className="w-4 h-4 text-slate-950" />
            )}
            <span>پاشەکەوتکردن و بڵاوکردنەوە لەسەر پلاتفۆرم (Publish Live)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
