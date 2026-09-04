import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  Wallet,
  Activity,
  Menu,
  X,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { TabType } from '../types';
import { useDashboard } from '../context/DashboardContext';
import { formatCurrency } from '../utils/dashboardUtils';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    syncStatus,
    userId,
    subjects,
    budget,
    currency,
    transactions,
    isGoogleConnected,
    googleUserName,
    googleUserEmail,
    googleUserPhoto,
    googleEvents,
    connectGoogleCalendar,
    loadingGCal,
    userProfile,
    setProfileModalOpen,
  } = useDashboard();

  const targetAttendance = userProfile?.targetAttendance || 75;

  // Quick stats
  const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  const attendedClasses = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const overallAttendance = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 1000) / 10 : 100;
  const isAttendanceSafe = overallAttendance >= targetAttendance;

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);
  const remainingBudget = budget - monthlyExpenses;

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: `Attendance (${targetAttendance}% Goal)`,
      icon: GraduationCap,
      badge: `${overallAttendance}%`,
      badgeColor: isAttendanceSafe ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'calendar',
      label: 'Academic Calendar',
      icon: CalendarDays,
      badge: isGoogleConnected ? `${googleEvents.length} GCal` : undefined,
      badgeColor: isGoogleConnected ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : undefined,
    },
    {
      id: 'finance',
      label: 'Student Finance',
      icon: Wallet,
      badge: formatCurrency(remainingBudget, currency),
      badgeColor: remainingBudget >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'fitness',
      label: 'Fitness & Habits',
      icon: Activity,
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#09090b] border-r border-[#27272a] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-sm">
                A
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white block leading-none">
                  AXIS CORE
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mt-1">
                  STUDENT OS
                </span>
              </div>
            </div>
            <button
              id="close-mobile-sidebar-btn"
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}-btn`}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400'
                      : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        item.badgeColor || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Academic Attendance Goal Status Widget */}
        <div className="px-6 py-2">
          <div
            onClick={() => setProfileModalOpen(true)}
            className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-zinc-700 text-xs cursor-pointer transition-colors group"
            title="Click to change your target attendance benchmark"
          >
            <div className="flex items-center justify-between text-zinc-400 mb-1.5">
              <span className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {targetAttendance}% Goal Status
              </span>
              <span className={`font-mono text-xs font-bold ${isAttendanceSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallAttendance}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isAttendanceSafe ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(overallAttendance, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 leading-tight">
              <span>
                {isAttendanceSafe
                  ? 'Safe attendance buffer maintained.'
                  : `Warning: Below ${targetAttendance}% benchmark.`}
              </span>
              <span className="text-[9px] text-indigo-400 font-semibold group-hover:underline">
                Edit ⚙
              </span>
            </div>
          </div>
        </div>

        {/* Footer: User Profile & Settings */}
        <div className="mt-auto p-4 border-t border-[#27272a]">
          <div
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-3 p-1.5 -m-1.5 rounded-lg hover:bg-zinc-850 cursor-pointer transition-colors group"
            title="Click to edit profile name, semester, year & attendance goal"
          >
            {googleUserPhoto ? (
              <img
                src={googleUserPhoto}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-[#27272a] object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 text-xs font-bold">
                {(userProfile?.displayName || googleUserName || 'Student').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                  {userProfile?.displayName || googleUserName || 'Student'}
                </p>
                <Settings className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 shrink-0" />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {userProfile?.semester || 'Semester 1'} • {userProfile?.year ? userProfile.year.split(' ')[0] : '1st Year'}
              </p>
            </div>
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                isGoogleConnected
                  ? 'bg-emerald-400'
                  : syncStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : syncStatus === 'error'
                  ? 'bg-rose-400'
                  : 'bg-zinc-600'
              }`}
              title={isGoogleConnected ? 'Google Calendar Synced' : `Status: ${syncStatus}`}
            />
          </div>

          {!isGoogleConnected && (
            <button
              type="button"
              onClick={connectGoogleCalendar}
              disabled={loadingGCal}
              className="mt-3 w-full py-1.5 px-2 rounded-md bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-300 hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              <span>Connect Google Calendar</span>
            </button>
          )}
        </div>
      </aside>

    </>
  );
};
