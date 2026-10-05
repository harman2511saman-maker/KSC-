import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Camera,
  CheckSquare,
  Printer,
  BarChart3,
  Sliders,
  LogOut,
  Sparkles,
  Layers,
  HelpCircle,
  Building2,
  Trophy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'dashboard', label: 'داشبۆرد', icon: LayoutDashboard },
  { id: 'competitions', label: 'پێشبڕکێ و ڕیزبەندی', icon: Trophy, highlight: true },
  { id: 'exams', label: 'تاقیکردنەوەکان', icon: FileText },
  { id: 'students', label: 'قوتابیان', icon: Users },
  { id: 'schools', label: 'قوتابخانەکان', icon: Building2 },
  { id: 'scanner', label: 'سکانکردن', icon: Camera },
  { id: 'reviews', label: 'پێداچوونەوە', icon: CheckSquare },
  { id: 'sheets', label: 'پەڕەی وەڵام', icon: Printer },
  { id: 'results', label: 'ئەنجامەکان', icon: BarChart3 },
  { id: 'calibration', label: 'ڕێکخستنەکان', icon: Sliders },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, pendingReviewsCount = 0 }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white border-l border-slate-200 shadow-sm flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="KSC Logo"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
              <div>
                <h1 className="font-black text-slate-900 text-sm leading-tight">پلاتفۆرمی کوردستان</h1>
                <span className="text-[10px] text-brand-700 font-bold">KSC OMR Platform</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${item.highlight && !isActive ? 'border border-brand-200 bg-brand-50/40 text-brand-600' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-brand-600' : item.highlight ? 'text-brand-500' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {/* Badges */}
                  {item.id === 'reviews' && pendingReviewsCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full animate-pulse">
                      {pendingReviewsCount}
                    </span>
                  )}
                  {item.id === 'scanner' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-md">
                      فەرمی
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.full_name_ku?.charAt(0) || 'م'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.full_name_ku || 'مامۆستا'}</p>
                <p className="text-[10px] text-slate-500">{user?.role === 'ADMIN' ? 'بەڕێوەبەر' : 'مامۆستا'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="چوونەدەرەوە"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-mono">OMR Core v1.0 • Kurdish RTL</p>
        </div>
      </aside>
    </>
  );
}
