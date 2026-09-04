import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Percent,
  CheckCircle2,
  Cloud,
  Sparkles,
  AlertCircle,
  LogIn,
  Coins,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { googleSignIn } from '../firebase';
import { ALL_CURRENCIES } from '../data/currencies';

export function UserProfileModal() {
  const {
    user,
    userProfile,
    currency,
    setCurrency,
    updateUserProfile,
    profileModalOpen,
    setProfileModalOpen,
  } = useDashboard();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [semester, setSemester] = useState(userProfile?.semester || 'Semester 1');
  const [year, setYear] = useState(userProfile?.year || '1st Year (2026–2027)');
  const [targetAttendance, setTargetAttendance] = useState<number>(
    userProfile?.targetAttendance || 75
  );
  const [selectedCurrency, setSelectedCurrency] = useState(currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (profileModalOpen && userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || 'Student');
      setSemester(userProfile.semester || 'Semester 1');
      setYear(userProfile.year || '1st Year (2026–2027)');
      setTargetAttendance(userProfile.targetAttendance || 75);
      setSelectedCurrency(currency || 'USD');
      setSavedSuccess(false);
    }
  }, [profileModalOpen, userProfile, user, currency]);

  if (!profileModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        updateUserProfile({
          displayName: displayName.trim() || 'Student',
          semester: semester.trim(),
          year: year.trim(),
          targetAttendance: Math.min(100, Math.max(1, Number(targetAttendance) || 75)),
        }),
        setCurrency(selectedCurrency),
      ]);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setProfileModalOpen(false);
      }, 900);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGoogleConnect = async () => {
    setAuthLoading(true);
    try {
      await googleSignIn();
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const presetGoals = [75, 80, 85, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm font-semibold text-lg">
              {displayName.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                Student Profile & Academic Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize your academic year and attendance targets
              </p>
            </div>
          </div>
          <button
            onClick={() => setProfileModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {/* Cloud Sync Status Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className={`w-5 h-5 ${user ? 'text-emerald-500' : 'text-slate-400'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    {user ? 'Firebase Cloud Connected' : 'Local Storage Mode'}
                  </span>
                  {user && (
                    <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full">
                      Live Sync
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {user
                    ? `Synced to ${user.email} (UID: ${user.uid.slice(0, 8)}...)`
                    : 'Changes saved locally. Sign in to sync across devices.'}
                </p>
              </div>
            </div>
            {!user && (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={authLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            )}
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="e.g. Student Name"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Appears on dashboard greetings, export reports, and student summaries.
            </p>
          </div>

          {/* Academic Semester, Year & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Semester 1">Semester 1 (Autumn / Odd)</option>
                <option value="Semester 2">Semester 2 (Spring / Even)</option>
                <option value="Semester 3">Semester 3 (Autumn / Odd)</option>
                <option value="Semester 4">Semester 4 (Spring / Even)</option>
                <option value="Semester 5">Semester 5 (Autumn / Odd)</option>
                <option value="Semester 6">Semester 6 (Spring / Even)</option>
                <option value="Semester 7">Semester 7 (Autumn / Odd)</option>
                <option value="Semester 8">Semester 8 (Spring / Even)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Academic Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 1st Year (2026–2027)"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Financial Tracking Currency Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Financial Tracking Currency (All World Currencies Available)
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Select any global currency for budget tracking, monthly limits, and transactions.
            </p>
          </div>

          {/* Target Attendance Goal (%) */}
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Target Attendance Benchmark
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                  {targetAttendance}%
                </span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={targetAttendance}
              onChange={(e) => setTargetAttendance(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Preset quick buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick presets:</span>
              <div className="flex gap-1.5">
                {presetGoals.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTargetAttendance(val)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      targetAttendance === val
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-blue-100/60 dark:border-blue-900/30">
              <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
              <strong>Dual-Engine Impact:</strong> Setting your attendance goal recalculates safe bunk quotas, margin calculations, and shortage alert thresholds across all your subjects and semester totals.
            </p>
          </div>

          {/* Feedback & Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              {savedSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved directly to Firebase!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile & Settings'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
