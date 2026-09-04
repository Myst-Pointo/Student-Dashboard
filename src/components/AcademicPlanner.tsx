import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  AlertCircle,
  CalendarDays,
  ListFilter,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  User,
  CalendarCheck2,
  UploadCloud,
  ExternalLink,
  Pencil,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { AcademicEvent, EventCategory, OfficialAcademicMilestone, Priority } from '../types';
import { isDueWithin48Hours } from '../utils/dashboardUtils';
import { WEEKLY_CLASS_SCHEDULE } from '../data/academicData';
import { GoogleCalendarView } from './GoogleCalendarView';

export const AcademicPlanner: React.FC = () => {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleEventDone,
    isGoogleConnected,
    syncAcademicEventToGCal,
    officialMilestones,
    addOfficialMilestone,
    updateOfficialMilestone,
    deleteOfficialMilestone,
    resetOfficialMilestones,
  } = useDashboard();

  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedSemester, setSelectedSemester] = useState<'all' | 1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<'all' | EventCategory>('all');
  const [showDone, setShowDone] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'events' | 'google-calendar' | 'timetable' | 'academic-dates'>('events');
  const [syncingEventId, setSyncingEventId] = useState<string | null>(null);

  // Official Milestone Modal state
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<OfficialAcademicMilestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    semester1: '',
    semester2: '',
    notes: '',
    isHighlighted: false,
  });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Month navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-01'));

  // Event modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [syncToGoogleOnSubmit, setSyncToGoogleOnSubmit] = useState(false);
  const [formState, setFormState] = useState<{
    title: string;
    date: string;
    endDate: string;
    priority: Priority;
    category: EventCategory;
    done: boolean;
    notes: string;
    semester: number;
  }>({
    title: '',
    date: '2026-09-15',
    endDate: '',
    priority: 'Medium',
    category: 'Assignment',
    done: false,
    notes: '',
    semester: 1,
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormState({
      title: '',
      date: new Date().toISOString().substring(0, 10),
      endDate: '',
      priority: 'Medium',
      category: 'Assignment',
      done: false,
      notes: '',
      semester: selectedSemester === 'all' ? 1 : selectedSemester,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.date) return;

    if (editingEvent) {
      await updateEvent(editingEvent.id, {
        title: formState.title.trim(),
        date: formState.date,
        endDate: formState.endDate || undefined,
        priority: formState.priority,
        category: formState.category,
        done: formState.done,
        notes: formState.notes.trim() || undefined,
        semester: Number(formState.semester),
      });
    } else {
      await addEvent({
        title: formState.title.trim(),
        date: formState.date,
        endDate: formState.endDate || undefined,
        priority: formState.priority,
        category: formState.category,
        done: formState.done,
        notes: formState.notes.trim() || undefined,
        semester: Number(formState.semester),
      });
    }
    setModalOpen(false);
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (selectedSemester !== 'all' && e.semester !== selectedSemester) return false;
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (!showDone && e.done) return false;
    return true;
  });

  // Monthly calendar calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayIndex = (firstDay.getDay() + 6) % 7; // Monday index = 0

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-4" id="academic-calendar-module">
      {/* Subtabs bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('events')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'events'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Planner & Calendar
          </button>
          <button
            id="subtab-google-calendar-btn"
            onClick={() => setActiveSubTab('google-calendar')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'google-calendar'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            Google Calendar
            {isGoogleConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('timetable')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'timetable'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Weekly Schedule
          </button>
          <button
            onClick={() => setActiveSubTab('academic-dates')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'academic-dates'
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Official Milestones (Sem 1 & 2)
          </button>
        </div>

        <button
          id="add-event-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          + EVENT
        </button>
      </div>

      {activeSubTab === 'events' && (
        <>
          {/* Controls Bar: View Toggle, Filters, Semester */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
            {/* View Mode & Month Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#09090b] p-1 rounded border border-[#27272a]">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'monthly' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    viewMode === 'weekly' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  List / Weekly
                </button>
              </div>

              {viewMode === 'monthly' && (
                <div className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded border border-[#27272a]">
                  <button
                    onClick={prevMonth}
                    className="p-0.5 rounded text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-zinc-200 px-2 min-w-28 text-center">
                    {monthName}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="p-0.5 rounded text-zinc-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Category Tags & Semester filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded border border-[#27272a] text-xs">
                {(['all', 'Exam', 'Assignment', 'Project', 'Class Schedule'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                      selectedCategory === cat
                        ? 'bg-zinc-800 text-zinc-100 font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Tags' : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded border border-[#27272a] text-xs font-mono">
                <button
                  onClick={() => setSelectedSemester('all')}
                  className={`px-2 py-0.5 rounded ${
                    selectedSemester === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedSemester(1)}
                  className={`px-2 py-0.5 rounded ${
                    selectedSemester === 1 ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sem 1
                </button>
                <button
                  onClick={() => setSelectedSemester(2)}
                  className={`px-2 py-0.5 rounded ${
                    selectedSemester === 2 ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sem 2
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-zinc-400 ml-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDone}
                  onChange={(e) => setShowDone(e.target.checked)}
                  className="rounded border-[#27272a] bg-[#09090b] text-indigo-600"
                />
                Show Done
              </label>
            </div>
          </div>

          {/* 48-Hour Urgent Warning Notice if any */}
          {(() => {
            const urgent = filteredEvents.filter((e) => !e.done && isDueWithin48Hours(e.date).isWithin);
            if (urgent.length === 0) return null;

            return (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                      URGENT DEADLINES (&lt; 48 HOURS)
                    </h4>
                    <p className="text-xs text-amber-200/90 mt-0.5">
                      {urgent.map((u) => `"${u.title}" (${u.date})`).join(' • ')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Monthly Grid View */}
          {viewMode === 'monthly' && (
            <div className="p-4 rounded-lg bg-[#18181b] border border-[#27272a]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider pb-2 border-b border-[#27272a]">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Grid cells */}
              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {/* Blank cells for starting day offset */}
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                  <div key={`blank-${i}`} className="min-h-20 p-1.5 rounded bg-zinc-900/30 border border-transparent" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isToday = dayDateStr === new Date().toISOString().substring(0, 10);
                  const daysEvents = filteredEvents.filter((e) => e.date === dayDateStr);

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`min-h-20 p-1.5 rounded border flex flex-col justify-between transition-colors ${
                        isToday
                          ? 'bg-indigo-950/20 border-indigo-500/50'
                          : 'bg-zinc-900/60 border-[#27272a] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-mono font-bold ${
                            isToday ? 'px-1 rounded bg-indigo-600 text-white' : 'text-zinc-400'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {daysEvents.length > 0 && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {daysEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Events for this day */}
                      <div className="space-y-1 mt-1 flex-1">
                        {daysEvents.slice(0, 2).map((ev) => {
                          const proximity = isDueWithin48Hours(ev.date);
                          return (
                            <div
                              key={ev.id}
                              onClick={() => toggleEventDone(ev.id)}
                              className={`text-[10px] px-1 py-0.5 rounded font-mono truncate cursor-pointer transition-colors ${
                                ev.done
                                  ? 'bg-zinc-800 text-zinc-600 line-through'
                                  : proximity.isWithin
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold'
                                  : ev.category === 'Exam'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-900/40'
                                  : ev.category === 'Assignment'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-900/40'
                                  : 'bg-indigo-950/60 text-indigo-300 border border-indigo-900/40'
                              }`}
                              title={`${ev.title} - ${ev.category}`}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {daysEvents.length > 2 && (
                          <div className="text-[9px] text-zinc-500 text-center font-mono">
                            +{daysEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly / List View */}
          {viewMode === 'weekly' && (
            <div className="space-y-2">
              {filteredEvents.map((evt) => {
                const proximity = isDueWithin48Hours(evt.date);
                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 ${
                      evt.done
                        ? 'bg-zinc-900/30 border-[#27272a] opacity-50'
                        : proximity.isWithin
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-[#18181b] border-[#27272a] hover:border-zinc-700'
                    }`}
                  >
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleEventDone(evt.id)}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors"
                      >
                        {evt.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                              evt.category === 'Exam'
                                ? 'bg-rose-950/60 text-rose-400 border-rose-900/50'
                                : evt.category === 'Assignment'
                                ? 'bg-amber-950/60 text-amber-400 border-amber-900/50'
                                : 'bg-indigo-950/60 text-indigo-400 border-indigo-900/50'
                            }`}
                          >
                            {evt.category}
                          </span>

                          <span className="text-[10px] font-mono text-zinc-500">
                            {evt.priority} Priority
                          </span>

                          {proximity.isWithin && !evt.done && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950">
                              {proximity.badgeText}
                            </span>
                          )}

                          {evt.semester && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Sem {evt.semester}
                            </span>
                          )}
                        </div>

                        <h3 className={`text-xs font-bold ${evt.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {evt.title}
                        </h3>

                        {evt.notes && (
                          <p className="text-[11px] text-zinc-400 truncate max-w-xl">{evt.notes}</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Date & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-[11px]">
                        <div className="font-bold text-zinc-300">{evt.date}</div>
                        {evt.endDate && <div className="text-zinc-500 text-[10px]">to {evt.endDate}</div>}
                      </div>

                      {/* Google Calendar Sync Icon/Action */}
                      {evt.googleCalendarHtmlLink ? (
                        <a
                          href={evt.googleCalendarHtmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-emerald-400 hover:bg-zinc-800 transition-colors"
                          title="Synced to Google Calendar (Click to open)"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5" />
                        </a>
                      ) : isGoogleConnected ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setSyncingEventId(evt.id);
                            try {
                              await syncAcademicEventToGCal(evt);
                            } finally {
                              setSyncingEventId(null);
                            }
                          }}
                          disabled={syncingEventId === evt.id}
                          className="p-1 rounded text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
                          title="Push to Google Calendar"
                        >
                          <UploadCloud className={`w-3.5 h-3.5 ${syncingEventId === evt.id ? 'animate-bounce text-indigo-400' : ''}`} />
                        </button>
                      ) : null}

                      <button
                        onClick={() => {
                          if (confirm(`Delete event "${evt.title}"?`)) {
                            deleteEvent(evt.id);
                          }
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="p-8 text-center rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-500 text-xs font-mono">
                  No academic events found matching your filter criteria.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Subtab: Google Calendar Live Sync View */}
      {activeSubTab === 'google-calendar' && (
        <GoogleCalendarView />
      )}

      {/* Subtab 2: Weekly Schedule Timetable */}
      {activeSubTab === 'timetable' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest">
              Weekly Class Timetable
            </h3>
            <p className="text-[11px] text-zinc-500">Regular college lecture hours (Monday to Saturday)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const).map((day) => {
              const dayClasses = WEEKLY_CLASS_SCHEDULE.filter((c) => c.day === day);
              return (
                <div key={day} className="p-3 rounded bg-zinc-900/70 border border-[#27272a] space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#27272a]">
                    <span className="text-xs font-bold text-indigo-400 uppercase font-mono">{day}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{dayClasses.length} lectures</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px]">
                    {dayClasses.map((item, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#18181b] border border-[#27272a] space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200 font-sans">{item.subject}</div>
                        <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                          <span>{item.faculty}</span>
                          <span className="text-indigo-400">{item.timeSlot}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 3: University Academic Calendar Milestones Table */}
      {activeSubTab === 'academic-dates' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a]/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase text-zinc-200 tracking-wider">
                  Official Academic Milestones (Sem 1 & 2)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                  Editable Schedule
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Semester milestones, class tests, festivals, and university examination schedules. Click edit to adjust or schedule next semester timelines.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditingMilestone(null);
                  setMilestoneForm({
                    title: '',
                    semester1: '',
                    semester2: '',
                    notes: '',
                    isHighlighted: false,
                  });
                  setMilestoneModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 rounded-md transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] rounded-md transition-colors"
                title="Reset to default official university academic milestones"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="text-[11px] font-mono uppercase text-zinc-400 border-b border-[#27272a] bg-zinc-900/80">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Event / Milestone Description</th>
                  <th className="py-3 px-3.5 font-semibold">Semester 1 (Autumn 2026)</th>
                  <th className="py-3 px-3.5 font-semibold">Semester 2 (Spring 2027)</th>
                  <th className="py-3 px-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 font-mono text-[11px]">
                {officialMilestones.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="py-3 px-3.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${m.isHighlighted ? 'text-indigo-200' : 'text-zinc-200'}`}>
                          {m.title}
                        </span>
                        {m.isHighlighted && (
                          <span className="px-1.5 py-0.2 text-[9px] font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded">
                            Key Milestone
                          </span>
                        )}
                      </div>
                      {m.notes && (
                        <p className="text-[11px] text-zinc-500 font-sans mt-0.5 leading-snug">
                          {m.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={m.isHighlighted ? 'text-indigo-300 font-medium' : 'text-zinc-300'}>
                        {m.semester1 || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={m.isHighlighted ? 'text-indigo-300 font-medium' : 'text-zinc-300'}>
                        {m.semester2 || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestone(m);
                            setMilestoneForm({
                              title: m.title,
                              semester1: m.semester1,
                              semester2: m.semester2,
                              notes: m.notes || '',
                              isHighlighted: Boolean(m.isHighlighted),
                            });
                            setMilestoneModalOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                          title="Edit this milestone"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOfficialMilestone(m.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {officialMilestones.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500 font-sans">
                      No milestones registered. Click "+ Add Milestone" or "Reset Defaults" to restore university defaults.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                {editingEvent ? 'Edit Academic Event' : 'New Academic Event / Task'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Event / Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microeconomics Class Test 1"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as EventCategory })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Exam">Exam</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Project">Project</option>
                    <option value="Class Schedule">Class Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={formState.priority}
                    onChange={(e) => setFormState({ ...formState, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-400 mb-1">
                  Notes / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Chapter coverage, syllabus guidelines..."
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="form-done-check"
                  checked={formState.done}
                  onChange={(e) => setFormState({ ...formState, done: e.target.checked })}
                  className="rounded border-[#27272a] bg-[#09090b] text-indigo-600"
                />
                <label htmlFor="form-done-check" className="text-xs text-zinc-300 font-medium">
                  Mark as Already Completed (Done)
                </label>
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
                  {editingEvent ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Official Academic Milestone Modal */}
      {milestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {editingMilestone ? 'Edit Academic Milestone' : 'Add Academic Milestone'}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Update dates for Semester 1 or add your upcoming next semester schedules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMilestoneModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!milestoneForm.title.trim()) return;
                if (editingMilestone) {
                  await updateOfficialMilestone(editingMilestone.id, {
                    title: milestoneForm.title.trim(),
                    semester1: milestoneForm.semester1.trim(),
                    semester2: milestoneForm.semester2.trim(),
                    notes: milestoneForm.notes.trim() || undefined,
                    isHighlighted: milestoneForm.isHighlighted,
                  });
                } else {
                  await addOfficialMilestone({
                    title: milestoneForm.title.trim(),
                    semester1: milestoneForm.semester1.trim(),
                    semester2: milestoneForm.semester2.trim(),
                    notes: milestoneForm.notes.trim() || undefined,
                    isHighlighted: milestoneForm.isHighlighted,
                  });
                }
                setMilestoneModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Event / Milestone Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class Test I, Summer Internship, Final Exams"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Semester 1 Dates / Duration (Autumn)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 21–24 September 2026 or 11-Aug to 28-Nov-2026"
                  value={milestoneForm.semester1}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, semester1: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Semester 2 Dates / Duration (Spring / Next Sem)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10–13 February 2027 or 05-Jan to 13-Apr-2027"
                  value={milestoneForm.semester2}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, semester2: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Notes / Curriculum Context (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Modules 1 & 2 only, or Practical examinations"
                  value={milestoneForm.notes}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#09090b] border border-[#27272a] text-zinc-100 placeholder-zinc-600 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="milestone-highlight-check"
                  checked={milestoneForm.isHighlighted}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, isHighlighted: e.target.checked })}
                  className="rounded border-[#27272a] bg-[#09090b] text-indigo-600"
                />
                <label htmlFor="milestone-highlight-check" className="text-xs text-zinc-300 font-medium cursor-pointer">
                  Mark as Key Milestone / Highlighted Timeline
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setMilestoneModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {editingMilestone ? 'Save Milestone' : 'Add Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Reset Official Milestones?</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This will restore the standard university calendar schedule for Semester 1 & 2.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272a]">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await resetOfficialMilestones();
                  setResetConfirmOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
