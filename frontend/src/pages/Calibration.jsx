import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  Sparkles,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ShieldCheck,
  Lock
} from 'lucide-react';
import api, { getUploadUrl } from '../api';

export default function Calibration({ onShowToast }) {
  const [settings, setSettings] = useState({
    min_fill_ratio: 0.35,
    multiple_margin: 0.12,
    uncertain_lower_bound: 0.25,
    uncertain_upper_bound: 0.45,
    blank_threshold: 0.18,
    inner_radius_ratio: 0.65,
    blur_laplacian_threshold: 60.0,
    min_brightness: 35.0,
    max_brightness: 240.0,
    marker_size_tolerance: 0.35,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Diagnostic Test Sheet State
  const testFileInputRef = useRef(null);
  const [testResult, setTestResult] = useState(null);
  const [testingSheet, setTestingSheet] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calibration/');
      setSettings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/calibration/', settings);
      onShowToast({ type: 'success', message: 'ڕێکخستنەکانی OMR بە سەرکەوتوویی پاشەکەوت کران' });
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setTestingSheet(true);
      const form = new FormData();
      form.append('file', file);
      form.append('total_questions', 50);

      const res = await api.post('/calibration/test-sheet', form);
      setTestResult(res.data);
      if (res.data.success) {
        onShowToast({ type: 'success', message: 'تاقیکردنەوەی پەڕە سەرکەوتوو بوو' });
      } else {
        onShowToast({ type: 'warning', message: res.data.message_ku });
      }
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setTestingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">ڕێکخستنەکانی OMR و کالیبرەیشن</h2>
          <p className="text-xs text-slate-500">
            دیاریکردنی ئاستی تۆخی بازنەکان، دۆزینەوەی ٤ نیشانەکە و تاقیکردنەوەی وێنەکان
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>پاشەکەوتکردنی ڕێکخستنەکان</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders & Thresholds Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900">ئاست و بەهاکانی هەڵسەنگاندنی بازنەکان</h3>
          </div>

          {/* Min Fill Threshold Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">کەمترین ڕێژەی پڕبوون (Min Fill Ratio):</span>
              <span className="font-mono font-bold text-brand-600">
                {Math.round(settings.min_fill_ratio * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.65"
              step="0.01"
              value={settings.min_fill_ratio}
              onChange={(e) => setSettings({ ...settings, min_fill_ratio: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <span className="text-[11px] text-slate-400 block">
              ئەگەر بازنەیەک ڕێژەی تۆخی لەم بەهایە کەمتر بێت وەک وەڵامی هەڵبژێردراو دانانرێت.
            </span>
          </div>

          {/* Multiple Margin */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">جیاوازی دوو وەڵام (Multiple Margin):</span>
              <span className="font-mono font-bold text-brand-600">
                {Math.round(settings.multiple_margin * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.01"
              value={settings.multiple_margin}
              onChange={(e) => setSettings({ ...settings, multiple_margin: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <span className="text-[11px] text-slate-400 block">
              ئەگەر وەڵامی دووەم لەم جیاوازییە کەمتر بێت لە وەڵامی یەکەم، وەک فرە وەڵام پۆلێن دەکرێت.
            </span>
          </div>

          {/* Blank Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">ئاستی بەتاڵ بوون (Blank Threshold):</span>
              <span className="font-mono font-bold text-brand-600">
                {Math.round(settings.blank_threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.25"
              step="0.01"
              value={settings.blank_threshold}
              onChange={(e) => setSettings({ ...settings, blank_threshold: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <span className="text-[11px] text-slate-400 block">
              خوار ئەم بەهایە بە دڵنیاییەوە بەتاڵ دادەنرێت و پێویستی بە پێداچوونەوە نابێت.
            </span>
          </div>

          {/* Blur Threshold */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">ئاستی دۆزینەوەی تەڵخی وێنە (Blur Threshold):</span>
              <span className="font-mono font-bold text-brand-600">
                {settings.blur_laplacian_threshold}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={settings.blur_laplacian_threshold}
              onChange={(e) => setSettings({ ...settings, blur_laplacian_threshold: parseFloat(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <span className="text-[11px] text-slate-400 block">
              پشکنینی تیژی وێنەکە پێش پرۆسەی OMR بۆ ڕێگری لە هەڵەخوێندنەوە.
            </span>
          </div>
        </div>

        {/* Live Calibration Sheet Diagnostic Tester */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-slate-900">تاقیکردنەوەی ڕاستەوخۆی پەڕەی نموونە</h3>
            </div>
          </div>

          <div
            onClick={() => testFileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-brand-500 p-6 rounded-2xl text-center cursor-pointer bg-slate-50/50 transition-colors"
          >
            <input
              ref={testFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleTestUpload}
            />
            <Upload className="w-8 h-8 text-brand-600 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-800 block">
              {testingSheet ? 'لە تاقیکردنەوەی پەڕەکەیە...' : 'کرتە بکە بۆ بارکردنی وێنەی پەڕە بۆ پشکنین'}
            </span>
            <span className="text-[11px] text-slate-400">
              ئەم بەشە چینەکانی ئەندازەیی و ڕێژەی پڕبوونی بازنەکان نیشان دەدات
            </span>
          </div>

          {/* Test Diagnostic Visual Overlay Results */}
          {testResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  دۆخ: {testResult.message_ku}
                </span>
                {testResult.skew_angle_deg !== undefined && (
                  <span className="text-slate-500 font-mono">
                    گۆشەی لاری: {testResult.skew_angle_deg}°
                  </span>
                )}
              </div>

              {(testResult.debug_image_base64 || testResult.debug_image_path) && (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center">
                  <img
                    src={
                      testResult.debug_image_base64 ||
                      getUploadUrl(`/uploads/debug/${testResult.debug_image_path}`)
                    }
                    alt="پەڕەی شیکاریکراو و بازنەکان"
                    className="w-full max-h-68 object-contain rounded-lg"
                  />
                </div>
              )}

              {testResult.answers?.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">نموونەی پشکنینی ٥ پرسیاری یەکەم:</span>
                  <div className="space-y-1">
                    {testResult.answers.slice(0, 5).map((a) => (
                      <div key={a.question_num} className="flex items-center justify-between text-[11px]">
                        <span>پرسیاری {a.question_num}:</span>
                        <span className="font-bold text-brand-700">
                          {a.machine_answer || 'بەتاڵ'} ({a.machine_status})
                        </span>
                        <span className="font-mono text-slate-400">
                          {Math.round(a.confidence * 100)}% دڵنیایی
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Security & Password Change Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ئاسایش و گۆڕینی ناوی بەکارهێنەر و وشەی نهێنی ئەدمین</h3>
            <p className="text-xs text-slate-500">
              بۆ پاراستنی سیستەم و داتاکان، دەتوانیت ناوی بەکارهێنەر و وشەی نهێنی خۆت بگۆڕیت
            </p>
          </div>
        </div>

        <AdminPasswordChangeForm onShowToast={onShowToast} />
      </div>
    </div>
  );
}

function AdminPasswordChangeForm({ onShowToast }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onShowToast({ type: 'error', message: 'وشەی نهێنی نوێ و دووبارەکردنەوەی یەکناگرنەوە' });
      return;
    }
    if (newPassword.length < 6) {
      onShowToast({ type: 'error', message: 'وشەی نهێنی نوێ دەبێت لانیکەم ٦ پیت یان ژمارە بێت' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_username: newUsername.trim() || undefined,
        new_password: newPassword,
      });
      onShowToast({ type: 'success', message: 'زانیارییەکانی چوونەژوورەوە بە سەرکەوتوویی نوێکرانەوە' });
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      onShowToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">ناوی بەکارهێنەری نوێ (ئارەزوومەندانە):</label>
        <input
          type="text"
          placeholder="ناوی بەکارهێنەری نوێ..."
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">وشەی نهێنی ئێستا *:</label>
        <input
          type="password"
          required
          placeholder="وشەی نهێنی ئێستا..."
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">وشەی نهێنی نوێ *:</label>
        <input
          type="password"
          required
          placeholder="لانیکەم ٦ پیت یان ژمارە..."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">دووبارەکردنەوەی وشەی نهێنی نوێ *:</label>
        <input
          type="password"
          required
          placeholder="دووبارەکردنەوەی وشەی نهێنی..."
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div className="sm:col-span-2 flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Lock className="w-4 h-4 text-brand-400" />
          <span>{loading ? 'لە نوێکردنەوەدایە...' : 'نوێکردنەوەی وشەی نهێنی'}</span>
        </button>
      </div>
    </form>
  );
}
