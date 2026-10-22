import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = 'info', message } = toast;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Clock className="w-5 h-5 text-amber-400 shrink-0" />,
  };

  const styles = {
    success: 'border-emerald-500/40 bg-slate-900/95 text-white shadow-emerald-950/60 shadow-2xl ring-1 ring-emerald-500/30',
    error: 'border-rose-500/40 bg-slate-900/95 text-white shadow-rose-950/60 shadow-2xl ring-1 ring-rose-500/30',
    warning: 'border-amber-500/40 bg-slate-900/95 text-white shadow-amber-950/60 shadow-2xl ring-1 ring-amber-500/30',
    info: 'border-indigo-500/40 bg-slate-900/95 text-white shadow-indigo-950/60 shadow-2xl ring-1 ring-indigo-500/30',
  };

  const activeStyle = styles[type] || styles.info;
  const activeIcon = icons[type] || icons.info;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-6 z-[9999] max-w-lg w-[92vw] sm:w-auto animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div
        dir="rtl"
        className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border backdrop-blur-xl ${activeStyle}`}
      >
        <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 shrink-0">
          {activeIcon}
        </div>
        <p className="text-xs sm:text-sm font-black text-white leading-relaxed flex-1 whitespace-pre-line drop-shadow-md select-text">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="داخستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
