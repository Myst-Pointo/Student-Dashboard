import React, { useState } from 'react';
import { Menu, Settings, User } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { Sidebar } from './components/Sidebar';
import { Overview } from './components/Overview';
import { AttendanceTracker } from './components/AttendanceTracker';
import { AcademicPlanner } from './components/AcademicPlanner';
import { FinanceTracker } from './components/FinanceTracker';
import { FitnessGoals } from './components/FitnessGoals';
import { QuickActionModal } from './components/QuickActionModal';
import { UserProfileModal } from './components/UserProfileModal';

const DashboardContent: React.FC = () => {
  const { activeTab, syncStatus, userProfile, setProfileModalOpen } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const tabTitles: Record<string, string> = {
    overview: 'Command Center',
    attendance: `Attendance (${userProfile?.targetAttendance || 75}% Benchmark)`,
    calendar: 'Academic Planner & Calendar',
    finance: 'Student Finance & Budget',
    fitness: 'Fitness & Habit Tracking',
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 antialiased overflow-hidden select-none">
      {/* Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-[#27272a] px-4 sm:px-8 flex items-center justify-between bg-[#09090b] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded bg-zinc-900 border border-[#27272a] text-zinc-400 hover:text-white"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-semibold uppercase tracking-widest text-zinc-400">
                {tabTitles[activeTab] || 'Command Center'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="header-profile-btn"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Edit Profile, Semester, Year & Attendance Goal"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                {(userProfile?.displayName || 'S').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium hidden md:inline truncate max-w-[110px]">
                {userProfile?.displayName || 'Student'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 hidden sm:inline">
                {userProfile?.semester || 'Sem 1'}
              </span>
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              id="quick-log-header-btn"
              onClick={() => setQuickLogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 px-3 sm:px-4 py-1.5 rounded text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              + QUICK LOG
            </button>
            <div className="text-xs font-mono text-zinc-500 hidden xl:flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              SYS: {syncStatus === 'saving' ? 'SYNCING' : 'ONLINE'}
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'overview' && <Overview />}
          {activeTab === 'attendance' && <AttendanceTracker />}
          {activeTab === 'calendar' && <AcademicPlanner />}
          {activeTab === 'finance' && <FinanceTracker />}
          {activeTab === 'fitness' && <FitnessGoals />}
        </div>
      </main>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
      />

      {/* User Profile & Academic Settings Modal */}
      <UserProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
