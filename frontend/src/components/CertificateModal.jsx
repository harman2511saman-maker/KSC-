import React, { useRef, useState } from 'react';
import { X, Download, Printer, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function CertificateModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const { lang, isRTL, t, translateStudent, translateSchool, translateExam, translateSubj } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  // Fallback data
  const {
    certificate_id = 'KSC-CERT-001',
    title = 'بڕوانامەی ڕێزلێنان و سەرکەوتن',
    appreciation_text = 'بە بۆنەی بەشداریکردنی کارا و بەدەستهێنانی پلەی شایستە لە پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان',
    student_name = 'قوتابیی بەڕێز',
    school_name = 'قوتابخانە',
    grade = 'پۆل',
    exam_name = 'تاقیکردنەوەی فەرمی',
    subject = 'وانە',
    percentage = 100,
    overall_rank = 1,
    total_participants = 100,
    signee_name = 'سەرپەرشتیاری گشتیی KSC',
    signee_title = 'لیژنەی باڵای هەڵسەنگاندن و تاقیکردنەوەکان',
    date = new Date().toLocaleDateString('ku-IQ')
  } = data;

  const displayName = data.is_school ? translateSchool(school_name) : translateStudent(student_name);
  const displaySchool = translateSchool(school_name);
  const displayExam = translateExam(exam_name);
  const displaySubject = translateSubj(subject);

  // Generate and Download Canvas PNG
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      // 1. Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1920, 1080);
      bgGrad.addColorStop(0, '#060a14');
      bgGrad.addColorStop(0.5, '#0b1325');
      bgGrad.addColorStop(1, '#070b16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1920, 1080);

      // 2. Golden Ornamental Borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(50, 50, 1820, 980);

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(65, 65, 1790, 950);

      // 3. Header Logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = '/logo.png';
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });

      if (logoImg.width > 0) {
        const logoH = 150;
        const logoW = (logoImg.width / logoImg.height) * logoH;
        ctx.drawImage(logoImg, (1920 - logoW) / 2, 90, logoW, logoH);
      }

      // 4. Texts
      ctx.textAlign = 'center';
      ctx.direction = 'rtl';

      // Title
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 54px Vazirmatn, Arial, sans-serif';
      ctx.fillText(title, 960, 310);

      // Subtitle
      ctx.fillStyle = '#94a3b8';
      ctx.font = '26px Vazirmatn, Arial, sans-serif';
      ctx.fillText('پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC)', 960, 355);

      // Intro
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '28px Vazirmatn, Arial, sans-serif';
      ctx.fillText(
        data.is_school
          ? 'ئەم بڕوانامەیە بە شانازییەوە دەبەخشرێت بە دەستەی کارگێڕی و مامۆستایانی قوتابخانەی:'
          : 'ئەم بڕوانامەیە بە شانازییەوە دەبەخشرێت بە قوتابیی شایستە:',
        960,
        430
      );

      // Recipient Name (Prominent Gold)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 60px Vazirmatn, Arial, sans-serif';
      ctx.fillText(data.is_school ? `قوتابخانەی ${school_name}` : student_name, 960, 510);

      // School & Grade or School Rank
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 30px Vazirmatn, Arial, sans-serif';
      ctx.fillText(
        data.is_school
          ? `پلەی #${overall_rank} لەسەر ئاستی سەرجەم قوتابخانەکانی کوردستان • ${exam_name}`
          : `لە ${school_name} • ${grade}`,
        960,
        565
      );

      // Appreciation Text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '28px Vazirmatn, Arial, sans-serif';
      ctx.fillText(appreciation_text, 960, 640);

      // Metric Badge Box in center
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(520, 685, 880, 95, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Vazirmatn, Arial, sans-serif';
      ctx.fillText(
        data.is_school
          ? `تێکڕای نمرە: %${percentage}   |   پلەی #${overall_rank} ی سەرکەوتن   |   ${total_participants} قوتابیی بەشداربوو`
          : `ڕێژەی بەدەستهاتوو: %${percentage}   |   پلەی #${overall_rank} لەسەر ئاستی کوردستان`,
        960,
        745
      );

      // Footer: Date & Certificate ID
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px Vazirmatn, Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`بەروار: ${date}`, 1750, 930);
      ctx.fillText(`کۆدی بڕوانامە: ${certificate_id}`, 1750, 965);

      // Footer: Signee & Committee
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 26px Vazirmatn, Arial, sans-serif';
      ctx.fillText(signee_name, 170, 925);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px Vazirmatn, Arial, sans-serif';
      ctx.fillText(signee_title, 170, 965);

      // Trigger Download
      const link = document.createElement('a');
      const filename = data.is_school
        ? `KSC_School_Certificate_${school_name.replace(/\s+/g, '_')}.png`
        : `KSC_Student_Certificate_${student_name.replace(/\s+/g, '_')}.png`;
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Certificate render error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 relative text-right text-white max-h-[96vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Award className="w-5 h-5 text-amber-400" />
            <span>بڕوانامەی فەرمیی پشتڕاستکراوی KSC</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Display Area */}
        <div
          ref={certRef}
          id="ksc-certificate-printable"
          className="my-4 p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-[#060a14] via-[#0b1325] to-[#070b16] border-2 border-amber-500/80 shadow-2xl relative text-center overflow-hidden"
        >
          {/* Ornamental Inner Golden Border */}
          <div className="absolute inset-2 sm:inset-3 border border-amber-400/40 rounded-xl pointer-events-none" />

          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo */}
          <img
            src="/logo.png"
            alt="KSC Emblem"
            className="h-16 sm:h-20 w-auto object-contain mx-auto mb-3 drop-shadow-md relative z-10"
          />

          {/* Title */}
          <h2 className="text-xl sm:text-3xl font-black text-amber-400 drop-shadow-sm tracking-tight relative z-10">
            {title}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-1 relative z-10">
            پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC)
          </p>

          <div className="my-5 space-y-2 relative z-10">
            <p className="text-xs sm:text-sm text-slate-300">
              {data.is_school
                ? 'ئەم بڕوانامەیە بە شانازییەوە پێشکەش دەکرێت بە دەستەی کارگێڕی و مامۆستایانی قوتابخانەی:'
                : 'ئەم بڕوانامەیە بە شانازییەوە پێشکەش دەکرێت بە قوتابیی شایستە:'}
            </p>
            <h3 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md py-1">
              {data.is_school ? displayName : displayName}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-sky-400">
              {data.is_school
                ? `پلەی #${overall_rank} لەسەر ئاستی سەرجەم قوتابخانەکانی کوردستان • ${displayExam}`
                : `لە ${displaySchool} • ${grade}`}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed relative z-10 my-4">
            {appreciation_text}
          </p>

          {/* Results Badge */}
          <div className="inline-flex items-center gap-4 sm:gap-8 px-6 py-2.5 rounded-2xl bg-slate-900/90 border border-amber-400/50 text-white text-xs sm:text-sm font-bold shadow-lg relative z-10 my-2">
            <div>
              <span className="text-slate-400 block text-[10px]">
                {data.is_school ? 'تێکڕای نمرە' : 'ڕێژەی نمرە'}
              </span>
              <span className="text-amber-400 text-base font-black">%{percentage}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">پلەی سەرکەوتن</span>
              <span className="text-emerald-400 text-base font-black">پلەی #{overall_rank}</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">
                {data.is_school ? 'قوتابییانی بەشداربوو' : 'بەشداربووان'}
              </span>
              <span className="text-sky-400 text-base font-black">
                {total_participants} {data.is_school && data.passed_count ? `(${data.passed_count} دەرچوو)` : ''}
              </span>
            </div>
          </div>

          {/* Footer of the Certificate */}
          <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 relative z-10">
            <div className="text-right space-y-0.5">
              <span className="block font-mono text-[11px] text-slate-500">کۆد: {certificate_id}</span>
              <span>بەروار: {date}</span>
            </div>

            <div className="text-center sm:text-left space-y-0.5">
              <span className="block font-bold text-amber-400">{signee_name}</span>
              <span className="block text-[11px] text-slate-400">{signee_title}</span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all"
          >
            داخستن
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردن / PDF</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'دروستکردنی وێنە...' : 'داگرتن وەک وێنە (PNG)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
