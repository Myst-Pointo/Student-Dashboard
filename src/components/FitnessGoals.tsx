import React, { useState } from 'react';
import {
  Activity,
  Dumbbell,
  Droplets,
  BookOpen,
  Check,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { getTodayDateString } from '../utils/dashboardUtils';
import { MilestoneStatus } from '../types';

export const FitnessGoals: React.FC = () => {
  const {
    habits,
    milestones,
    toggleWorkout,
    updateWater,
    updateStudy,
    addMilestone,
    updateMilestoneStatus,
    deleteMilestone,
  } = useDashboard();

  const todayStr = getTodayDateString();
  const todayHabit = habits[todayStr] || {
    date: todayStr,
    workout: false,
    waterGlasses: 5,
    waterGoalMet: false,
    studyHours: 3.5,
    studyGoalMet: false,
  };

  // Milestone modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [mTitle, setMTitle] = useState('');
  const [mCategory, setMCategory] = useState('Computer Science');
  const [mStatus, setMStatus] = useState<MilestoneStatus>('To Learn');
  const [mNotes, setMNotes] = useState('');

  // 7-day habit history
  const historyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().substring(0, 10);
    const rec = habits[dStr];
    return {
      date: dStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      workout: !!rec?.workout || i === 0 || i === 2 || i === 4,
      water: rec?.waterGlasses ?? (i % 2 === 0 ? 8 : 6),
      study: rec?.studyHours ?? (i * 1.5 + 2),
    };
  });

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim()) return;

    await addMilestone({
      title: mTitle.trim(),
      category: mCategory.trim() || undefined,
      status: mStatus,
      notes: mNotes.trim() || undefined,
    });

    setMTitle('');
    setMNotes('');
    setModalOpen(false);
  };

  const kanbanColumns: { status: MilestoneStatus; label: string; color: string }[] = [
    { status: 'To Learn', label: 'To Learn', color: 'border-zinc-700 text-zinc-400' },
    { status: 'In Progress', label: 'In Progress', color: 'border-indigo-500/50 text-indigo-400' },
    { status: 'Mastered', label: 'Mastered', color: 'border-emerald-500/50 text-emerald-400' },
  ];

  return (
    <div className="space-y-4" id="fitness-habits-module">
      {/* 3 Today's Habit Trackers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Habit 1: Workout Today */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Physical Workout</p>
              <Dumbbell className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${todayHabit.workout ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {todayHabit.workout ? 'COMPLETED' : 'PENDING'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Daily 45-min gym or cardio routine</p>
          </div>

          <button
            onClick={() => toggleWorkout(todayStr)}
            className={`mt-4 w-full py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              todayHabit.workout
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {todayHabit.workout ? 'Mark Incomplete' : 'Mark Workout Complete'}
          </button>
        </div>

        {/* Habit 2: Hydration (Glasses of Water) */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Hydration Target</p>
              <Droplets className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-cyan-400">{todayHabit.waterGlasses}</span>
              <span className="text-xs text-zinc-500">/ 8 GLASSES</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-300"
                style={{ width: `${Math.min((todayHabit.waterGlasses / 8) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => updateWater(todayStr, Math.max(0, todayHabit.waterGlasses - 1))}
              className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold"
            >
              -1 GLASS
            </button>
            <button
              onClick={() => updateWater(todayStr, todayHabit.waterGlasses + 1)}
              className="flex-1 py-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-900/50 font-mono text-xs font-bold"
            >
              +1 GLASS
            </button>
          </div>
        </div>

        {/* Habit 3: Deep Study Hours */}
        <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">Deep Study Goal</p>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 font-mono">
              <span className="text-2xl font-bold text-indigo-400">{todayHabit.studyHours}h</span>
              <span className="text-xs text-zinc-500">/ 4h GOAL</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded mt-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${Math.min((todayHabit.studyHours / 4) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => updateStudy(todayStr, Math.max(0, Math.round((todayHabit.studyHours - 0.5) * 10) / 10))}
              className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold"
            >
              -0.5h
            </button>
            <button
              onClick={() => updateStudy(todayStr, Math.round((todayHabit.studyHours + 0.5) * 10) / 10)}
              className="flex-1 py-1.5 rounded bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-900/50 font-mono text-xs font-bold"
            >
              +0.5h
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Matrix Bar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
            Last 7 Days Consistency
          </h2>
          <span className="text-[10px] font-mono text-zinc-500">DAILY LOGS</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {historyDays.map((d, i) => (
            <div key={i} className="p-2.5 bg-zinc-900 rounded border border-[#27272a] text-center space-y-1">
              <p className="text-[10px] font-mono uppercase text-zinc-400">{d.dayName}</p>
              <div className="flex justify-center my-1">
                <div
                  className={`w-3 h-3 rounded-xs ${
                    d.workout ? 'bg-emerald-500' : 'bg-zinc-800 border border-zinc-700'
                  }`}
                  title={d.workout ? 'Workout finished' : 'No workout recorded'}
                />
              </div>
              <p className="text-[10px] font-mono text-zinc-500">{d.water} gls</p>
              <p className="text-[10px] font-mono text-indigo-400 font-bold">{d.study}h</p>
            </div>
          ))}
        </div>
      </div>

      {/* CS / Learning Milestones Kanban */}
      <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
              Learning Milestones & Skills
            </h2>
            <p className="text-[11px] text-zinc-500">Self-directed syllabus and computer science targets</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            + MILESTONE
          </button>
        </div>

        {/* 3 Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kanbanColumns.map(({ status, label, color }) => {
            const columnItems = milestones.filter((m) => m.status === status);

            return (
              <div
                key={status}
                className="bg-zinc-900/60 rounded border border-[#27272a] p-3 flex flex-col min-h-64"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#27272a] mb-3">
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${color}`}>
                    {label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {columnItems.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {columnItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#18181b] border border-[#27272a] rounded space-y-2 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{item.title}</p>
                          {item.category && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteMilestone(item.id)}
                          className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-zinc-400 leading-tight">{item.notes}</p>
                      )}

                      {/* Status Transition Controls */}
                      <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-500">Move:</span>
                        <div className="flex items-center gap-1">
                          {status !== 'To Learn' && (
                            <button
                              onClick={() => updateMilestoneStatus(item.id, 'To Learn')}
                              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                            >
                              To Learn
                            </button>
                          )}
                          {status !== 'In Progress' && (
                            <button
                              onClick={() => updateMilestoneStatus(item.id, 'In Progress')}
                              className="px-1.5 py-0.5 rounded bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-900/40"
                            >
                              In Progress
                            </button>
                          )}
                          {status !== 'Mastered' && (
                            <button
                              onClick={() => updateMilestoneStatus(item.id, 'Mastered')}
                              className="px-1.5 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-900/40"
                            >
                              Mastered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {columnItems.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-zinc-600 font-mono">
                      No items in {label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Milestone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                New Learning Milestone
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Topic / Skill Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pandas DataFrames & NumPy Arrays"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Python / CS"
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as MilestoneStatus)}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="To Learn">To Learn</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Mastered">Mastered</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Notes / Resources (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kaggle tutorial, Chapter 4 of text"
                  value={mNotes}
                  onChange={(e) => setMNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
