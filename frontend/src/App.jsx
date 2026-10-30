import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import SplashScreen from './components/SplashScreen';
import Footer from './components/Footer';
import AnnouncementBar from './components/AnnouncementBar';
import PublicNavbar from './components/PublicNavbar';
import OMRGuideModal from './components/OMRGuideModal';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Pages
import Dashboard from './pages/Dashboard';
import Exams from './pages/Exams';
import Students from './pages/Students';
import Schools from './pages/Schools';
import Scanner from './pages/Scanner';
import Reviews from './pages/Reviews';
import SheetGenerator from './pages/SheetGenerator';
import Results from './pages/Results';
import Calibration from './pages/Calibration';
import AnswerKey from './pages/AnswerKey';
import Competitions from './pages/Competitions';

import { Lock, Shield, KeyRound, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from './api';

function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      onLoginSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative">
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="KSC Logo"
            className="h-16 w-auto object-contain mx-auto mb-3 drop-shadow-lg rounded-xl"
          />
          <h3 className="text-xl font-black text-slate-900">دەروازەی کارگێڕی پارێزراو</h3>
          <p className="text-xs text-slate-500 mt-1">
            چوونەژوورەوەی کارمەندان و مامۆستایانی بەڕێوەبەرایەتی OMR
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ناوی بەکارهێنەر (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ناوی بەکارهێنەر بنووسە"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-sans"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              وشەی نهێنی (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-sans"
              dir="ltr"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-all"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>چوونەژوورەوە</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            سیستەمی پارێزراو بە هێمای JWT
          </span>
          <span className="font-mono">Brute-Force Guard</span>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Cross-page selections
  const [selectedExamIdForScan, setSelectedExamIdForScan] = useState(null);
  const [selectedExamIdForSheet, setSelectedExamIdForSheet] = useState(null);
  const [activeAnswerKeyExamId, setActiveAnswerKeyExamId] = useState(null);

  // Review Badge Count
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  const fetchPendingCount = async () => {
    if (!user) return;
    try {
      const res = await api.get('/reviews/pending');
      setPendingReviewsCount(res.data.length);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Keyboard shortcut for discrete admin gate: Ctrl + Shift + L
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Hidden URL query trigger (e.g. ksciq.com/?admin=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') !== null || params.get('login') !== null) {
        setShowAdminModal(true);
      }
    }
  }, []);

  // Secret 4-click trigger on the logo
  const logoClickRef = React.useRef({ count: 0, last: 0 });
  const handleSecretLogoClick = () => {
    const now = Date.now();
    if (now - logoClickRef.current.last > 2000) {
      logoClickRef.current.count = 1;
    } else {
      logoClickRef.current.count += 1;
    }
    logoClickRef.current.last = now;
    if (logoClickRef.current.count >= 4) {
      setShowAdminModal(true);
      logoClickRef.current.count = 0;
    }
  };

  const showToast = ({ type = 'success', message }) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const pageTitles = {
    dashboard: 'داشبۆردی سەرەکی',
    competitions: 'پێشبڕکێ و ڕیزبەندی قوتابخانەکان',
    exams: 'بەڕێوەبردنی تاقیکردنەوەکان',
    students: 'بەڕێوەبردنی قوتابیان',
    schools: 'بەڕێوەبردنی قوتابخانەکان',
    scanner: 'سکانکردنی پەڕەی وەڵام',
    reviews: 'پێداچوونەوەی وەڵامەکان',
    sheets: 'پەڕەی وەڵامی ستاندارد',
    results: 'ئەنجامەکان و شیکاری',
    calibration: 'ڕێکخستنەکانی OMR',
    answer_key: 'کلیلی وەڵام',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 text-sm font-medium">پێشبڕکێی قوتابخانەکانی کوردستان لە بارکردندایە...</p>
        </div>
      </div>
    );
  }

  // PUBLIC PORTAL: If not logged in as Admin, show strictly the public competition page
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-between pb-16 lg:pb-0 transition-colors duration-300 w-full max-w-full overflow-x-hidden ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-black'}`}>
        <AnnouncementBar />
        <PublicNavbar
          onOpenAdminModal={() => setShowAdminModal(true)}
          onOpenOMRGuide={() => setShowGuideModal(true)}
          onOpenInstall={() => setShowInstallModal(true)}
          onSecretLogoClick={handleSecretLogoClick}
        />

        <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">
          <Competitions onShowToast={showToast} />
        </main>

        <Footer />

        <AdminLoginModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onLoginSuccess={() => showToast({ type: 'success', message: 'بە سەرکەوتوویی چوویتە ژوورەوە بۆ بەشی کارگێڕی' })}
        />

        <OMRGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
        />

        {/* Progressive Web App (PWA) Mobile Install Prompt */}
        <PWAInstallPrompt
          isOpen={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // AUTHENTICATED ADMIN / TEACHER PORTAL
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeAnswerKeyExamId ? 'exams' : activeTab}
        setActiveTab={(tab) => {
          setActiveAnswerKeyExamId(null);
          setActiveTab(tab);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        pendingReviewsCount={pendingReviewsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:mr-64 flex flex-col min-w-0">
        <Navbar
          onOpenMobile={() => setMobileOpen(true)}
          onQuickScan={() => {
            setActiveAnswerKeyExamId(null);
            setActiveTab('scanner');
          }}
          activeTitle={activeAnswerKeyExamId ? 'کلیلی وەڵامی تاقیکردنەوە' : pageTitles[activeTab]}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeAnswerKeyExamId ? (
            <AnswerKey
              examId={activeAnswerKeyExamId}
              onBack={() => setActiveAnswerKeyExamId(null)}
              onShowToast={showToast}
            />
          ) : activeTab === 'dashboard' ? (
            <Dashboard
              setActiveTab={setActiveTab}
              onSelectExamForScan={(id) => {
                setSelectedExamIdForScan(id);
                setActiveTab('scanner');
              }}
              onOpenReview={() => setActiveTab('reviews')}
            />
          ) : activeTab === 'competitions' ? (
            <Competitions onShowToast={showToast} />
          ) : activeTab === 'exams' ? (
            <Exams
              onSelectAnswerKey={(id) => setActiveAnswerKeyExamId(id)}
              onSelectExamForScan={(id) => {
                setSelectedExamIdForScan(id);
                setActiveTab('scanner');
              }}
              onSelectExamForSheet={(id) => {
                setSelectedExamIdForSheet(id);
                setActiveTab('sheets');
              }}
              onShowToast={showToast}
            />
          ) : activeTab === 'students' ? (
            <Students onShowToast={showToast} />
          ) : activeTab === 'schools' ? (
            <Schools onShowToast={showToast} />
          ) : activeTab === 'scanner' ? (
            <Scanner
              defaultExamId={selectedExamIdForScan}
              onShowToast={showToast}
              onNavigateToReview={() => {
                fetchPendingCount();
                setActiveTab('reviews');
              }}
              onNavigateToResults={() => setActiveTab('results')}
            />
          ) : activeTab === 'reviews' ? (
            <Reviews
              onShowToast={showToast}
              onReviewsUpdated={fetchPendingCount}
            />
          ) : activeTab === 'sheets' ? (
            <SheetGenerator
              defaultExamId={selectedExamIdForSheet}
              onShowToast={showToast}
            />
          ) : activeTab === 'results' ? (
            <Results
              onShowToast={showToast}
              onOpenReviewForPage={(pageId) => {
                setActiveTab('reviews');
              }}
            />
          ) : activeTab === 'calibration' ? (
            <Calibration onShowToast={showToast} />
          ) : null}
        </main>
      </div>

      {/* Global Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Progressive Web App (PWA) Mobile Install Prompt */}
      <PWAInstallPrompt
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SplashScreen />
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
