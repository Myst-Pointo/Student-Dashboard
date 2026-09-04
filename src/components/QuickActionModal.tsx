import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  GraduationCap,
  Wallet,
  Dumbbell,
  Calendar,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { ExpenseCategory } from '../types';
import { getCurrencySymbol, getTodayDateString } from '../utils/dashboardUtils';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'attendance' | 'expense' | 'workout' | null;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'attendance',
}) => {
  const {
    subjects,
    currency,
    recordAttendance,
    addTransaction,
    toggleWorkout,
    habits,
  } = useDashboard();

  const [activeAction, setActiveAction] = useState<'attendance' | 'expense' | 'workout'>(
    initialType || 'attendance'
  );

  // Attendance quick state
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [attendanceType, setAttendanceType] = useState<'attended' | 'missed'>('attended');

  // Expense quick state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCat, setExpenseCat] = useState<ExpenseCategory>('Food');
  const [expenseNote, setExpenseNote] = useState('');

  // Workout state
  const todayStr = getTodayDateString();
  const workoutDone = habits[todayStr]?.workout || false;

  if (!isOpen) return null;

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    await recordAttendance(selectedSubjectId, attendanceType);
    onClose();
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expenseAmount);
    if (isNaN(val) || val <= 0) return;
    await addTransaction({
      type: 'expense',
      amount: val,
      category: expenseCat,
      date: todayStr,
      notes: expenseNote.trim() || undefined,
    });
    setExpenseAmount('');
    setExpenseNote('');
    onClose();
  };

  const handleWorkoutSubmit = async () => {
    await toggleWorkout(todayStr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
            Quick Action Log
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Action Switchers */}
        <div className="grid grid-cols-3 gap-1 bg-[#09090b] p-1 rounded border border-[#27272a]">
          <button
            type="button"
            onClick={() => setActiveAction('attendance')}
            className={`py-1.5 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
              activeAction === 'attendance'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            ATTEND
          </button>
          <button
            type="button"
            onClick={() => setActiveAction('expense')}
            className={`py-1.5 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
              activeAction === 'expense'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            EXPENSE
          </button>
          <button
            type="button"
            onClick={() => setActiveAction('workout')}
            className={`py-1.5 rounded text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
              activeAction === 'workout'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            WORKOUT
          </button>
        </div>

        {/* Action 1: Quick Log Attendance */}
        {activeAction === 'attendance' && (
          <form onSubmit={handleAttendanceSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-400 mb-1">
                Select Course / Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.attendedClasses}/{s.totalClasses} classes)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAttendanceType('attended')}
                className={`py-2 rounded font-mono font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  attendanceType === 'attended'
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                    : 'bg-[#09090b] text-zinc-400 border-[#27272a]'
                }`}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                +1 Attended
              </button>
              <button
                type="button"
                onClick={() => setAttendanceType('missed')}
                className={`py-2 rounded font-mono font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  attendanceType === 'missed'
                    ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                    : 'bg-[#09090b] text-zinc-400 border-[#27272a]'
                }`}
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                +1 Missed
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Confirm Log
              </button>
            </div>
          </form>
        )}

        {/* Action 2: Quick Log Expense */}
        {activeAction === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-zinc-400 mb-1">
                Amount ({getCurrencySymbol(currency)}) *
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={expenseCat}
                onChange={(e) => setExpenseCat(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Food">Food & Dining</option>
                <option value="Commute">Commute / Transit</option>
                <option value="Books">Books & Supplies</option>
                <option value="Fun">Entertainment</option>
                <option value="Misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-zinc-400 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lunch with project group"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Save Expense
              </button>
            </div>
          </form>
        )}

        {/* Action 3: Quick Toggle Workout */}
        {activeAction === 'workout' && (
          <div className="space-y-4 text-xs py-2 text-center">
            <div className="p-4 bg-zinc-900 rounded border border-[#27272a] space-y-2">
              <Dumbbell className={`w-8 h-8 mx-auto ${workoutDone ? 'text-emerald-400' : 'text-zinc-500'}`} />
              <p className="text-sm font-bold text-zinc-100">
                Today's Workout is currently{' '}
                <span className={workoutDone ? 'text-emerald-400 font-mono' : 'text-zinc-400 font-mono'}>
                  {workoutDone ? 'COMPLETED' : 'PENDING'}
                </span>
              </p>
              <p className="text-[11px] text-zinc-500">
                Clicking below will toggle today's workout completion record in your habit streak.
              </p>
            </div>

            <button
              type="button"
              onClick={handleWorkoutSubmit}
              className={`w-full py-2.5 rounded font-bold font-mono text-xs transition-colors ${
                workoutDone
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {workoutDone ? 'Mark as Incomplete' : '✓ Mark Completed for Today'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
