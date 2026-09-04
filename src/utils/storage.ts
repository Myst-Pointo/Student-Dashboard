// Persistent Local Storage for Academic & Life Dashboard
import {
  AcademicEvent,
  HabitRecord,
  LearningMilestone,
  OfficialAcademicMilestone,
  Subject,
  Transaction,
  UserProfile,
} from '../types';
import {
  INITIAL_ACADEMIC_EVENTS,
  INITIAL_MILESTONES,
  INITIAL_OFFICIAL_MILESTONES,
  INITIAL_SUBJECTS,
} from '../data/academicData';

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: 'Student',
  semester: 'Semester 1',
  year: '1st Year',
  targetAttendance: 75,
};

export interface StoredDashboardData {
  subjects: Subject[];
  events: AcademicEvent[];
  transactions: Transaction[];
  budget: number;
  currency: string;
  habits: Record<string, HabitRecord>;
  milestones: LearningMilestone[];
  userProfile: UserProfile;
  officialMilestones: OfficialAcademicMilestone[];
  lastUpdated: string;
}

const PRIMARY_STORAGE_KEY = 'academic_dashboard_student_v4';
const LEGACY_STORAGE_KEYS = [
  'academic_dashboard_student_v3',
  'academic_life_dashboard_global_store_v2',
  'academic_life_dashboard_global_store',
];

// In-memory cache to guarantee instantaneous synchronous access and prevent loss
let memoryCache: StoredDashboardData | null = null;

export function getDefaultDashboardData(): StoredDashboardData {
  return {
    subjects: [],
    events: [],
    transactions: [],
    budget: 2000,
    currency: 'USD',
    habits: {},
    milestones: [],
    userProfile: DEFAULT_USER_PROFILE,
    officialMilestones: [],
    lastUpdated: new Date().toISOString(),
  };
}

function sanitizeUserProfile(profile: any): UserProfile {
  if (!profile || typeof profile !== 'object') {
    return DEFAULT_USER_PROFILE;
  }
  let name = typeof profile.displayName === 'string' && profile.displayName.trim()
    ? profile.displayName.trim()
    : DEFAULT_USER_PROFILE.displayName;

  // Ensure personal user name never leaks to new or reset sessions
  if (name.toLowerCase().includes('shira') || name.toLowerCase().includes('raghuwanshi')) {
    name = 'Student';
  }

  return {
    displayName: name,
    semester: typeof profile.semester === 'string' && profile.semester.trim() ? profile.semester.trim() : DEFAULT_USER_PROFILE.semester,
    year: typeof profile.year === 'string' && profile.year.trim() ? profile.year.trim() : DEFAULT_USER_PROFILE.year,
    targetAttendance: typeof profile.targetAttendance === 'number' && !isNaN(profile.targetAttendance) && profile.targetAttendance >= 1 && profile.targetAttendance <= 100 ? profile.targetAttendance : 75,
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}

function sanitizeCurrency(currency: any): string {
  if (typeof currency === 'string' && currency.trim()) {
    return currency.trim().toUpperCase();
  }
  return 'USD';
}

function filterPersonalData(subjects: Subject[]): Subject[] {
  if (!Array.isArray(subjects)) return [];
  // Ensure personal professors or subjects from earlier development testing are purged
  return subjects.filter((s) => {
    const prof = (s.professor || '').toLowerCase();
    return !prof.includes('togya') &&
      !prof.includes('phatak') &&
      !prof.includes('shaktawat') &&
      !prof.includes('pahuja') &&
      !prof.includes('sirwaiya');
  });
}

function filterPersonalEvents(events: AcademicEvent[]): AcademicEvent[] {
  if (!Array.isArray(events)) return [];
  return events.filter((e) => {
    const title = (e.title || '').toLowerCase();
    const notes = (e.notes || '').toLowerCase();
    return !title.includes('sfoorti') && !notes.includes('sfoorti');
  });
}

function sanitizeOfficialMilestones(milestones: any): OfficialAcademicMilestone[] {
  if (Array.isArray(milestones) && milestones.length > 0) {
    return milestones.filter((m) => {
      const title = (m.title || '').toLowerCase();
      return !title.includes('sfoorti') && !title.includes('diwali vacations');
    });
  }
  return [];
}

/**
 * Load dashboard data from localStorage.
 * Guaranteed never to overwrite existing user entries with default sample data.
 */
export function loadLocalData(userId?: string): StoredDashboardData {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    // 1. Try primary storage key
    const primaryRaw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (primaryRaw) {
      const parsed = JSON.parse(primaryRaw);
      if (parsed && typeof parsed === 'object') {
        const validated: StoredDashboardData = {
          subjects: filterPersonalData(parsed.subjects),
          events: filterPersonalEvents(parsed.events),
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          budget: typeof parsed.budget === 'number' ? parsed.budget : 2000,
          currency: sanitizeCurrency(parsed.currency),
          habits: parsed.habits && typeof parsed.habits === 'object' ? parsed.habits : {},
          milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
          userProfile: sanitizeUserProfile(parsed.userProfile),
          officialMilestones: sanitizeOfficialMilestones(parsed.officialMilestones),
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        memoryCache = validated;
        return validated;
      }
    }

    // 2. Check user-specific key if provided
    if (userId) {
      const userRaw = localStorage.getItem(`academic_life_dashboard_user_${userId}`);
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (parsed && typeof parsed === 'object') {
          const validated: StoredDashboardData = {
            subjects: filterPersonalData(parsed.subjects),
            events: filterPersonalEvents(parsed.events),
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budget: typeof parsed.budget === 'number' ? parsed.budget : 2000,
            currency: sanitizeCurrency(parsed.currency),
            habits: parsed.habits && typeof parsed.habits === 'object' ? parsed.habits : {},
            milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
            userProfile: sanitizeUserProfile(parsed.userProfile),
            officialMilestones: sanitizeOfficialMilestones(parsed.officialMilestones),
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
          memoryCache = validated;
          localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(validated));
          return validated;
        }
      }
    }

    // 3. Check legacy storage keys
    for (const key of LEGACY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const validated: StoredDashboardData = {
            subjects: filterPersonalData(parsed.subjects),
            events: filterPersonalEvents(parsed.events),
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budget: typeof parsed.budget === 'number' ? parsed.budget : 2000,
            currency: sanitizeCurrency(parsed.currency),
            habits: parsed.habits && typeof parsed.habits === 'object' ? parsed.habits : {},
            milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
            userProfile: sanitizeUserProfile(parsed.userProfile),
            officialMilestones: sanitizeOfficialMilestones(parsed.officialMilestones),
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
          memoryCache = validated;
          localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(validated));
          return validated;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load local dashboard data from localStorage:', err);
  }

  // 4. Fallback to clean default initial state
  const defaultData = getDefaultDashboardData();
  memoryCache = defaultData;
  try {
    const json = JSON.stringify(defaultData);
    localStorage.setItem(PRIMARY_STORAGE_KEY, json);
    if (userId) {
      localStorage.setItem(`academic_life_dashboard_user_${userId}`, json);
    }
  } catch (err) {
    console.warn('Failed to write initial default data to localStorage:', err);
  }
  return defaultData;
}

/**
 * Save dashboard data to localStorage immediately and reliably.
 * Merges updates without recursive calls or destructive resets.
 */
export function saveLocalData(userId: string | undefined, data: Partial<StoredDashboardData>): void {
  try {
    let current = memoryCache;
    if (!current) {
      try {
        const raw = localStorage.getItem(PRIMARY_STORAGE_KEY);
        if (raw) {
          current = JSON.parse(raw);
        }
      } catch {
        current = null;
      }
    }
    if (!current) {
      current = getDefaultDashboardData();
    }

    const updated: StoredDashboardData = {
      subjects: data.subjects !== undefined ? data.subjects : current.subjects,
      events: data.events !== undefined ? data.events : current.events,
      transactions: data.transactions !== undefined ? data.transactions : current.transactions,
      budget: data.budget !== undefined ? data.budget : current.budget,
      currency: data.currency !== undefined ? sanitizeCurrency(data.currency) : current.currency,
      habits: data.habits !== undefined ? data.habits : current.habits,
      milestones: data.milestones !== undefined ? data.milestones : current.milestones,
      userProfile: data.userProfile !== undefined ? data.userProfile : current.userProfile,
      officialMilestones: data.officialMilestones !== undefined ? data.officialMilestones : current.officialMilestones,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache = updated;
    const json = JSON.stringify(updated);

    localStorage.setItem(PRIMARY_STORAGE_KEY, json);
    if (userId) {
      localStorage.setItem(`academic_life_dashboard_user_${userId}`, json);
    }
  } catch (err) {
    console.warn('Failed to save local dashboard data to localStorage:', err);
  }
}
