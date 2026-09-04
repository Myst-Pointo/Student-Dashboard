import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  ExternalLink,
  Trash2,
  CalendarCheck2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  DownloadCloud,
  UploadCloud,
  LogOut,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { GoogleCalendarEvent, GoogleCalendarEventInput } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';
import { ConfirmationModal } from './ConfirmationModal';

export const GoogleCalendarView: React.FC = () => {
  const {
    isGoogleConnected,
    googleUserEmail,
    googleUserName,
    googleUserPhoto,
    googleCalendars,
    selectedCalendarId,
    setSelectedCalendarId,
    googleEvents,
    loadingGCal,
    gCalError,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    refreshGoogleCalendar,
    createGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
    syncAllDeadlinesToGCal,
    importGoogleEventToAcademic,
    events: academicEvents,
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRange, setFilterRange] = useState<'all' | 'today' | 'week'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation modal states for mutating Workspace operations (Safety Requirement)
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<GoogleCalendarEvent | null>(null);
  const [batchSyncConfirmOpen, setBatchSyncConfirmOpen] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState<GoogleCalendarEventInput & { isAllDay: boolean; startTime: string; endTime: string; startDate: string; endDate: string }>({
    summary: '',
    description: '',
    location: '',
    isAllDay: false,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date().toISOString().substring(0, 10),
    startTime: '10:00',
    endTime: '11:00',
    start: {},
    end: {},
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConnect = async () => {
    try {
      await connectGoogleCalendar();
      showToast('Successfully connected to Google Calendar!');
    } catch (err: any) {
      // Error handled in context
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.summary.trim()) return;

    setSubmitting(true);
    try {
      const payload: GoogleCalendarEventInput = {
        summary: newEvent.summary.trim(),
        description: newEvent.description?.trim() || undefined,
        location: newEvent.location?.trim() || undefined,
        start: newEvent.isAllDay
          ? { date: newEvent.startDate }
          : { dateTime: new Date(`${newEvent.startDate}T${newEvent.startTime}:00`).toISOString() },
        end: newEvent.isAllDay
          ? {
              date:
                newEvent.endDate === newEvent.startDate
                  ? (() => {
                      const next = new Date(newEvent.startDate);
                      next.setDate(next.getDate() + 1);
                      return next.toISOString().substring(0, 10);
                    })()
                  : newEvent.endDate,
            }
          : { dateTime: new Date(`${newEvent.endDate}T${newEvent.endTime}:00`).toISOString() },
      };

      await createGoogleCalendarEvent(payload);
      showToast(`Event "${newEvent.summary}" created in Google Calendar!`);
      setIsAddModalOpen(false);
      setNewEvent({
        summary: '',
        description: '',
        location: '',
        isAllDay: false,
        startDate: new Date().toISOString().substring(0, 10),
        endDate: new Date().toISOString().substring(0, 10),
        startTime: '10:00',
        endTime: '11:00',
        start: {},
        end: {},
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe deletion with confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmEvent) return;
    setSubmitting(true);
    try {
      await deleteGoogleCalendarEvent(deleteConfirmEvent.id);
      showToast(`Deleted "${deleteConfirmEvent.summary}" from Google Calendar`);
      setDeleteConfirmEvent(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete event');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe batch sync with confirmation
  const handleConfirmBatchSync = async () => {
    setSubmitting(true);
    try {
      const result = await syncAllDeadlinesToGCal();
      showToast(`Synced ${result.synced} deadlines to Google Calendar${result.failed ? ` (${result.failed} failed)` : ''}!`);
      setBatchSyncConfirmOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to batch sync events');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (gEvent: GoogleCalendarEvent) => {
    try {
      await importGoogleEventToAcademic(gEvent);
      showToast(`Imported "${gEvent.summary}" into Academic Planner!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to import event');
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().substring(0, 10);

    return googleEvents.filter((evt) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.summary?.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchLoc = evt.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      // Date range
      const evtDate = evt.start.date || (evt.start.dateTime ? evt.start.dateTime.substring(0, 10) : '');
      if (filterRange === 'today') {
        return evtDate === todayStr;
      }
      if (filterRange === 'week') {
        return evtDate >= todayStr && evtDate <= in7DaysStr;
      }

      return true;
    });
  }, [googleEvents, searchQuery, filterRange]);

  const activeDeadlinesCount = academicEvents.filter((e) => !e.done).length;

  if (!isGoogleConnected) {
    return (
      <div id="google-calendar-disconnected" className="space-y-6">
        {/* Banner */}
        <div className="p-8 rounded-xl bg-gradient-to-br from-[#121215] to-[#18181b] border border-[#27272a] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-medium mb-4">
              <CalendarCheck2 className="w-3.5 h-3.5" />
              Google Calendar Live Integration
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-3">
              Sync Academic Deadlines Directly to Google Calendar
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Connect your Google account to automatically export exam timetables, assignment
              submissions, and university schedules. View your real-time Google Calendar events
              alongside your 75% attendance criteria and student finance goals.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <GoogleSignInButton
                onClick={handleConnect}
                loading={loadingGCal}
                text="Sign in with Google"
              />
              <span className="text-xs text-zinc-500">
                Requires standard Calendar read/write permissions
              </span>
            </div>

            {gCalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{gCalError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg bg-[#121215] border border-[#27272a]">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">1-Click Deadlines Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly push midterms, assignments, and presentations to your primary Google
              Calendar with pre-configured alerts.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#121215] border border-[#27272a]">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">Import Schedule Events</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pull events from your Google Calendar directly into the Student OS Academic Planner
              for unified schedule tracking.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#121215] border border-[#27272a]">
            <div className="w-9 h-9 rounded-lg bg-amber-600/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">Real-time Bi-directional View</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Manage your personal and academic events from a single screen with live sync status
              indicators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="google-calendar-connected-view" className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="gcal-toast"
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xl border border-indigo-500 flex items-center gap-2 animate-in slide-in-from-bottom-2"
        >
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Account & Sync Header */}
      <div className="p-5 rounded-xl bg-[#121215] border border-[#27272a] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {googleUserPhoto ? (
            <img
              src={googleUserPhoto}
              alt="Google Avatar"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {googleUserName ? googleUserName.charAt(0).toUpperCase() : 'G'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                {googleUserName || 'Google Account'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">{googleUserEmail}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Calendar Selector */}
          {googleCalendars.length > 1 && (
            <select
              id="select-google-calendar"
              value={selectedCalendarId}
              onChange={(e) => {
                setSelectedCalendarId(e.target.value);
                setTimeout(refreshGoogleCalendar, 50);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {googleCalendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary} {cal.primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            id="refresh-gcal-btn"
            onClick={refreshGoogleCalendar}
            disabled={loadingGCal}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-300 hover:text-white transition-colors"
            title="Refresh Google Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${loadingGCal ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            type="button"
            id="batch-sync-deadlines-btn"
            onClick={() => setBatchSyncConfirmOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Export Deadlines ({activeDeadlinesCount})</span>
          </button>

          <button
            type="button"
            id="add-gcal-event-modal-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>

          <button
            type="button"
            id="disconnect-gcal-btn"
            onClick={disconnectGoogleCalendar}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-[#27272a] hover:border-rose-500/20 transition-colors"
            title="Disconnect Google Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            id="search-gcal-input"
            type="text"
            placeholder="Search Google events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#121215] border border-[#27272a] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#121215] border border-[#27272a] self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setFilterRange('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterRange === 'all'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Events ({googleEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRange('week')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterRange === 'week'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Next 7 Days
          </button>
          <button
            type="button"
            onClick={() => setFilterRange('today')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterRange === 'today'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Events List */}
      {loadingGCal && googleEvents.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
          Fetching Google Calendar events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#121215] border border-[#27272a] text-zinc-500 text-xs">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
          <p className="text-zinc-300 font-medium mb-1">No Google Calendar events found</p>
          <p className="text-zinc-500">
            {searchQuery
              ? 'No events match your search criteria.'
              : 'Add a new event or export your academic deadlines above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const startRaw = evt.start.dateTime || evt.start.date || '';
            const isAllDay = !evt.start.dateTime;
            const dateObj = new Date(startRaw);

            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            const formattedTime = isAllDay
              ? 'All Day'
              : dateObj.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });

            return (
              <div
                key={evt.id}
                id={`gcal-event-${evt.id}`}
                className="p-4 rounded-xl bg-[#121215] border border-[#27272a] hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase leading-none text-zinc-400">
                      {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold leading-none mt-1">
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-zinc-100">{evt.summary}</h4>
                      {isAllDay && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                          All Day
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {formattedDate} • {formattedTime}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          {evt.location}
                        </span>
                      )}
                    </div>

                    {evt.description && (
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-2 max-w-xl">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleImport(evt)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                    title="Import to Student OS Planner"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Import</span>
                  </button>

                  {evt.htmlLink && (
                    <a
                      href={evt.htmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="Open in Google Calendar"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Explicit User Confirmation Trigger for Deletion */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmEvent(evt)}
                    className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
                    title="Delete from Google Calendar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Event on Google Calendar */}
      {isAddModalOpen && (
        <div
          id="add-gcal-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            id="add-gcal-modal-dialog"
            className="w-full max-w-lg bg-[#121215] border border-[#27272a] rounded-xl shadow-2xl p-6 relative"
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Create Google Calendar Event</h3>
                <p className="text-xs text-zinc-400">
                  Adds directly to your primary Google Calendar
                </p>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="mb-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                Quick Template:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Midterm Exam', icon: '📝' },
                  { label: 'Assignment Due', icon: '⏰' },
                  { label: 'Study Group', icon: '📚' },
                  { label: 'Lab Practical', icon: '🔬' },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() =>
                      setNewEvent((prev) => ({
                        ...prev,
                        summary: `${tpl.icon} ${tpl.label}: `,
                      }))
                    }
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS201 Algorithms Final Exam"
                  value={newEvent.summary}
                  onChange={(e) => setNewEvent({ ...newEvent, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) =>
                      setNewEvent({
                        ...newEvent,
                        startDate: e.target.value,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all-day-checkbox"
                  checked={newEvent.isAllDay}
                  onChange={(e) => setNewEvent({ ...newEvent, isAllDay: e.target.checked })}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 bg-[#18181b]"
                />
                <label htmlFor="all-day-checkbox" className="text-xs text-zinc-300">
                  All-day event
                </label>
              </div>

              {!newEvent.isAllDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Lecture Hall 4B, Campus West"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional event details, syllabus chapters, or preparation notes..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#18181b] border border-[#27272a] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving to Google...' : 'Add to Google Calendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit User Confirmation Modal for Event Deletion (Workspace Safety Mandate) */}
      <ConfirmationModal
        isOpen={Boolean(deleteConfirmEvent)}
        onClose={() => setDeleteConfirmEvent(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Google Calendar Event?"
        description={`Are you sure you want to delete "${deleteConfirmEvent?.summary}" from your Google Calendar? This action will permanently remove the event from your account.`}
        confirmLabel="Delete from Calendar"
        confirmVariant="danger"
        loading={submitting}
      />

      {/* Explicit User Confirmation Modal for Batch Export (Workspace Safety Mandate) */}
      <ConfirmationModal
        isOpen={batchSyncConfirmOpen}
        onClose={() => setBatchSyncConfirmOpen(false)}
        onConfirm={handleConfirmBatchSync}
        title="Export All Deadlines to Google Calendar?"
        description={`This will export ${activeDeadlinesCount} pending academic exams and assignments from your Student OS Planner to your primary Google Calendar.`}
        confirmLabel="Export Deadlines"
        confirmVariant="primary"
        loading={submitting}
      />
    </div>
  );
};
