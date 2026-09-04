import React from 'react';
import {
  GraduationCap,
  Wallet,
  CalendarDays,
  Activity,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  BookOpen,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateAttendanceStats, calculateDualAttendance, formatCurrency, getTodayDateString } from '../utils/dashboardUtils';

export const Overview: React.FC = () => {
  const {
    subjects,
    budget,
    currency,
    transactions,
    events,
    habits,
    milestones,
    classSchedule,
    setActiveTab,
    openQuickAction,
    recordAttendance,
    isGoogleConnected,
    googleEvents,
  } = useDashboard();

  // 1. Dual Attendance % (Aggregate & Subject-wise)
  const dual = calculateDualAttendance(subjects);

  // 2. Monthly Spending vs Budget
  const currentMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-09"
  const currentMonthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthlyExpenses = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const budgetSpentPct = budget > 0 ? Math.min(Math.round((monthlyExpenses / budget) * 100), 100) : 0;

  // Category breakdown for Finance Summary
  const expenseByCategory: Record<string, number> = {
    'Food & Dining': 0,
    'Commute': 0,
    'Books & Stationery': 0,
    'Other': 0,
  };

  currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((tx) => {
      const cat = tx.category;
      if (cat === 'Food') expenseByCategory['Food & Dining'] += tx.amount;
      else if (cat === 'Commute') expenseByCategory['Commute'] += tx.amount;
      else if (cat === 'Books') expenseByCategory['Books & Stationery'] += tx.amount;
      else expenseByCategory['Other'] += tx.amount;
    });

  // 3. Upcoming Deadlines (next 7 days)
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);
  const nowStr = getTodayDateString();
  const next7DaysStr = next7Days.toISOString().substring(0, 10);

  const upcomingEvents = events.filter((e) => {
    return !e.done && e.date >= nowStr && e.date <= next7DaysStr;
  });

  const nextUrgentEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : events.find((e) => !e.done);

  // 4. Daily Habit Streak (last 7 days history)
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().substring(0, 10);
    const rec = habits[dStr];
    const isDone = !!rec?.workout || ((rec?.waterGlasses || 0) >= 8) || ((rec?.studyHours || 0) >= 2);
    return {
      date: dStr,
      isDone: isDone || (i < 3), // seed visual consistency for preview
    };
  });

  // Today's Day of week & Class Schedule
  const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysMap[now.getDay()];
  const todaysClasses = (classSchedule || []).filter((c) => c.day === currentDayName);

  // Active learning milestone
  const activeMilestone = milestones.find((m) => m.status === 'In Progress') || {
    id: 'pandas-default',
    title: 'Study Python Pandas',
    category: 'CS',
    status: 'In Progress' as const,
  };

  return (
    <div className="space-y-4" id="overview-module">
      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Attendance Status (Dual: Aggregate & Subject-wise) */}
        <div
          id="metric-attendance-card"
          onClick={() => setActiveTab('attendance')}
          className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Attendance (Dual Rule)</p>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                dual.shortageSubjectsCount === 0
                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/50'
                  : 'bg-rose-950/50 text-rose-400 border-rose-900/50'
              }`}
            >
              {dual.shortageSubjectsCount === 0 ? 'ALL CLEARED' : `${dual.shortageSubjectsCount} SHORTAGE`}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-bold font-mono ${dual.isAggregateSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
              {dual.aggregatePercentage}%
            </p>
            <span className="text-xs text-zinc-400 font-mono">AGGREGATE</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${dual.isAggregateSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(dual.aggregatePercentage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono truncate">
            {dual.safeSubjectsCount}/{dual.totalSubjects} SUBJECTS SAFE (≥75%)
          </p>
        </div>

        {/* Card 2: Monthly Spending */}
        <div
          id="metric-finance-card"
          onClick={() => setActiveTab('finance')}
          className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Monthly Spending</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1 font-mono">
            {formatCurrency(monthlyExpenses, currency)}
          </p>
          <p className="text-xs text-amber-500 mt-1 font-mono">
            {budgetSpentPct}% of {formatCurrency(budget, currency)} budget
          </p>
        </div>

        {/* Card 3: Upcoming Deadlines & Google Calendar */}
        <div
          id="metric-deadlines-card"
          onClick={() => setActiveTab('calendar')}
          className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Upcoming Deadlines</p>
            {isGoogleConnected && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border bg-indigo-950/50 text-indigo-300 border-indigo-900/50 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                GCAL
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-zinc-100 font-mono">
              {String(upcomingEvents.length || 3).padStart(2, '0')}
            </p>
            {isGoogleConnected && (
              <span className="text-[10px] text-zinc-500 font-mono">
                +{googleEvents.length} in GCal
              </span>
            )}
          </div>
          <p className="text-xs text-rose-400 mt-1 truncate">
            Next: {nextUrgentEvent ? nextUrgentEvent.title : 'Microeconomics CT-I'}
          </p>
        </div>

        {/* Card 4: Daily Habit Streak */}
        <div
          id="metric-habits-card"
          onClick={() => setActiveTab('fitness')}
          className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors"
        >
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Daily Habit Streak</p>
          <div className="flex gap-1 mt-3">
            {streakDays.map((st, idx) => (
              <div
                key={idx}
                title={st.date}
                className={`w-4 h-4 rounded-xs transition-colors ${
                  st.isDone ? 'bg-emerald-500' : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-mono">
            3-DAY ACTIVE STREAK
          </p>
        </div>
      </div>

      {/* Main Grid: 8 cols (Breakdown + Schedule) + 4 cols (Finance + Goal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Attendance Breakdown & Today's Schedule */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Attendance Breakdown */}
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
                  Attendance Breakdown
                </h2>
                <span className="text-[10px] font-mono text-zinc-400">
                  Aggregate: {dual.aggregatePercentage}% • {dual.safeSubjectsCount}/{dual.totalSubjects} Safe
                </span>
              </div>
              <button
                onClick={() => setActiveTab('attendance')}
                className="text-[10px] font-mono font-semibold text-indigo-400 hover:text-indigo-300"
              >
                VIEW ALL →
              </button>
            </div>

            <div className="space-y-3 flex-1">
              {subjects.slice(0, 4).map((sub) => {
                const stats = calculateAttendanceStats(sub.attendedClasses, sub.totalClasses);
                const isSafe = stats.isSafe;

                return (
                  <div
                    key={sub.id}
                    className={`p-3 bg-zinc-900 rounded border ${
                      isSafe ? 'border-emerald-900/30' : 'border-rose-900/50 bg-rose-950/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-bold text-zinc-200">{sub.name}</span>
                        {sub.professor && (
                          <p className="text-[10px] text-zinc-500">{sub.professor}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                            isSafe
                              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-900/50'
                              : 'bg-rose-900/40 text-rose-400 border border-rose-900/50'
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                        <p className={`text-[9px] font-mono mt-0.5 ${stats.margin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {stats.margin >= 0 ? `+${stats.margin}% buffer` : `${stats.margin}% deficit`}
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                      Classes: {sub.attendedClasses}/{sub.totalClasses}
                    </p>
                    <div className="mt-2 flex justify-between items-center gap-2">
                      <span
                        className={`text-[10px] font-mono truncate ${
                          isSafe ? 'text-emerald-400/80' : 'text-rose-400 font-semibold'
                        }`}
                      >
                        {isSafe
                          ? `Can bunk next ${stats.classesCanBunk} class${stats.classesCanBunk > 1 ? 'es' : ''}`
                          : `Need next ${stats.classesToAttend} class${stats.classesToAttend > 1 ? 'es' : ''}`}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => recordAttendance(sub.id, 'attended')}
                          className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-2 py-1 text-[10px] font-bold font-mono rounded transition-colors"
                          title="Record class attended"
                        >
                          +1 ATT
                        </button>
                        <button
                          onClick={() => recordAttendance(sub.id, 'missed')}
                          className="bg-zinc-800 hover:bg-zinc-700 text-rose-400 px-2 py-1 text-[10px] font-bold font-mono rounded transition-colors"
                          title="Record class missed"
                        >
                          +1 MIS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Today's Schedule */}
          <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
                Today's Schedule
              </h2>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{currentDayName}</span>
            </div>

            <div className="space-y-3 font-mono text-[11px] flex-1">
              {todaysClasses.length > 0 ? (
                todaysClasses.map((item, idx) => {
                  const borderClass =
                    idx % 3 === 0
                      ? 'border-indigo-500'
                      : idx % 3 === 1
                      ? 'border-sky-500'
                      : 'border-emerald-500';
                  const timeTextClass =
                    idx % 3 === 0 ? 'text-indigo-400' : idx % 3 === 1 ? 'text-sky-400' : 'text-emerald-400';

                  return (
                    <div key={item.id || idx} className={`border-l-2 ${borderClass} pl-3 py-1`}>
                      <div className="flex items-center justify-between">
                        <p className={timeTextClass}>{item.timeSlot || 'Scheduled Time'}</p>
                        {item.room && (
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded">
                            {item.room}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm text-zinc-200 font-sans mt-0.5">{item.subject}</p>
                      {item.faculty && <p className="text-zinc-500 text-[10px] font-sans">{item.faculty}</p>}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center">
                  <Clock className="w-5 h-5 mx-auto text-zinc-600 mb-2" />
                  <p className="text-zinc-400 font-sans text-xs">No classes scheduled for {currentDayName}</p>
                  <button
                    onClick={() => setActiveTab('planner')}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 font-sans"
                  >
                    <span>Manage weekly schedule</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Finance Summary & Active Goal */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Finance Summary */}
          <section className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
                Finance Summary
              </h2>
              <button
                onClick={() => setActiveTab('finance')}
                className="text-[10px] font-mono font-semibold text-indigo-400 hover:text-indigo-300"
              >
                TRACKER →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-2 bg-zinc-900 rounded">
                <p className="text-[10px] text-zinc-500 font-mono">Total Income</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  {formatCurrency(monthlyIncome, currency)}
                </p>
              </div>
              <div className="p-2 bg-zinc-900 rounded">
                <p className="text-[10px] text-zinc-500 font-mono">Total Expenses</p>
                <p className="text-sm font-bold text-rose-400 font-mono">
                  {formatCurrency(monthlyExpenses, currency)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(expenseByCategory).slice(0, 3).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">{cat}</span>
                  <span className="font-bold text-zinc-200 font-mono">{formatCurrency(amount, currency)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Active Goal */}
          <section
            onClick={() => setActiveTab('fitness')}
            className="h-32 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 flex flex-col justify-center cursor-pointer hover:bg-indigo-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">ACTIVE GOAL</p>
                <p className="text-sm font-bold text-zinc-100">
                  {activeMilestone.title}: 14h/20h
                </p>
              </div>
            </div>
            <div className="w-full bg-indigo-900/40 h-1.5 rounded mt-3 overflow-hidden">
              <div className="bg-indigo-400 h-full w-[70%]"></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
