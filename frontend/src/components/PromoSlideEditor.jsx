import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  Palette,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Phone,
  Globe,
  X
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

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
    links: [
      { id: 1, title: 'پەیوەندی لە تێلیگرام', url: 'https://t.me/KurdishOMR' }
    ],
    image_url: '',
    image_mode: 'side',
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
    links: [
      { id: 1, title: 'خوێندنەوەی یاساکان', url: '#' }
    ],
    image_url: '',
    image_mode: 'side',
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
    links: [
      { id: 1, title: 'پەیوەندی لە وەتسئاپ', url: 'https://wa.me/HarmanGaraway' }
    ],
    image_url: '',
    image_mode: 'side',
    bg_gradient: 'from-indigo-700 via-slate-900 to-slate-950'
  }
];

// Helper to normalize slides from server (ensuring links array & image fields exist)
const normalizeSlides = (rawSlides) => {
  if (!Array.isArray(rawSlides) || rawSlides.length === 0) {
    return INITIAL_DEFAULT_SLIDES;
  }
  return rawSlides.map((s, idx) => {
    let links = [];
    if (Array.isArray(s.links) && s.links.length > 0) {
      links = s.links;
    } else if (s.link && s.link !== '#') {
      links = [{ id: 1, title: s.link_text || 'کردنەوەی بەستەر', url: s.link }];
    }
    return {
      ...s,
      id: s.id || Date.now() + idx,
      image_url: s.image_url || '',
      image_mode: s.image_mode || 'side',
      links: links,
      link: s.link || (links[0]?.url || '#'),
      link_text: s.link_text || (links[0]?.title || 'کردنەوەی بەستەر')
    };
  });
};

export default function PromoSlideEditor({ onShowToast, onPublished }) {
  const [slides, setSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideLang, setSlideLang] = useState('ku'); // 'ku' | 'en' | 'ar'
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullSettings, setFullSettings] = useState({});

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/competitions/settings');
      setFullSettings(res.data || {});
      if (res.data?.promo_slides && res.data.promo_slides.length > 0) {
        setSlides(normalizeSlides(res.data.promo_slides));
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
    links: [],
    image_url: '',
    image_mode: 'side',
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

  // Multiple links updates
  const updateSlideLinks = (newLinks) => {
    setSlides((prev) => {
      const updated = [...prev];
      if (!updated[activeSlideIndex]) return prev;
      const firstLink = newLinks[0];
      updated[activeSlideIndex] = {
        ...updated[activeSlideIndex],
        links: newLinks,
        link: firstLink?.url || '#',
        link_text: firstLink?.title || 'کردنەوەی بەستەر'
      };
      return updated;
    });
  };

  const handleAddLink = (presetTitle = '', presetUrl = '') => {
    const existing = currentSlide.links || [];
    const newLink = {
      id: Date.now(),
      title: presetTitle || 'کردنەوەی بەستەر',
      url: presetUrl || 'https://'
    };
    updateSlideLinks([...existing, newLink]);
  };

  const handleUpdateLinkItem = (linkIndex, field, value) => {
    const existing = [...(currentSlide.links || [])];
    if (!existing[linkIndex]) return;
    existing[linkIndex] = {
      ...existing[linkIndex],
      [field]: value
    };
    updateSlideLinks(existing);
  };

  const handleDeleteLinkItem = (linkIndex) => {
    const existing = [...(currentSlide.links || [])];
    const filtered = existing.filter((_, idx) => idx !== linkIndex);
    updateSlideLinks(filtered);
  };

  // Image Upload handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/competitions/upload-promo-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.url) {
        updateCurrentSlide('image_url', res.data.url);
        if (onShowToast) {
          onShowToast({ type: 'success', message: 'وێنەکە بە سەرکەوتوویی بارکرا!' });
        }
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: err.response?.data?.detail || err.message || 'نەتوانرا وێنەکە باربکرێت'
        });
      }
    } finally {
      setUploadingImage(false);
    }
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
      links: [
        { id: 1, title: 'کردنەوەی بەستەر', url: 'https://' }
      ],
      image_url: '',
      image_mode: 'side',
      bg_gradient: THEME_GRADIENTS[(slides.length) % THEME_GRADIENTS.length].gradient
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    if (onShowToast) onShowToast({ type: 'success', message: 'سلایدی نوێ زیادکرا' });
  };

  const handleMoveSlide = (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const updated = [...slides];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSlides(updated);
    setActiveSlideIndex(targetIndex);
    if (onShowToast) {
      onShowToast({
        type: 'info',
        message: `شوێنی سلایدەکە گۆڕدرا بۆ پلەی ${targetIndex + 1}`
      });
    }
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

  const renderPreviewLinkIcon = (link) => {
    const url = (link?.url || '').toLowerCase();
    const text = (link?.title || link?.text || '').toLowerCase();

    if (url.includes('wa.me') || url.includes('whatsapp') || text.includes('واتس') || text.includes('وەتس')) {
      return <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />;
    }
    if (url.includes('t.me') || url.includes('telegram') || text.includes('تێلیگرام')) {
      return <Send className="w-3.5 h-3.5 text-sky-300" />;
    }
    if (url.startsWith('tel:') || text.includes('پەیوەندی') || text.includes('تەلەفۆن')) {
      return <Phone className="w-3.5 h-3.5 text-amber-300" />;
    }
    if (url.includes('http://') || url.includes('https://')) {
      return <ExternalLink className="w-3.5 h-3.5 text-amber-300" />;
    }
    return <Globe className="w-3.5 h-3.5 text-amber-300" />;
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-bold">بارکردنی سلایدەکانی پلاتفۆرم...</span>
      </div>
    );
  }

  // Active links for preview
  const previewLinks = (currentSlide.links && currentSlide.links.length > 0)
    ? currentSlide.links.filter((l) => l && l.url && l.url.trim() !== '')
    : (currentSlide.link && currentSlide.link !== '#'
        ? [{ id: 'single', title: currentSlide.link_text || 'کردنەوەی بەستەر', url: currentSlide.link }]
        : []);

  const hasImage = Boolean(currentSlide.image_url && currentSlide.image_url.trim() !== '');
  const showBgImage = hasImage && (currentSlide.image_mode === 'background' || currentSlide.image_mode === 'both');
  const showSideImage = hasImage && currentSlide.image_mode !== 'background';

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>بەڕێوەبردن و بڵاوکردنەوەی سلایدەکانی پەڕەی سەرەکی</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            کۆنترۆڵی تەواوی نووسین، بەستەر، وێنە، ڕەنگ و ژمارەکان بکە و بە یەک کلیک بڵاوی بکەرەوە لەسەر پلاتفۆرم
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
            {s.image_url && <ImageIcon className="w-3 h-3 opacity-80" />}
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
          {/* Background Image Overlay (if active) */}
          {showBgImage && (
            <div
              className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30 pointer-events-none transition-all duration-500 scale-105"
              style={{ backgroundImage: `url(${getUploadUrl(currentSlide.image_url)})` }}
            />
          )}

          {/* Ambient Decorative Lighting */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between min-h-[170px] sm:min-h-[190px] space-y-4">
            
            {/* Top Tag & Emblem */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold shadow-sm">
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

            {/* Center Main Text & Side Image */}
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 my-1">
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-md break-words whitespace-pre-line">
                  {currentSlide.title || 'ناونیشانی سەرەکی سلاید لێرە دەردەکەوێت'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl font-medium break-words whitespace-pre-line">
                  {currentSlide.description || 'دەقی ڕوونکردنەوە و زانیاری زیاتر دەربارەی تاقیکردنەوە یان سپۆنسەر لێرەدا دەردەکەوێت.'}
                </p>
              </div>

              {showSideImage && (
                <div className="shrink-0 self-center sm:self-auto group/img">
                  <img
                    src={getUploadUrl(currentSlide.image_url)}
                    alt={currentSlide.title || 'Preview'}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-32 object-cover rounded-2xl border-2 border-white/30 shadow-2xl bg-black/30 backdrop-blur-sm"
                  />
                </div>
              )}
            </div>

            {/* Bottom Bar: Action links & Tag */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/15">
              <div className="flex flex-wrap items-center gap-2">
                {previewLinks.length > 0 ? (
                  previewLinks.map((lnk, idx) => (
                    <div
                      key={lnk.id || idx}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/15 text-white text-xs font-bold border border-white/20 shadow-md backdrop-blur-sm"
                    >
                      {renderPreviewLinkIcon(lnk)}
                      <span>{lnk.title || lnk.text || 'کردنەوەی بەستەر'}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[11px] text-white/70 font-medium">
                    {currentSlide.link_text || 'پلاتفۆرمی فەرمی KSC'}
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-white/80">
                {currentSlide.badge || 'KSC Platform'}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* EDITING FORM FOR CURRENT SLIDE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-black text-sm">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>دەستکاریکردنی سلایدی ژمارە {activeSlideIndex + 1}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Reorder Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 px-1.5 font-bold hidden sm:inline">شوێنی سلاید:</span>
              <button
                type="button"
                onClick={() => handleMoveSlide(activeSlideIndex, -1)}
                disabled={activeSlideIndex === 0}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title="پێشخستن"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                <span>پێشخستن</span>
              </button>

              <button
                type="button"
                onClick={() => handleMoveSlide(activeSlideIndex, 1)}
                disabled={activeSlideIndex === slides.length - 1}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                title="دواخستن"
              >
                <span>دواخستن</span>
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteSlide(activeSlideIndex)}
              disabled={slides.length <= 1}
              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-500/20 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>سڕینەوە</span>
            </button>
          </div>
        </div>

        {/* Language Tabs for Multilingual Slides */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400">زمانی نووسین / Language:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSlideLang('ku')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  slideLang === 'ku'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                کوردى (بنەڕەت)
              </button>
              <button
                type="button"
                onClick={() => setSlideLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  slideLang === 'en'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSlideLang('ar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  slideLang === 'ar'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                عربي
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            {slideLang === 'ku' ? 'نووسینی کوردی بۆ بینەرانی کوردی' : slideLang === 'en' ? 'English text for visitors when English is chosen' : 'النص العربي للزوار عند اختيار اللغة العربية'}
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Badge */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              نیشانەی سەرەوە (Badge / {slideLang === 'ku' ? 'کوردی' : slideLang === 'en' ? 'English' : 'عربي'}):
            </label>
            <input
              type="text"
              value={slideLang === 'ku' ? (currentSlide.badge || '') : (currentSlide['badge_' + slideLang] || '')}
              onChange={(e) => updateCurrentSlide(slideLang === 'ku' ? 'badge' : 'badge_' + slideLang, e.target.value)}
              placeholder={slideLang === 'ku' ? 'نموونە: ڕێنمایی تاقیکردنەوە، سپۆنسەری فەرمی' : slideLang === 'en' ? 'e.g. Official Sponsor, Exam Guide' : 'مثال: الراعي الرسمي، إرشادات الامتحان'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              dir={slideLang === 'en' ? 'ltr' : 'rtl'}
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
            ناونیشانی سەرەکیی سلاید (Main Title / {slideLang === 'ku' ? 'کوردی' : slideLang === 'en' ? 'English' : 'عربي'}):
          </label>
          <textarea
            rows={1}
            value={slideLang === 'ku' ? (currentSlide.title || '') : (currentSlide['title_' + slideLang] || '')}
            onChange={(e) => updateCurrentSlide(slideLang === 'ku' ? 'title' : 'title_' + slideLang, e.target.value)}
            placeholder={slideLang === 'ku' ? 'ناونیشانی سەرەکی سلاید لێرە بنووسە...' : slideLang === 'en' ? 'Enter slide main title in English...' : 'اكتب العنوان الرئيسي للشريحة بالعربية...'}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-400 leading-snug resize-y"
            dir={slideLang === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            دەقی ڕوونکردنەوە و زانیاری (Description / {slideLang === 'ku' ? 'کوردی' : slideLang === 'en' ? 'English' : 'عربي'}):
          </label>
          <textarea
            rows={3}
            value={slideLang === 'ku' ? (currentSlide.description || '') : (currentSlide['description_' + slideLang] || '')}
            onChange={(e) => updateCurrentSlide(slideLang === 'ku' ? 'description' : 'description_' + slideLang, e.target.value)}
            placeholder={slideLang === 'ku' ? 'ڕوونکردنەوەی تەواو لێرە بنووسە...' : slideLang === 'en' ? 'Enter detailed description in English...' : 'اكتب الوصف الكامل والتفاصيل بالعربية...'}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
            dir={slideLang === 'en' ? 'ltr' : 'rtl'}
          />
        </div>

        {/* ======================================================== */}
        {/* NEW FEATURE 1: IMAGE MANAGEMENT (وێنەی سلاید)           */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-sky-500/30 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
              <ImageIcon className="w-4 h-4" />
              <span>وێنەی سلاید (دانانی وێنە یان لۆگۆ یان باکگراوند)</span>
            </div>
            {currentSlide.image_url && (
              <button
                type="button"
                onClick={() => updateCurrentSlide('image_url', '')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>سڕینەوەی وێنە</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Button & Direct URL Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  بارکردنی فایل لە کۆمپیوتەر / مۆبایل:
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-sky-400" />
                  )}
                  <span>{uploadingImage ? 'بارکردنی وێنە...' : 'هەڵبژاردنی وێنە (Upload Image)'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  یان بەستەری ڕاستەوخۆی وێنە (Direct Image URL):
                </label>
                <input
                  type="text"
                  value={currentSlide.image_url || ''}
                  onChange={(e) => updateCurrentSlide('image_url', e.target.value)}
                  placeholder="https://example.com/photo.jpg یان /uploads/promo/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  dir="ltr"
                />
              </div>

              {/* Display mode */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  شێوازی دەرکەوتنی وێنە:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateCurrentSlide('image_mode', 'side')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      (currentSlide.image_mode || 'side') === 'side'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    وێنەی دەستەچەپ (Side)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentSlide('image_mode', 'background')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      currentSlide.image_mode === 'background'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    باکگراوند (Background)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateCurrentSlide('image_mode', 'both')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                      currentSlide.image_mode === 'both'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    هەردووکیان (Both)
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Preview Box */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 min-h-[140px]">
              {currentSlide.image_url ? (
                <div className="relative group/thumb flex flex-col items-center gap-2">
                  <img
                    src={getUploadUrl(currentSlide.image_url)}
                    alt="Current promo preview"
                    className="max-h-28 max-w-full rounded-xl object-contain border border-slate-700 shadow-lg"
                  />
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" dir="ltr">
                    {currentSlide.image_url}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5 text-center">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <span className="text-xs font-bold">هیچ وێنەیەک بۆ ئەم سلایدە دانەنراوە</span>
                  <span className="text-[11px] text-slate-500">دەتوانیت وێنەی ڕیکلام، سپۆنسەر یان لۆگۆ زیاد بکەیت</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NEW FEATURE 2: MULTIPLE LINKS (فرە بەستەر / Buttons)    */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-4 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
              <LinkIcon className="w-4 h-4" />
              <span>بەستەرەکان و دوگمەکان (زیاتر لەلینکێک / Multiple Links)</span>
            </div>

            <button
              type="button"
              onClick={() => handleAddLink()}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>زیادکردنی بەستەری نوێ</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-400 font-bold">زیادکردنی خێرا:</span>
            <button
              type="button"
              onClick={() => handleAddLink('وەتسئاپ', 'https://wa.me/')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>+ وەتسئاپ (WhatsApp)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('تێلیگرام', 'https://t.me/')}
              className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3 text-sky-400" />
              <span>+ تێلیگرام (Telegram)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('پەیوەندی تەلەفۆن', 'tel:0750')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>+ تەلەفۆن (Phone)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('سناپچات', 'https://www.snapchat.com/add/')}
              className="px-2.5 py-1 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3 fill-current text-yellow-400" viewBox="0 0 24 24">
                <path d="M12.016 2.013c-3.79 0-6.108 2.502-6.108 5.767 0 1.09.28 2.213.67 3.012.18.368.21.57.06.82-.18.3-.59.51-.88.66-.43.22-.9.41-1.34.66-.6.34-.84.77-.84 1.34 0 .97.86 1.62 1.76 1.83.47.11.96.12 1.44.15.35.02.5.15.54.49.07.61.27 1.15.7 1.6.58.6 1.38.86 2.18.99.37.06.67.2.82.55.22.52.62.8 1.18.8h.04c.56 0 .96-.28 1.18-.8.15-.35.45-.49.82-.55.8-.13 1.6-.39 2.18-.99.43-.45.63-.99.7-1.6.04-.34.19-.47.54-.49.48-.03.97-.04 1.44-.15.9-.21 1.76-.86 1.76-1.83 0-.57-.24-1-.84-1.34-.44-.25-.91-.44-1.34-.66-.29-.15-.7-.36-.88-.66-.15-.25-.12-.452.06-.82.39-.799.67-1.922.67-3.012 0-3.265-2.318-5.767-6.108-5.767z" />
              </svg>
              <span>+ سناپچات (Snapchat)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddLink('ماڵپەڕی فەرمی', 'https://')}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
            >
              <Globe className="w-3 h-3 text-purple-400" />
              <span>+ ماڵپەڕ (Website)</span>
            </button>
          </div>

          {/* Links List */}
          <div className="space-y-3">
            {(currentSlide.links && currentSlide.links.length > 0) ? (
              currentSlide.links.map((linkItem, lIdx) => (
                <div
                  key={linkItem.id || lIdx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 self-start sm:self-center">
                    {lIdx + 1}
                  </span>

                  {/* Link Text / Title */}
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      value={slideLang === 'ku' ? (linkItem.title || '') : (linkItem['title_' + slideLang] || '')}
                      onChange={(e) => handleUpdateLinkItem(lIdx, slideLang === 'ku' ? 'title' : 'title_' + slideLang, e.target.value)}
                      placeholder={slideLang === 'ku' ? 'دەقی دوگمە (وەتسئاپ / تێلیگرام)' : slideLang === 'en' ? 'Button Label (e.g. WhatsApp)' : 'نص الزر (مثال: تيليجرام)'}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      dir={slideLang === 'en' ? 'ltr' : 'rtl'}
                    />
                  </div>

                  {/* URL */}
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      value={linkItem.url || ''}
                      onChange={(e) => handleUpdateLinkItem(lIdx, 'url', e.target.value)}
                      placeholder="بەستەر (https://wa.me/... یان https://t.me/...)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      dir="ltr"
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteLinkItem(lIdx)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors self-end sm:self-center shrink-0"
                    title="سڕینەوەی ئەم بەستەرە"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                <p className="font-bold">هیچ بەستەرێک بۆ ئەم سلایدە زیاد نەکراوە.</p>
                <p className="text-[11px] text-slate-600">دەتوانیت دوگمەی "+ زیادکردنی بەستەری نوێ" دابگریت بۆ دانانی وەتسئاپ، تێلیگرام، ماڵپەڕ یان هەر بەستەرێکی تر.</p>
              </div>
            )}
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
