import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sparkles,
  Eye,
  Sliders,
  Layers,
  ArrowLeft,
  XCircle,
  HelpCircle,
  SwitchCamera,
  Zap,
  ZapOff,
  Radio,
  Clock,
  User,
  Award,
  ChevronRight,
  Trash2,
  Check
} from 'lucide-react';
import api, { getUploadUrl } from '../api';
import Modal from '../components/Modal';

// Audio feedback helper using standard Web Audio API
const playSuccessBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {
    // Non-fatal if audio autoplay restricted
  }
};

export default function Scanner({ defaultExamId, onShowToast, onNavigateToReview, onNavigateToResults }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload'
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [loading, setLoading] = useState(false);

  // Live Auto-Scan & Camera State
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(true);
  const [scanSuccessFlash, setScanSuccessFlash] = useState(false);
  const [cameraFeedback, setCameraFeedback] = useState('پەڕەکە لە ناو چوارچێوەکە ڕێکبخە');

  // Floating Live Result Overlay for Rapid Continuous Scanning
  const [liveQuickResult, setLiveQuickResult] = useState(null);
  const [scannedSessionHistory, setScannedSessionHistory] = useState([]);
  const [acceptedSheetKeys, setAcceptedSheetKeys] = useState(new Set());

  // Step-by-Step Acceptance Mode (Pauses upon QR detection to confirm before next scan)
  const [requireAcceptance, setRequireAcceptance] = useState(true);
  const [pendingAcceptanceResult, setPendingAcceptanceResult] = useState(null);

  // Auto-scan lock to prevent spamming while one sheet is being evaluated
  const isAutoScanningRef = useRef(false);
  const lastScannedSheetRef = useRef(null);
  const lastScannedTimeRef = useRef(0);

  // File Upload State
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [batchJob, setBatchJob] = useState(null);

  // Processed Result Detailed Modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams/');
      setExams(res.data);
      if (!selectedExamId && res.data.length > 0) {
        setSelectedExamId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Camera Initialization & Stream Handling with Robust Mobile Fallback
  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('کامێرا لەم پەیوەندییەدا بەردەست نییە (پێویستی بە مۆڵەت یان HTTPS هەیە)');
      }

      let stream = null;
      const isPortrait = window.innerHeight > window.innerWidth;
      const facing = facingMode === 'environment' ? { ideal: 'environment' } : 'user';

      // Tier 1: High definition resolution optimized for portrait/landscape A4 scanning
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: isPortrait ? 2160 : 3840, min: 1080 },
            height: { ideal: isPortrait ? 3840 : 2160, min: 1080 },
          },
          audio: false,
        });
      } catch (e1) {
        // Tier 2: Flexible HD constraint without min limits
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing,
              width: { ideal: 1920 },
              height: { ideal: 1920 },
            },
            audio: false,
          });
        } catch (e2) {
          // Tier 3: Basic generic video constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play deferred', playErr);
        }
        setCameraActive(true);
        setCameraFeedback('پەڕەکە لە ناو چوارچێوەکە ڕێکبخە');

        // Apply continuous autofocus, auto exposure and white balance for sharp document capture
        const track = stream.getVideoTracks()[0];
        if (track && track.applyConstraints) {
          try {
            await track.applyConstraints({
              advanced: [
                { focusMode: 'continuous' },
                { exposureMode: 'continuous' },
                { whiteBalanceMode: 'continuous' }
              ]
            });
          } catch (advErr) {
            // Non-fatal if unsupported by device
          }
        }

        // Check torch capabilities
        const capabilities = track?.getCapabilities ? track.getCapabilities() : {};
        setHasTorchSupport(Boolean(capabilities.torch));
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraActive(false);
      setCameraFeedback('نەتوانرا دەستگەیشتن بە کامێرا بکرێت. تکایە مۆڵەتی کامێرا بدە.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeMode, facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const track = videoRef.current.srcObject.getVideoTracks()[0];
        const nextState = !torchOn;
        await track.applyConstraints({ advanced: [{ torch: nextState }] });
        setTorchOn(nextState);
      }
    } catch (e) {
      console.warn('Torch failed', e);
    }
  };

  // High-Performance Snapshot Capture from Video Stream with Adaptive Downscaling
  const captureBlobFromVideo = useCallback((isQuickAuto = false) => {
    return new Promise((resolve) => {
      if (!videoRef.current) return resolve(null);
      const video = videoRef.current;
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
        return resolve(null);
      }
      const rawWidth = video.videoWidth;
      const rawHeight = video.videoHeight;

      // Smart downscaling for ultra-fast upload & processing (<100ms) with zero accuracy loss
      const maxDim = isQuickAuto ? 1280 : 1920;
      let targetWidth = rawWidth;
      let targetHeight = rawHeight;
      if (rawWidth > maxDim || rawHeight > maxDim) {
        if (rawWidth > rawHeight) {
          targetWidth = maxDim;
          targetHeight = Math.round((rawHeight * maxDim) / rawWidth);
        } else {
          targetHeight = maxDim;
          targetWidth = Math.round((rawWidth * maxDim) / rawHeight);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
      if (!ctx) return resolve(null);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        isQuickAuto ? 0.82 : 0.88
      );
    });
  }, []);

  // Multi-image / PDF Batch upload state
  const [uploadProgress, setUploadProgress] = useState(null); // { total: 5, current: 2, successful: 2, failed: 0 }

  const uploadAndProcessBlob = async (blobOrFile, filename, isAutoScan = false) => {
    if (isAutoScan) {
      isAutoScanningRef.current = true;
    } else {
      setLoading(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', blobOrFile, filename);
      if (selectedExamId) {
        formData.append('exam_id', selectedExamId);
      }

      // Check if it's a PDF
      if (filename.toLowerCase().endsWith('.pdf')) {
        const res = await api.post('/scan/batch-pdf', formData);
        setBatchJob(res.data);
        onShowToast({ type: 'success', message: res.data.message_ku });
        pollBatchJob(res.data.job_id);
      } else {
        const res = await api.post('/scan/process-single', formData);
        if (res.data && res.data.success) {
          const studentCode = res.data.resolved_student?.student_id || res.data.data?.sheet_id || (res.data.resolved_student?.id ? `STD-${res.data.resolved_student.id}` : null);
          const sheetKey = studentCode || `SHEET-${res.data.data?.sheet_id || Date.now()}`;
          const now = Date.now();

          // Check if this sheet was ALREADY accepted in the current session
          if (acceptedSheetKeys.has(sheetKey)) {
            if (isAutoScan) {
              setCameraFeedback(`ئەم پەڕەیە پێشتر تۆمارکراوە (${res.data.resolved_student?.name || sheetKey}) - پەڕەی دواتر دابنێ`);
              return;
            } else {
              onShowToast({
                type: 'info',
                message: `ئەم پەڕەیە پێشتر لەم دانیشتنەدا تۆمارکراوە (${res.data.resolved_student?.name || sheetKey})`,
              });
            }
          }

          // If auto-scan is scanning the exact same sheet within 3 seconds, ignore repeated trigger
          if (isAutoScan && lastScannedSheetRef.current === sheetKey && now - lastScannedTimeRef.current < 3000) {
            return;
          }

          lastScannedSheetRef.current = sheetKey;
          lastScannedTimeRef.current = now;

          // Play Audio Beep & Flash Green
          playSuccessBeep();
          setScanSuccessFlash(true);
          setTimeout(() => setScanSuccessFlash(false), 900);

          setScanResult(res.data);

          // Fast Live Overlay Result
          const quickData = {
            sessionKey: sheetKey,
            studentName: res.data.resolved_student?.name || 'قوتابی نادیار',
            studentCode: res.data.resolved_student?.student_id || res.data.data?.sheet_id || '—',
            schoolName: res.data.resolved_student?.school_class?.name || res.data.resolved_exam?.school_class?.name || '—',
            examName: res.data.resolved_exam?.exam_name || 'تاقیکردنەوە',
            totalScore: res.data.data?.summary?.total_score,
            maxScore: res.data.data?.summary?.max_possible_score,
            percentage: res.data.data?.summary?.percentage,
            passed: res.data.data?.summary?.passed,
            needsReview: res.data.overall_status === 'NEEDS_REVIEW',
            correctCount: res.data.data?.summary?.correct_count,
            incorrectCount: res.data.data?.summary?.incorrect_count,
            blankCount: res.data.data?.summary?.blank_count,
            multipleCount: res.data.data?.summary?.multiple_count || 0,
            timestamp: new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            raw: res.data
          };

          if (requireAcceptance) {
            // In Acceptance Mode: Hold result and wait for user's confirmation before moving to next sheet
            setPendingAcceptanceResult(quickData);
          } else {
            // Rapid continuous auto mode
            setAcceptedSheetKeys((prev) => new Set([...prev, sheetKey]));
            setLiveQuickResult(quickData);
            setScannedSessionHistory((prev) => [quickData, ...prev.filter((it) => it.sessionKey !== sheetKey)]);
            if (!isAutoScan) {
              setResultModalOpen(true);
            }
            onShowToast({
              type: res.data.data?.summary?.passed ? 'success' : 'warning',
              message: `سەرکەوتوو: نمرەی ${quickData.studentName} بریتییە لە ${quickData.percentage}%`,
            });
          }
        } else {
          if (isAutoScan) {
            if (res.data?.message_ku) {
              setCameraFeedback(res.data.message_ku);
            }
          } else {
            onShowToast({ type: 'error', message: res.data?.message_ku || 'پەڕەکە بە تەواوی نەخوێندرایەوە' });
          }
        }
      }
    } catch (err) {
      console.warn('Scan request error:', err);
      if (isAutoScan) {
        setCameraFeedback('پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو یان وێنەکە ڕوون نییە');
      } else {
        onShowToast({ type: 'error', message: err.message || 'هەڵە لە ناردنی وێنە بۆ سێرڤەر' });
      }
    } finally {
      if (isAutoScan) {
        isAutoScanningRef.current = false;
      } else {
        setLoading(false);
      }
    }
  };

  const handleAcceptAndNext = () => {
    if (!pendingAcceptanceResult) return;
    const accepted = pendingAcceptanceResult;
    setAcceptedSheetKeys((prev) => new Set([...prev, accepted.sessionKey]));
    setScannedSessionHistory((prev) => [accepted, ...prev.filter((it) => it.sessionKey !== accepted.sessionKey)]);
    setLiveQuickResult(accepted);
    setPendingAcceptanceResult(null);
    setScanSuccessFlash(true);
    setTimeout(() => setScanSuccessFlash(false), 700);
    onShowToast({
      type: accepted.passed ? 'success' : 'warning',
      message: `تۆمارکرا: نمرەی ${accepted.studentName} بریتییە لە ${accepted.percentage}%`,
    });
  };

  const handleDiscardAndRescan = () => {
    setPendingAcceptanceResult(null);
    lastScannedSheetRef.current = null;
  };

  const handleDeleteFromSession = (sessionKey, studentName, e) => {
    if (e) e.stopPropagation();
    setAcceptedSheetKeys((prev) => {
      const next = new Set(prev);
      next.delete(sessionKey);
      return next;
    });
    setScannedSessionHistory((prev) => prev.filter((it) => it.sessionKey !== sessionKey));
    if (lastScannedSheetRef.current === sessionKey) {
      lastScannedSheetRef.current = null;
    }
    onShowToast({
      type: 'info',
      message: `پەڕەی ${studentName || sessionKey} لە دانیشتن سڕایەوە؛ ئێستا دەتوانیت دووبارە سکانی بکەیتەوە.`,
    });
  };

  // Continuous Live Auto-Scan Loop
  useEffect(() => {
    let timerId = null;
    let isCancelled = false;

    const tick = async () => {
      if (isCancelled) return;
      if (
        activeMode === 'camera' &&
        cameraActive &&
        autoScanEnabled &&
        !pendingAcceptanceResult &&
        !isAutoScanningRef.current &&
        !loading
      ) {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const blob = await captureBlobFromVideo(true);
          if (blob && !isCancelled) {
            await uploadAndProcessBlob(blob, 'live_autoscan.jpg', true);
          }
        }
      }
      if (!isCancelled && activeMode === 'camera' && cameraActive && autoScanEnabled && !pendingAcceptanceResult) {
        timerId = setTimeout(tick, 700);
      }
    };

    if (activeMode === 'camera' && cameraActive && autoScanEnabled && !pendingAcceptanceResult) {
      timerId = setTimeout(tick, 700);
    }

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeMode, cameraActive, autoScanEnabled, pendingAcceptanceResult, loading, captureBlobFromVideo]);

  // Manual Trigger with Hardware Still Shot or Canvas Grab
  const handleManualCapture = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let blob = null;
      if (videoRef.current && videoRef.current.srcObject) {
        const track = videoRef.current.srcObject.getVideoTracks()[0];
        if (track && window.ImageCapture) {
          try {
            const imageCapture = new window.ImageCapture(track);
            blob = await imageCapture.takePhoto();
          } catch (icErr) {
            console.warn('ImageCapture fallback to canvas:', icErr);
          }
        }
      }
      if (!blob) {
        blob = await captureBlobFromVideo(false);
      }
      if (blob) {
        await uploadAndProcessBlob(blob, 'camera_capture.jpg', false);
      } else {
        setLoading(false);
        onShowToast({ type: 'error', message: 'نەتوانرا وێنە لە کامێرا وەربگیرێت' });
      }
    } catch (err) {
      setLoading(false);
      onShowToast({ type: 'error', message: err.message });
    }
  };

  // Batch Job Poller for Multi-Page PDF
  const pollBatchJob = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/scan/job-status/${jobId}`);
        setBatchJob(res.data);
        if (res.data.is_finished) {
          clearInterval(interval);
          onShowToast({
            type: 'success',
            message: `خوێندنەوەی دەستەیی تەواوبوو: ${res.data.successful_pages} سەرکەوتوو ، ${res.data.needs_review_pages} پێویستی بە دوو وەڵام یان پێداچوونەوە`,
          });
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 1500);
  };

  // Batch Multi-Image or Single File Upload Handler
  const handleFilesUpload = async (filesList) => {
    if (!filesList || filesList.length === 0) return;

    // If single PDF file
    if (filesList.length === 1 && filesList[0].name.toLowerCase().endsWith('.pdf')) {
      uploadAndProcessBlob(filesList[0], filesList[0].name, false);
      return;
    }

    // If multiple files or single image
    const total = filesList.length;
    if (total === 1) {
      uploadAndProcessBlob(filesList[0], filesList[0].name, false);
      return;
    }

    // Process multiple images sequentially
    setLoading(true);
    setUploadProgress({ total, current: 0, successful: 0, failed: 0 });

    let successfulCount = 0;
    let failedCount = 0;

    for (let i = 0; i < total; i++) {
      const file = filesList[i];
      setUploadProgress({
        total,
        current: i + 1,
        successful: successfulCount,
        failed: failedCount,
        currentFileName: file.name
      });

      try {
        const formData = new FormData();
        formData.append('file', file, file.name);
        if (selectedExamId) {
          formData.append('exam_id', selectedExamId);
        }

        const res = await api.post('/scan/process-single', formData);
        if (res.data && res.data.success) {
          successfulCount++;
          const studentCode = res.data.resolved_student?.student_id || res.data.data?.sheet_id || (res.data.resolved_student?.id ? `STD-${res.data.resolved_student.id}` : null);
          const sheetKey = studentCode || `SHEET-${res.data.data?.sheet_id || Date.now()}`;

          setAcceptedSheetKeys((prev) => new Set([...prev, sheetKey]));

          const quickData = {
            sessionKey: sheetKey,
            studentName: res.data.resolved_student?.name || 'قوتابی نادیار',
            studentCode: res.data.resolved_student?.student_id || res.data.data?.sheet_id || '—',
            schoolName: res.data.resolved_student?.school_class?.name || res.data.resolved_exam?.school_class?.name || '—',
            examName: res.data.resolved_exam?.exam_name || 'تاقیکردنەوە',
            totalScore: res.data.data?.summary?.total_score,
            maxScore: res.data.data?.summary?.max_possible_score,
            percentage: res.data.data?.summary?.percentage,
            passed: res.data.data?.summary?.passed,
            needsReview: res.data.overall_status === 'NEEDS_REVIEW',
            correctCount: res.data.data?.summary?.correct_count,
            incorrectCount: res.data.data?.summary?.incorrect_count,
            blankCount: res.data.data?.summary?.blank_count,
            multipleCount: res.data.data?.summary?.multiple_count || 0,
            timestamp: new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            raw: res.data
          };

          setScannedSessionHistory((prev) => [quickData, ...prev.filter((it) => it.sessionKey !== sheetKey)]);
        } else {
          failedCount++;
        }
      } catch (e) {
        failedCount++;
      }
    }

    setLoading(false);
    setUploadProgress(null);

    onShowToast({
      type: successfulCount > 0 ? 'success' : 'error',
      message: `بارکردنی دەستەیی وێنەکان تەواوبوو: ${successfulCount} سەرکەوتوو ، ${failedCount} هەڵە`,
    });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(Array.from(files));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(Array.from(files));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">سکانکردن و خوێندنەوەی پەڕەی وەڵام</h2>
            {autoScanEnabled && activeMode === 'camera' && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                <Radio className="w-3 h-3 text-emerald-600 animate-spin" />
                لایڤ چالاکە
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            سکانی ڕاستەوخۆ بە کامێرای مۆبایل بە خێرایی و بێ هەڵە، یان بارکردنی وێنە و فایلی PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Acceptance Mode Toggle */}
          <button
            onClick={() => setRequireAcceptance(!requireAcceptance)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              requireAcceptance
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="کاتێک پەڕەیەک دەناسرێتەوە، پیشانی دەدات و چاوەڕوانی ئەکسێپتی تۆ دەکات پێش ئەوەی بچێتە سەر پەڕەی دواتر"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${requireAcceptance ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{requireAcceptance ? 'ئەکسێپت پێش پەڕەی دواتر: چالاکە' : 'سکانی ئۆتۆماتیکی بەردەوام'}</span>
          </button>

          {/* Exam Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">تاقیکردنەوە:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="">دۆزینەوە بەپێی کۆدی QR سەر پەڕە</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switch Buttons */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveMode('camera')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'camera'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-brand-600" />
              <span>کامێرا</span>
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'upload'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              <span>بارکردنی فایل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Content */}
      {activeMode === 'camera' ? (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[520px]">
            {/* Unconditionally Mounted Video Element for Live Camera Stream (object-contain ensures full A4 sheet is never cropped on mobile) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              webkit-playsinline="true"
              x5-playsinline="true"
              muted
              className={`w-full max-h-[640px] object-contain transition-opacity duration-300 ${
                cameraActive ? 'block opacity-100' : 'hidden opacity-0'
              }`}
            />

            {/* Fallback View when camera stream is not yet active */}
            {!cameraActive && (
              <div className="p-6 sm:p-10 text-center max-w-lg space-y-6 text-slate-200 w-full flex flex-col items-center">
                {/* 4 Corner Markers Preview HUD */}
                <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-500/40 bg-slate-900/60 p-4 flex flex-col items-center justify-center space-y-3">
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-amber-400 rounded-tr-md" />
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-amber-400 rounded-tl-md" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-amber-400 rounded-br-md" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-amber-400 rounded-bl-md" />

                  {/* Pulsing Center Camera Button */}
                  <label className="relative group cursor-pointer">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500 to-brand-500 blur-md opacity-70 group-hover:opacity-100 animate-pulse transition-opacity" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
                      <Camera className="w-10 h-10" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadAndProcessBlob(file, file.name, false);
                        }
                      }}
                    />
                  </label>

                  <div className="space-y-1 text-center">
                    <span className="text-sm font-extrabold text-white block">
                      کلیک لێرە بکە بۆ وێنەگرتنی پەڕە
                    </span>
                    <span className="text-[11px] text-amber-300 font-semibold block">
                      کامێرای مۆبایل بە ڕوونی تەواو و خێرایی زۆر
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                  <button
                    onClick={startCamera}
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white px-6 py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-brand-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>کردنەوەی کامێرای ڕاستەوخۆ (لایڤ)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Alignment Overlay & 4 Corner Brackets */}
            {cameraActive && !pendingAcceptanceResult && (
              <div
                className={`absolute inset-6 sm:inset-10 border-2 rounded-2xl pointer-events-none flex flex-col justify-between p-4 transition-all duration-300 ${
                  scanSuccessFlash
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_40px_rgba(52,211,153,0.5)]'
                    : 'border-brand-400/40'
                }`}
              >
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className={`w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${scanSuccessFlash ? 'border-emerald-400' : 'border-brand-400'}`} />
                  <div className={`w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${scanSuccessFlash ? 'border-emerald-400' : 'border-brand-400'}`} />
                </div>

                {/* Animated Laser Scan Line */}
                <div className="relative w-full h-full overflow-hidden">
                  <div className="absolute w-full h-1 scanner-laser" />
                </div>

                <div className="flex justify-between">
                  <div className={`w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${scanSuccessFlash ? 'border-emerald-400' : 'border-brand-400'}`} />
                  <div className={`w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${scanSuccessFlash ? 'border-emerald-400' : 'border-brand-400'}`} />
                </div>
              </div>
            )}

            {/* Top Feedback / Status Pill */}
            {cameraActive && !pendingAcceptanceResult && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 z-10 max-w-[92vw] text-center">
                {autoScanEnabled ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-emerald-300 font-bold truncate">
                      {cameraFeedback && cameraFeedback !== 'پەڕەکە لە ناو چوارچێوەکە ڕێکبخە'
                        ? cameraFeedback
                        : 'هەر ٤ گۆشە ڕەشەکە و بارکۆدەکەی سەرەوە بخەرە چوارچێوەکە'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{cameraFeedback}</span>
                  </>
                )}
              </div>
            )}

            {/* Active Acceptance Card: Pauses scan and awaits user acceptance before moving to next sheet */}
            {cameraActive && pendingAcceptanceResult && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 block">پەڕەی وەڵام خوێندرایەوە</span>
                        <h3 className="text-base font-extrabold text-white truncate max-w-[200px]">
                          {pendingAcceptanceResult.studentName}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-xl border ${
                        pendingAcceptanceResult.passed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {pendingAcceptanceResult.passed ? 'دەرچوو' : 'کەوتوو'}
                    </span>
                  </div>

                  {/* Info & Score Box */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">کۆدی ناسینەوە / بارکۆد:</span>
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        {pendingAcceptanceResult.studentCode}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">نمرەی بەدەستهاتوو:</span>
                      <span className="text-base font-black text-white">
                        {pendingAcceptanceResult.totalScore} / {pendingAcceptanceResult.maxScore}{' '}
                        <span className="text-xs text-amber-400">({pendingAcceptanceResult.percentage}%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Answers summary grid */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-emerald-300">
                      <span className="font-black text-sm block">{pendingAcceptanceResult.correctCount}</span>
                      <span>دروست</span>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-rose-300">
                      <span className="font-black text-sm block">{pendingAcceptanceResult.incorrectCount}</span>
                      <span>هەڵە</span>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-slate-300">
                      <span className="font-black text-sm block">{pendingAcceptanceResult.blankCount}</span>
                      <span>بەتاڵ</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-amber-300">
                      <span className="font-black text-sm block">{pendingAcceptanceResult.multipleCount}</span>
                      <span>دوو وەڵام</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={handleAcceptAndNext}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>ئەکسێپت و سکانی پەڕەی دواتر</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setScanResult(pendingAcceptanceResult.raw);
                          setResultModalOpen(true);
                        }}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>بینینی وەڵامەکان</span>
                      </button>
                      <button
                        onClick={handleDiscardAndRescan}
                        className="py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>دووبارە سکانکردنەوە</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instant Floating Live Result Card (Appears in continuous mode) */}
            {cameraActive && !requireAcceptance && liveQuickResult && (
              <div className="absolute top-14 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-80 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl text-white z-20 animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-xs text-white truncate max-w-[140px]">
                      {liveQuickResult.studentName}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      liveQuickResult.passed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {liveQuickResult.percentage}% ({liveQuickResult.passed ? 'دەرچوو' : 'کەوتوو'})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] py-2">
                  <div className="bg-emerald-500/10 rounded-lg p-1 text-emerald-300">
                    <span className="font-black block text-xs">{liveQuickResult.correctCount}</span>
                    <span>دروست</span>
                  </div>
                  <div className="bg-rose-500/10 rounded-lg p-1 text-rose-300">
                    <span className="font-black block text-xs">{liveQuickResult.incorrectCount}</span>
                    <span>هەڵە</span>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-1 text-slate-300">
                    <span className="font-black block text-xs">{liveQuickResult.blankCount}</span>
                    <span>بەتاڵ</span>
                  </div>
                  <div className="bg-amber-500/10 rounded-lg p-1 text-amber-300">
                    <span className="font-black block text-xs">{liveQuickResult.multipleCount}</span>
                    <span>دوو وەڵام</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400 text-[10px]">{liveQuickResult.timestamp}</span>
                  <button
                    onClick={() => {
                      setScanResult(liveQuickResult.raw);
                      setResultModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 text-xs"
                  >
                    <span>وردەکاری</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Floating Camera Controls Bar */}
            <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-3 sm:gap-4 px-4 z-10">
              {/* Torch Toggle */}
              {hasTorchSupport && (
                <button
                  onClick={toggleTorch}
                  title={torchOn ? 'کوژاندنەوەی فلاش' : 'داگیرساندنی فلاش'}
                  className={`p-3.5 rounded-full backdrop-blur-md border shadow-lg transition-all ${
                    torchOn
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/10'
                  }`}
                >
                  {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
                </button>
              )}

              {/* Camera Switch Toggle */}
              <button
                onClick={toggleCamera}
                title="گۆڕینی کامێرا"
                className="p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Main Snap Button */}
              <button
                onClick={handleManualCapture}
                disabled={loading}
                title="وێنەگرتن و خوێندنەوەی دەستبەجێ"
                className="w-18 h-18 rounded-full bg-gradient-to-tr from-brand-500 to-sky-400 text-white p-1.5 shadow-xl shadow-brand-500/40 transition-transform active:scale-90 flex items-center justify-center disabled:opacity-50"
              >
                <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center">
                  {loading ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <Camera className="w-7 h-7" />
                  )}
                </div>
              </button>

              {/* Live Auto-Scan Toggle Switch */}
              <button
                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                title={autoScanEnabled ? 'ڕاگرتنی سکانی ڕاستەوخۆ' : 'دەستپێکردنی سکانی ڕاستەوخۆی ئۆتۆماتیک'}
                className={`p-3.5 rounded-full backdrop-blur-md border shadow-lg transition-all flex items-center gap-1.5 ${
                  autoScanEnabled
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-emerald-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/10'
                }`}
              >
                <Radio className={`w-5 h-5 ${autoScanEnabled ? 'animate-pulse' : ''}`} />
              </button>

              {/* Refresh Camera */}
              <button
                onClick={startCamera}
                title="دووبارە دەستپێکردنەوەی کامێرا"
                className="p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scanned Today / Session History Table */}
          {scannedSessionHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-xs text-slate-800">
                    پەڕە ئەکسێپتکراوەکانی ئەم دانیشتنە ({scannedSessionHistory.length})
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToResults()}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  بینینی هەموو ئەنجامەکان
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {scannedSessionHistory.map((item, idx) => (
                  <div
                    key={item.sessionKey || idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors group cursor-pointer"
                    onClick={() => {
                      setScanResult(item.raw);
                      setResultModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{item.studentName}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          کۆد: {item.studentCode} • کات: {item.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] text-slate-500 block">
                          دروست: <span className="font-bold text-emerald-600">{item.correctCount}</span> | دوو وەڵام: <span className="font-bold text-amber-600">{item.multipleCount}</span>
                        </span>
                      </div>

                      <span
                        className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                          item.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.percentage}%
                      </span>

                      {/* Delete button: removes from session so it can be rescanned */}
                      <button
                        onClick={(e) => handleDeleteFromSession(item.sessionKey, item.studentName, e)}
                        title="سڕینەوە لەم دانیشتنە بۆ ئەوەی بتوانیت دووبارە سکانی بکەیتەوە"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* File & Batch PDF Upload Mode */
        <div className="space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              dragOver
                ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="font-extrabold text-slate-900 text-base">
                پەڕگەی وێنەکان (JPG, PNG) یان فایلی PDF لێرە دابنێ
              </h3>
              <p className="text-xs text-slate-500">
                دەتوانیت یەک وێنە، چەندین وێنە پێکەوە، یان فایلی PDF ی فرەپەڕەیی هەڵبژێریت بە شێوەی خێرا و ئۆتۆماتیکی
              </p>
            </div>

            <button
              type="button"
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              هەڵبژاردنی فایلەکان لە ئامێرەکەتەوە
            </button>
          </div>

          {/* Multi-Image Upload Progress HUD */}
          {uploadProgress && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
                  <span className="font-bold text-slate-900 text-sm">
                    خوێندنەوەی دەستەیی وێنەکان ({uploadProgress.current} لە {uploadProgress.total})
                  </span>
                </div>
                <span className="text-xs font-bold text-brand-600 font-mono">
                  {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-600 to-sky-500 h-full transition-all duration-300"
                  style={{ width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="truncate max-w-[250px]">فایل: {uploadProgress.currentFileName}</span>
                <span>
                  سەرکەوتوو: <span className="text-emerald-600 font-bold">{uploadProgress.successful}</span> | هەڵە:{' '}
                  <span className="text-rose-600 font-bold">{uploadProgress.failed}</span>
                </span>
              </div>
            </div>
          )}

          {/* Batch PDF Job Live Progress Card */}
          {batchJob && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-slate-900 text-sm">پڕۆسەی دەستەیی PDF: {batchJob.job_id}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    batchJob.is_finished ? 'bg-emerald-100 text-emerald-800' : 'bg-brand-100 text-brand-800 animate-pulse'
                  }`}
                >
                  {batchJob.is_finished ? 'تەواوبوو' : 'لە پڕۆسەدایە'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{batchJob.processed_pages} لە {batchJob.total_pages} پەڕە خوێندرایەوە</span>
                  <span className="font-bold">{batchJob.percentage || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-brand-600 h-full transition-all duration-300"
                    style={{ width: `${batchJob.percentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <span className="block font-bold">{batchJob.successful_pages || 0}</span>
                  <span className="text-[10px]">سەرکەوتوو</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <span className="block font-bold">{batchJob.needs_review_pages || 0}</span>
                  <span className="text-[10px]">دوو وەڵام / پێداچوونەوە</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <span className="block font-bold">{batchJob.failed_pages || 0}</span>
                  <span className="text-[10px]">نەخوێندراوە</span>
                </div>
              </div>

              {batchJob.is_finished && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => onNavigateToResults()}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:bg-brand-700 transition-colors cursor-pointer"
                  >
                    بینینی ئەنجامەکان
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Session History Table for Upload Mode as well */}
          {scannedSessionHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-xs text-slate-800">
                    پەڕە بارکراوەکانی ئەم دانیشتنە ({scannedSessionHistory.length})
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToResults()}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                >
                  بینینی هەموو ئەنجامەکان
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {scannedSessionHistory.map((item, idx) => (
                  <div
                    key={item.sessionKey || idx}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 px-2 rounded-xl transition-colors group cursor-pointer"
                    onClick={() => {
                      setScanResult(item.raw);
                      setResultModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">{item.studentName}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          کۆد: {item.studentCode} • کات: {item.timestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[11px] text-slate-500 block">
                          دروست: <span className="font-bold text-emerald-600">{item.correctCount}</span> | دوو وەڵام: <span className="font-bold text-amber-600">{item.multipleCount}</span>
                        </span>
                      </div>

                      <span
                        className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                          item.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.percentage}%
                      </span>

                      <button
                        onClick={(e) => handleDeleteFromSession(item.sessionKey, item.studentName, e)}
                        title="سڕینەوە لەم دانیشتنە بۆ ئەوەی بتوانیت دووبارە سکانی بکەیتەوە"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Breakdown Modal */}
      <Modal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        title="ئەنجامی خوێندنەوەی پەڕەی وەڵام"
        maxWidth="max-w-3xl"
      >
        {scanResult && (
          <div className="space-y-5">
            {/* Student & Score Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5 text-center sm:text-right">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {scanResult.resolved_student?.name || 'قوتابی نادیار'}
                </h4>
                <p className="text-xs text-slate-500">
                  کۆد: {scanResult.resolved_student?.student_id || '—'} • کۆدی پەڕە: {scanResult.data?.sheet_id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">نمرەی کۆی</span>
                  <span className="text-lg font-black text-slate-900">
                    {scanResult.data?.summary?.total_score} / {scanResult.data?.summary?.max_possible_score}
                  </span>
                </div>
                <div
                  className={`text-center px-4 py-2 rounded-xl font-black text-lg ${
                    scanResult.data?.summary?.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {scanResult.data?.summary?.percentage}%
                </div>
              </div>
            </div>

            {/* Metric counters with distinct دوو وەڵام label */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <span className="font-bold text-sm block">{scanResult.data?.summary?.correct_count}</span>
                <span className="text-[10px]">دروست</span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                <span className="font-bold text-sm block">{scanResult.data?.summary?.incorrect_count}</span>
                <span className="text-[10px]">هەڵە</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <span className="font-bold text-sm block">{scanResult.data?.summary?.blank_count}</span>
                <span className="text-[10px]">بەتاڵ</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <span className="font-bold text-sm block">
                  {scanResult.data?.summary?.multiple_count || 0}
                </span>
                <span className="text-[10px]">دوو وەڵام</span>
              </div>
            </div>

            {/* Visual Debug Overlay Preview - Supports embedded Base64 and remote path */}
            {(scanResult.data?.debug_image_base64 || scanResult.data?.debug_image_path) && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">پێشبینی وێنەی پەڕەکە و دیاریکردنی بازنەکان:</span>
                <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center">
                  <img
                    src={
                      scanResult.data.debug_image_base64 ||
                      getUploadUrl(`/uploads/debug/${scanResult.data.debug_image_path}`)
                    }
                    alt="پەڕەی شیکاریکراو و بازنەکان"
                    className="w-full max-h-76 object-contain rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Answers Breakdown Grid */}
            {scanResult.data?.answers && scanResult.data.answers.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">وەڵامەکانی قوتابی بەراورد بە کلیلی وەڵام:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {scanResult.data.answers.map((ans) => {
                    const isCorrect = ans.is_correct;
                    const isMultiple = ans.machine_status === 'MULTIPLE';
                    const isBlank = ans.machine_status === 'BLANK';
                    return (
                      <div
                        key={ans.question_num}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                          isCorrect
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : isMultiple
                            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                            : isBlank
                            ? 'bg-slate-50 border-slate-200 text-slate-600'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        <span className="font-mono font-bold">.{ans.question_num}</span>
                        <span className="font-extrabold">
                          {isMultiple ? 'دوو وەڵام' : isBlank ? 'بەتاڵ' : ans.machine_answer}
                        </span>
                        {ans.correct_answer && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({ans.correct_answer})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setResultModalOpen(false);
                  if (activeMode === 'camera') startCamera();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                سکانکردنی پەڕەی دواتر
              </button>

              <div className="flex items-center gap-2">
                {scanResult.data?.overall_status === 'NEEDS_REVIEW' && (
                  <button
                    onClick={() => {
                      setResultModalOpen(false);
                      onNavigateToReview();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    پێداچوونەوەی وەڵامەکان
                  </button>
                )}
                <button
                  onClick={() => {
                    setResultModalOpen(false);
                    onNavigateToResults();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  تەواوی ئەنجامەکان
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
