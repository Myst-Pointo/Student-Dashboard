export type TabType = 'overview' | 'attendance' | 'calendar' | 'finance' | 'fitness';

export interface AttendanceStats {
  percentage: number;
  isSafe: boolean;
  message: string;
  classesToAttend: number;
  classesCanBunk: number;
  margin: number;
}

export interface DualAttendanceOverview {
  totalConducted: number;
  totalAttended: number;
  totalMissed: number;
  aggregatePercentage: number;
  isAggregateSafe: boolean;
  aggregateCanBunk: number;
  aggregateToAttend: number;
  totalSubjects: number;
  safeSubjectsCount: number;
  shortageSubjectsCount: number;
  shortageSubjects: Array<{ id: string; name: string; percentage: number; needed: number }>;
  complianceStatus: 'FULL_CLEARANCE' | 'PARTIAL_SHORTAGE' | 'CRITICAL_SHORTAGE';
}

export interface Subject {
  id: string;
  name: string;
  totalClasses: number;
  attendedClasses: number;
  professor?: string;
  semester?: number;
  updatedAt?: string;
}

export type EventCategory = 'Exam' | 'Assignment' | 'Project' | 'Class Schedule';
export type Priority = 'High' | 'Medium' | 'Low';

export interface AcademicEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD or ISO string
  endDate?: string; // for multi-day events
  priority: Priority;
  category: EventCategory;
  done: boolean;
  notes?: string;
  semester?: number;
  time?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
  colorId?: string;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
}

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  selected?: boolean;
}

export interface GoogleCalendarEventInput {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export type ExpenseCategory = 'Food' | 'Commute' | 'Books' | 'Fun' | 'Misc';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: ExpenseCategory | 'Income';
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
}

export interface FinanceSettings {
  monthlyBudget: number;
  currency: string;
}

export interface HabitRecord {
  date: string; // YYYY-MM-DD
  workout: boolean;
  waterGlasses: number; // 0-8+
  waterGoalMet: boolean;
  studyHours: number; // hours studied
  studyGoalMet: boolean;
  workoutNotes?: string;
}

export type MilestoneStatus = 'To Learn' | 'In Progress' | 'Mastered';

export interface LearningMilestone {
  id: string;
  title: string;
  category?: string;
  status: MilestoneStatus;
  notes?: string;
  updatedAt?: string;
}

export interface ClassScheduleItem {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  subject: string;
  faculty: string;
  timeSlot?: string;
}

export interface UserProfile {
  displayName: string;
  semester: string;
  year: string;
  targetAttendance: number; // percentage, default 75
  updatedAt?: string;
}

export interface OfficialAcademicMilestone {
  id: string;
  title: string;
  semester1: string;
  semester2: string;
  notes?: string;
  isHighlighted?: boolean;
  updatedAt?: string;
}
