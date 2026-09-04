import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  Table,
  LayoutGrid,
  Calculator,
  Info,
  HelpCircle,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { calculateAttendanceStats, calculateDualAttendance } from '../utils/dashboardUtils';
import { Subject } from '../types';

export const AttendanceTracker: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, recordAttendance } = useDashboard();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterMode, setFilterMode] = useState<'all' | 'shortage' | 'safe'>('all');
  const [showSimulator, setShowSimulator] = useState(false);
  const [showRuleInfo, setShowRuleInfo] = useState(false);

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    professor: '',
    totalClasses: 18,
    attendedClasses: 15,
    semester: 1,
  });

  // Simulator state
  const [simSubjectId, setSimSubjectId] = useState<string>(subjects[0]?.id || 'aggregate');
  const [simAction, setSimAction] = useState<'attend' | 'bunk'>('attend');
  const [simCount, setSimCount] = useState<number>(3);

  // Calculate dual attendance analytics
  const dual = calculateDualAttendance(subjects);

  // Filtered subjects list
  const filteredSubjects = subjects.filter((s) => {
    const stats = calculateAttendanceStats(s.attendedClasses, s.totalClasses);
    if (filterMode === 'shortage') return !stats.isSafe;
    if (filterMode === 'safe') return stats.isSafe;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      professor: '',
      totalClasses: 18,
      attendedClasses: 15,
      semester: 1,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      professor: sub.professor || '',
      totalClasses: sub.totalClasses,
      attendedClasses: sub.attendedClasses,
      semester: sub.semester || 1,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingSubject) {
      await updateSubject(editingSubject.id, {
        name: formData.name.trim(),
        professor: formData.professor.trim() || undefined,
        totalClasses: Number(formData.totalClasses),
        attendedClasses: Number(formData.attendedClasses),
        semester: Number(formData.semester),
      });
    } else {
      await addSubject({
        name: formData.name.trim(),
        professor: formData.professor.trim() || undefined,
        totalClasses: Number(formData.totalClasses),
        attendedClasses: Number(formData.attendedClasses),
        semester: Number(formData.semester),
      });
    }
    setModalOpen(false);
  };

  // Simulator prediction calculation
  const targetSimSubject = subjects.find((s) => s.id === simSubjectId);
  let simResult = {
    currentPct: 0,
    projectedPct: 0,
    currentSafe: false,
    projectedSafe: false,
    label: '',
    projectedAggregatePct: dual.aggregatePercentage,
  };

  if (targetSimSubject) {
    const currStats = calculateAttendanceStats(targetSimSubject.attendedClasses, targetSimSubject.totalClasses);
    const newTotal = targetSimSubject.totalClasses + simCount;
    const newAttended =
      simAction === 'attend'
        ? targetSimSubject.attendedClasses + simCount
        : targetSimSubject.attendedClasses;
    const projStats = calculateAttendanceStats(newAttended, newTotal);

    // Also project aggregate
    const newAggTotal = dual.totalConducted + simCount;
    const newAggAttended = simAction === 'attend' ? dual.totalAttended + simCount : dual.totalAttended;
    const projAggPct = newAggTotal > 0 ? Math.round((newAggAttended / newAggTotal) * 1000) / 10 : 100;

    simResult = {
      currentPct: currStats.percentage,
      projectedPct: projStats.percentage,
      currentSafe: currStats.isSafe,
      projectedSafe: projStats.isSafe,
      label: targetSimSubject.name,
      projectedAggregatePct: projAggPct,
    };
  } else {
    // Aggregate simulation
    const newAggTotal = dual.totalConducted + simCount;
    const newAggAttended = simAction === 'attend' ? dual.totalAttended + simCount : dual.totalAttended;
    const projAggPct = newAggTotal > 0 ? Math.round((newAggAttended / newAggTotal) * 1000) / 10 : 100;

    simResult = {
      currentPct: dual.aggregatePercentage,
      projectedPct: projAggPct,
      currentSafe: dual.isAggregateSafe,
      projectedSafe: projAggPct >= 75,
      label: 'Overall Aggregate',
      projectedAggregatePct: projAggPct,
    };
  }

  return (
    <div className="space-y-4" id="attendance-module">
      {/* 1. DUAL CRITERIA KPI CARDS: Aggregate & Subject-Wise Independent */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Aggregate (Overall) Attendance */}
        <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                Criterion 1 of 2
              </span>
              <h2 className="text-xs text-zinc-400 uppercase font-bold tracking-tight mt-0.5">
                Overall Aggregate
              </h2>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                dual.isAggregateSafe
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  : 'bg-rose-950/40 text-rose-400 border-rose-900/50'
              }`}
            >
              {dual.isAggregateSafe ? 'AGGREGATE CLEARED' : 'AGGREGATE SHORTAGE'}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl font-bold font-mono ${
                  dual.isAggregateSafe ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {dual.aggregatePercentage}%
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                ({dual.totalAttended}/{dual.totalConducted} classes)
              </span>
            </div>

            {/* Aggregate bar with 75% tick */}
            <div className="relative w-full bg-zinc-800 h-1.5 rounded overflow-hidden mt-2">
              <div
                className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-white/70 z-10"
                title="75% Cutoff"
              />
              <div
                className={`h-full transition-all duration-500 ${
                  dual.isAggregateSafe ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(dual.aggregatePercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 pt-2 border-t border-[#27272a] flex items-center justify-between">
            <span>Missed: {dual.totalMissed}</span>
            <span className={dual.isAggregateSafe ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {dual.isAggregateSafe
                ? `Buffer: ${dual.aggregateCanBunk} bunkable`
                : `Need: ${dual.aggregateToAttend} classes`}
            </span>
          </div>
        </div>

        {/* Card 2: Subject-Wise Independent Compliance */}
        <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                Criterion 2 of 2
              </span>
              <h2 className="text-xs text-zinc-400 uppercase font-bold tracking-tight mt-0.5">
                Subject-Wise Independent
              </h2>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                dual.shortageSubjectsCount === 0
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                  : 'bg-rose-950/40 text-rose-400 border-rose-900/50'
              }`}
            >
              {dual.shortageSubjectsCount === 0 ? 'ALL CLEAR' : `${dual.shortageSubjectsCount} SHORTAGE`}
            </span>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-bold text-emerald-400">
                {dual.safeSubjectsCount}
              </span>
              <span className="text-xs text-zinc-400">of {dual.totalSubjects} SUBJECTS ≥ 75%</span>
            </div>

            {dual.shortageSubjectsCount > 0 ? (
              <div className="mt-2 text-[11px] text-rose-400 font-mono bg-rose-950/20 border border-rose-900/40 px-2 py-1 rounded">
                ⚠️ Deficit: {dual.shortageSubjects.map((s) => `${s.name} (${s.percentage}%)`).join(', ')}
              </div>
            ) : (
              <div className="mt-2 text-[11px] text-emerald-400 font-mono bg-emerald-950/20 border border-emerald-900/40 px-2 py-1 rounded">
                ✓ Every subject clears independent 75% cutoff
              </div>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 pt-2 border-t border-[#27272a]">
            Independent 75% required per exam syllabus
          </div>
        </div>

        {/* Card 3: Dual Examination Clearance Status & Quick Actions */}
        <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] flex flex-col justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase font-bold tracking-tighter">
              Semester Exam Eligibility Verdict
            </div>

            <div className="mt-2">
              {dual.complianceStatus === 'FULL_CLEARANCE' && (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">FULL CLEARANCE</p>
                    <p className="text-[11px] text-zinc-400">Cleared for all end-sem exams</p>
                  </div>
                </div>
              )}

              {dual.complianceStatus === 'PARTIAL_SHORTAGE' && (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-400">PARTIAL SHORTAGE RISK</p>
                    <p className="text-[11px] text-zinc-400">
                      Aggregate safe, but {dual.shortageSubjectsCount} subject(s) in shortage
                    </p>
                  </div>
                </div>
              )}

              {dual.complianceStatus === 'CRITICAL_SHORTAGE' && (
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-rose-400">CRITICAL DETENTION RISK</p>
                    <p className="text-[11px] text-zinc-400">Overall aggregate below 75% cutoff</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#27272a]">
            <button
              id="add-subject-btn"
              onClick={handleOpenAdd}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              + SUBJECT
            </button>
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold border transition-colors flex items-center gap-1 ${
                showSimulator
                  ? 'bg-zinc-800 text-indigo-400 border-indigo-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
              title="Attendance Simulator / What-If Projection"
            >
              <Calculator className="w-3.5 h-3.5" />
              SIMULATOR
            </button>
            <button
              onClick={() => setShowRuleInfo(!showRuleInfo)}
              className={`p-1.5 rounded text-xs border transition-colors ${
                showRuleInfo
                  ? 'bg-zinc-800 text-indigo-400 border-indigo-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
              title="Dual 75% Rule Guide & Formula"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. DUAL 75% RULE EXPLAINER (COLLAPSIBLE) */}
      {showRuleInfo && (
        <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              University Dual 75% Attendance Regulation & Formula Guide
            </h3>
            <button
              onClick={() => setShowRuleInfo(false)}
              className="text-zinc-400 hover:text-zinc-200 font-mono"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-300">
            <div className="p-2.5 bg-zinc-900/80 rounded border border-[#27272a]">
              <p className="font-bold text-zinc-100 mb-1">1. Aggregate Rule (Overall)</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Total attended across all subjects divided by total conducted classes must be ≥ 75.0%.
                Failing aggregate leads to general semester detention.
              </p>
            </div>
            <div className="p-2.5 bg-zinc-900/80 rounded border border-[#27272a]">
              <p className="font-bold text-zinc-100 mb-1">2. Independent Subject-Wise Rule</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Each individual course requires ≥ 75.0% attendance. Even with 85% aggregate, dropping below 75%
                in any single subject leads to debarment/shortage in that subject's exam.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/60 p-2 rounded flex flex-wrap gap-4">
            <span>Safe Bunk = ⌊(4A - 3T) / 3⌋</span>
            <span>Consecutive Classes to Attend = ⌈3T - 4A⌉</span>
            <span className="text-zinc-500">(Where A = Attended, T = Total conducted)</span>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE "WHAT-IF" SIMULATOR */}
      {showSimulator && (
        <div className="p-4 rounded-lg bg-zinc-900 border border-indigo-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Attendance What-If Projection Simulator
              </h3>
            </div>
            <button
              onClick={() => setShowSimulator(false)}
              className="text-zinc-500 hover:text-zinc-300 font-mono text-xs"
            >
              CLOSE ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Select Target</label>
              <select
                value={simSubjectId}
                onChange={(e) => setSimSubjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="aggregate">★ Overall Aggregate</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({calculateAttendanceStats(s.attendedClasses, s.totalClasses).percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Action</label>
              <div className="grid grid-cols-2 gap-1 bg-[#09090b] p-1 rounded border border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setSimAction('attend')}
                  className={`py-1 rounded font-mono font-bold text-center ${
                    simAction === 'attend' ? 'bg-emerald-950 text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  + Attend
                </button>
                <button
                  type="button"
                  onClick={() => setSimAction('bunk')}
                  className={`py-1 rounded font-mono font-bold text-center ${
                    simAction === 'bunk' ? 'bg-rose-950 text-rose-400' : 'text-zinc-400'
                  }`}
                >
                  - Bunk
                </button>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">
                Number of Classes: <strong className="text-zinc-100 font-mono">{simCount}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="15"
                value={simCount}
                onChange={(e) => setSimCount(parseInt(e.target.value) || 1)}
                className="w-full accent-indigo-500 mt-2"
              />
            </div>

            {/* Live Simulation Output */}
            <div className="p-2.5 rounded bg-[#09090b] border border-[#27272a] flex flex-col justify-center font-mono">
              <div className="text-[10px] text-zinc-500 uppercase">
                {simResult.label} Projection
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-zinc-400 line-through">{simResult.currentPct}%</span>
                <span className="text-zinc-500">➔</span>
                <span
                  className={`text-base font-bold ${
                    simResult.projectedSafe ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simResult.projectedPct}%
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    simResult.projectedSafe
                      ? 'bg-emerald-950/60 text-emerald-400'
                      : 'bg-rose-950/60 text-rose-400'
                  }`}
                >
                  {simResult.projectedSafe ? '✓ SAFE' : '⚠️ SHORTAGE'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Projected Aggregate: {simResult.projectedAggregatePct}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FILTER & VIEW MODE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a] text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              filterMode === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setFilterMode('shortage')}
            className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              filterMode === 'shortage'
                ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-900/50'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            ⚠️ Shortage (&lt; 75%) ({dual.shortageSubjectsCount})
          </button>
          <button
            onClick={() => setFilterMode('safe')}
            className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              filterMode === 'safe'
                ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-900/50'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            ✓ Safe (≥ 75%) ({dual.safeSubjectsCount})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'table' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Independent Compliance Table View"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5. VIEW MODE A: CARD GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => {
            const stats = calculateAttendanceStats(sub.attendedClasses, sub.totalClasses);
            const missedClasses = Math.max(0, sub.totalClasses - sub.attendedClasses);

            return (
              <div
                key={sub.id}
                id={`subject-card-${sub.id}`}
                className={`p-4 rounded-lg bg-[#18181b] border ${
                  stats.isSafe ? 'border-[#27272a]' : 'border-rose-900/50 bg-rose-950/5'
                } flex flex-col justify-between space-y-3 transition-colors`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{sub.name}</h3>
                      {sub.professor && (
                        <p className="text-xs text-zinc-500 mt-0.5">{sub.professor}</p>
                      )}
                    </div>

                    {/* Percentage & Margin Badges */}
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          stats.isSafe
                            ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                            : 'bg-rose-950/50 text-rose-400 border border-rose-900/50'
                        }`}
                      >
                        {stats.percentage}%
                      </span>
                      <p
                        className={`text-[10px] font-mono mt-0.5 ${
                          stats.margin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stats.margin >= 0 ? `+${stats.margin}% buffer` : `${stats.margin}% shortage`}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar with 75% tick marker */}
                  <div className="space-y-1.5 mt-3">
                    <div className="relative w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                      {/* 75% tick line */}
                      <div
                        className="absolute top-0 bottom-0 left-[75%] w-0.5 bg-white/80 z-10"
                        title="75% Attendance Cutoff"
                      />
                      <div
                        className={`h-full transition-all duration-500 ${
                          stats.isSafe ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                      />
                    </div>

                    {/* Classes Counts */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>
                        Attended: <strong className="text-zinc-200">{sub.attendedClasses}</strong>/{sub.totalClasses}
                      </span>
                      <span>
                        Missed: <strong className="text-zinc-400">{missedClasses}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Independent Math Recommendation */}
                <div
                  className={`p-2.5 rounded border text-[11px] font-mono leading-relaxed flex items-center gap-2 ${
                    stats.isSafe
                      ? 'bg-zinc-900/80 border-emerald-900/30 text-emerald-300'
                      : 'bg-zinc-900/80 border-rose-900/40 text-rose-300'
                  }`}
                >
                  {stats.isSafe ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <div className="truncate">
                    {stats.isSafe
                      ? `Safe to bunk next ${stats.classesCanBunk} class${stats.classesCanBunk > 1 ? 'es' : ''}`
                      : `Attend next ${stats.classesToAttend} class${stats.classesToAttend > 1 ? 'es' : ''} consecutively`}
                  </div>
                </div>

                {/* 1-Tap Attendance Buttons */}
                <div className="pt-2 border-t border-[#27272a] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <button
                      id={`sub-${sub.id}-attended-btn`}
                      onClick={() => recordAttendance(sub.id, 'attended')}
                      className="flex-1 py-1.5 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1"
                      title="Record class attended (+1 attended, +1 conducted)"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      +1 ATT
                    </button>
                    <button
                      id={`sub-${sub.id}-missed-btn`}
                      onClick={() => recordAttendance(sub.id, 'missed')}
                      className="flex-1 py-1.5 px-2 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1"
                      title="Record class missed (+1 conducted only)"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                      +1 MIS
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Edit subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject "${sub.name}"?`)) {
                          deleteSubject(sub.id);
                        }
                      }}
                      className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                      title="Delete subject"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. VIEW MODE B: INDEPENDENT COMPLIANCE TABLE */}
      {viewMode === 'table' && (
        <section className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] font-mono uppercase text-zinc-500 border-b border-[#27272a]">
                <tr>
                  <th className="py-2.5 px-3">Subject & Faculty</th>
                  <th className="py-2.5 px-3 text-center">Conducted</th>
                  <th className="py-2.5 px-3 text-center">Attended</th>
                  <th className="py-2.5 px-3 text-center">Missed</th>
                  <th className="py-2.5 px-3 text-right">Attendance %</th>
                  <th className="py-2.5 px-3 text-right">Margin</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Action Required</th>
                  <th className="py-2.5 px-3 text-center">Quick Log</th>
                  <th className="py-2.5 px-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {filteredSubjects.map((sub) => {
                  const stats = calculateAttendanceStats(sub.attendedClasses, sub.totalClasses);
                  const missed = Math.max(0, sub.totalClasses - sub.attendedClasses);

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-zinc-900/50 transition-colors ${
                        !stats.isSafe ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-zinc-200">{sub.name}</p>
                        {sub.professor && <p className="text-[11px] text-zinc-500">{sub.professor}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{sub.totalClasses}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-zinc-200">
                        {sub.attendedClasses}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-zinc-400">{missed}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          stats.isSafe ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stats.percentage}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono ${
                          stats.margin >= 0 ? 'text-emerald-400' : 'text-rose-400 font-bold'
                        }`}
                      >
                        {stats.margin >= 0 ? `+${stats.margin}%` : `${stats.margin}%`}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            stats.isSafe
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                              : 'bg-rose-950/50 text-rose-400 border border-rose-900/50'
                          }`}
                        >
                          {stats.isSafe ? 'CLEARED' : 'SHORTAGE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {stats.isSafe ? (
                          <span className="text-emerald-400">Can bunk {stats.classesCanBunk} class(es)</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">
                            Attend next {stats.classesToAttend} class(es)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => recordAttendance(sub.id, 'attended')}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-[10px] font-mono font-bold"
                            title="Record Attended"
                          >
                            +ATT
                          </button>
                          <button
                            onClick={() => recordAttendance(sub.id, 'missed')}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-[10px] font-mono font-bold"
                            title="Record Missed"
                          >
                            +MIS
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete subject "${sub.name}"?`)) {
                                deleteSubject(sub.id);
                              }
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add / Edit Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            id="subject-form-modal"
            className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microeconomics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Professor / Faculty Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alex Morgan"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1 font-sans">
                    Total Conducted Classes
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.totalClasses}
                    onChange={(e) => setFormData({ ...formData, totalClasses: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1 font-sans">
                    Attended Classes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalClasses}
                    required
                    value={formData.attendedClasses}
                    onChange={(e) => setFormData({ ...formData, attendedClasses: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
