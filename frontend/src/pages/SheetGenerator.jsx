import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  FileDown,
  Layers,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  Building2,
  School,
  FileSpreadsheet,
  CheckCircle
} from 'lucide-react';
import api from '../api';

export default function SheetGenerator({ defaultExamId, onShowToast }) {
  const [exams, setExams] = useState([]);
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  const [previewError, setPreviewError] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [examsRes, schoolsRes, studentsRes] = await Promise.all([
        api.get('/exams/'),
        api.get('/classes/'),
        api.get('/students/')
      ]);
      setExams(examsRes.data);
      setSchools(schoolsRes.data);
      setStudents(studentsRes.data);
      if (!selectedExamId && examsRes.data.length > 0) {
        setSelectedExamId(examsRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let active = true;
    let currentObjectUrl = null;

    if (selectedExamId) {
      setPreviewLoading(true);
      setPreviewError(false);
      const params = new URLSearchParams();
      if (selectedStudentId) {
        params.append('student_id', selectedStudentId);
      }
      params.append('t', Date.now().toString());

      api.get(`/sheets/preview-image/${selectedExamId}?${params.toString()}`, {
        responseType: 'blob'
      }).then((res) => {
        if (!active) return;
        const blobUrl = URL.createObjectURL(res.data);
        currentObjectUrl = blobUrl;
        setPreviewUrl(blobUrl);
        setPreviewLoading(false);
      }).catch((err) => {
        if (!active) return;
        console.error("Preview load error:", err);
        setPreviewLoading(false);
        setPreviewError(true);
        if (onShowToast) {
          onShowToast({ type: 'error', message: 'نەتوانرا پەڕەی وەڵام پیشان بدرێت' });
        }
      });
    } else {
      setPreviewUrl('');
      setPreviewLoading(false);
    }

    return () => {
      active = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [selectedExamId, selectedStudentId]);

  // Filter students based on selected school
  const filteredStudents = selectedSchoolId
    ? students.filter((s) => s.class_id === parseInt(selectedSchoolId))
    : students;

  const handlePrint = () => {
    if (!previewUrl) return;

    // Open dedicated zero-margin strictly 1-page full A4 print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ckb">
        <head>
          <meta charset="utf-8">
          <title>چاپکردنی پەڕەی وەڵام - 1 لاپەڕەی A4</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0mm;
            }
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              width: 100%;
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background-color: #ffffff;
            }
            .page-container {
              width: 100vw;
              height: 100vh;
              max-width: 100vw;
              max-height: 100vh;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              page-break-inside: avoid;
              page-break-after: avoid;
              page-break-before: avoid;
              overflow: hidden;
            }
            img {
              width: 100%;
              height: 100%;
              max-width: 100%;
              max-height: 100%;
              object-fit: fill;
              display: block;
              margin: 0;
              padding: 0;
              page-break-inside: avoid;
            }
            @media print {
              html, body {
                width: 100%;
                height: 100%;
                overflow: hidden !important;
              }
              .page-container {
                width: 100%;
                height: 100%;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
              }
              img {
                width: 100%;
                height: 100%;
                page-break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <img src="${previewUrl}" onload="setTimeout(function(){ window.print(); }, 250);" />
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleOpenPdf = async () => {
    if (!selectedExamId) return;
    try {
      const params = new URLSearchParams();
      if (selectedStudentId) {
        params.append('student_id', selectedStudentId);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/sheets/download-pdf/${selectedExamId}${query}`, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `omr_sheet_${selectedExamId}${selectedStudentId ? `_${selectedStudentId}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      if (onShowToast) {
        onShowToast({ type: 'error', message: 'نەتوانرا فایلی PDF دابگیرێت' });
      }
    }
  };

  const handleBatchSchoolDownload = async () => {
    if (!selectedExamId) {
      if (onShowToast) onShowToast({ type: 'error', message: 'تکایە تاقیکردنەوە دیاریبکە' });
      return;
    }
    try {
      setBatchLoading(true);
      if (onShowToast) onShowToast({ type: 'success', message: 'دروستکردنی فایلی دەستەیی بۆ سەرجەم قوتابییان دەستیپێکرد...' });
      const params = new URLSearchParams();
      if (selectedSchoolId) {
        params.append('class_id', selectedSchoolId);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get(`/sheets/generate-batch-pdf/${selectedExamId}${query}`, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `omr_batch_exam_${selectedExamId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      if (onShowToast) onShowToast({ type: 'error', message: 'نەتوانرا فایلی دەستەیی دابگیرێت' });
    } finally {
      setBatchLoading(false);
    }
  };

  const selectedExam = exams.find((e) => e.id === parseInt(selectedExamId));
  const selectedSchool = schools.find((s) => s.id === parseInt(selectedSchoolId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Printer className="w-6 h-6 text-brand-600" />
            <span>بەرهەمهێنان و چاپکردنی پەڕەی وەڵامی ستاندارد (A4 OMR)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            چاپکردنی دەستەیی بۆ گشت قوتابخانە یان بە تاکی بۆ هەر قوتابییەک بە کۆدی QR و ناوی چاپکراو
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBatchSchoolDownload}
            disabled={!selectedExamId}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>چاپکردنی دەستەیی قوتابخانە (Batch PDF)</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!selectedExamId}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپکردنی ڕاستەوخۆ</span>
          </button>

          <button
            onClick={handleOpenPdf}
            disabled={!selectedExamId}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>بینینی فایلی PDF</span>
          </button>
        </div>
      </div>

      {/* Printing Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-emerald-950">
          <span className="font-bold block text-emerald-900">ڕێنمایی چاپکردن بۆ پەڕەی تەواوی A4:</span>
          <p className="leading-relaxed text-emerald-800">
            • لە پەنجەرەی پرینتەر: <strong className="mx-1 underline">قەبارەی پەڕە: A4</strong> | <strong className="mx-1 underline">Scale: 100% یان Actual Size</strong> | <strong className="mx-1 underline">Margins: None یان 0</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>هەڵبژاردنی تاقیکردنەوە و قوتابخانە</span>
              <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-bold">A4 OMR</span>
            </h3>

            {/* 1. Exam Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">تاقیکردنەوە *</label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exam_name} ({ex.number_of_questions} پرسیار - {ex.subject})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. School Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                قوتابخانەی دیاریکراو (بۆ چاپکردنی دەستەیی پۆل)
              </label>
              <select
                value={selectedSchoolId}
                onChange={(e) => {
                  setSelectedSchoolId(e.target.value);
                  setSelectedStudentId('');
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">هەموو قوتابخانەکان</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.student_count || 0} قوتابی)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Student Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ناوی قوتابی (تایبەت بە یەک پەڕە)</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="">پەڕەی بەتاڵی گشتی (قوتابی بە دەست پڕی دەکاتەوە)</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_id} - {s.name} {s.class_name ? `(${s.class_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Card for Batch Print */}
            <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>چاپکردنی بەکۆمەڵ:</span>
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {selectedSchoolId
                  ? `داگرتنی تەنها فایلی یەکگرتووی پەڕەکانی (${selectedSchool?.name || 'ئەم قوتابخانەیە'}) لەخۆدەگرێت (${filteredStudents.length} پەڕە).`
                  : `داگرتنی گشت پەڕەی وەڵامی قوتابییانی بەشداربوو (${students.length} لاپەڕە).`}
              </p>
              <button
                onClick={handleBatchSchoolDownload}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>داگرتنی فایلی PDF دەستەیی</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live A4 Sheet Preview Display */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col items-center justify-center min-h-[550px] relative overflow-hidden">
            {previewLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-xs z-10 space-y-3 rounded-xl">
                <div className="animate-spin w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full" />
                <span className="text-xs font-bold text-slate-300">دروستکردنی وێنەی ڕوونی A4 بە زمانی کوردی...</span>
              </div>
            )}

            {previewError ? (
              <div className="text-center py-20 px-4 text-slate-400 text-xs space-y-3">
                <p className="text-rose-400 font-bold">هەڵەیەک ڕوویدا لە بارکردنی پەڕەی وەڵام لە سێرڤەرەوە</p>
                <button
                  onClick={() => setSelectedExamId((prev) => prev)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors"
                >
                  دووبارە هەوڵبدەرەوە
                </button>
              </div>
            ) : previewUrl ? (
              <div className="w-full flex justify-center overflow-auto max-h-[800px] p-2 relative">
                <img
                  src={previewUrl}
                  alt="A4 OMR Sheet Preview"
                  className="max-w-full h-auto object-contain rounded-xl shadow-2xl bg-white border border-slate-300"
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewLoading(false);
                    setPreviewError(true);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                تاقیکردنەوەیەک هەڵبژێرە بۆ بینینی پەڕەی وەڵامی ستاندارد
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
