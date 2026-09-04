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
import { getTodayDateString } from './dashboardUtils';

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: 'Shira Raghuwanshi',
  semester: 'Semester 1',
  year: '1st Year (2026–2027)',
  targetAttendance: 75,
};

export interface StoredDashboardData {
  subjects: Subject[];
  events: AcademicEvent[];
  transactions: Transaction[];
  budget: number;
  habits: Record<string, HabitRecord>;
  milestones: LearningMilestone[];
  userProfile: UserProfile;
  officialMilestones: OfficialAcademicMilestone[];
  lastUpdated: string;
}

const PRIMARY_STORAGE_KEY = 'academic_dashboard_student_v3';
const LEGACY_STORAGE_KEYS = [
  'academic_life_dashboard_global_store_v2',
  'academic_life_dashboard_global_store',
];

// In-memory cache to guarantee instantaneous synchronous access and prevent loss
let memoryCache: StoredDashboardData | null = null;

export function getDefaultDashboardData(): StoredDashboardData {
  const subjectsWithIds: Subject[] = INITIAL_SUBJECTS.map((s, i) => ({
    id: `subj_init_${i + 1}`,
    ...s,
    updatedAt: new Date().toISOString(),
  }));

  const eventsWithIds: AcademicEvent[] = INITIAL_ACADEMIC_EVENTS.map((e, i) => ({
    id: `event_init_${i + 1}`,
    ...e,
  }));

  const milestonesWithIds: LearningMilestone[] = INITIAL_MILESTONES.map((m, i) => ({
    id: `ms_init_${i + 1}`,
    ...m,
    updatedAt: new Date().toISOString(),
  }));

  const sampleTxs: Transaction[] = [
    {
      id: 'tx_init_1',
      type: 'expense',
      amount: 850,
      category: 'Books',
      date: '2026-09-01',
      notes: 'Microeconomics Textbook',
      createdAt: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'tx_init_2',
      type: 'expense',
      amount: 320,
      category: 'Food',
      date: '2026-09-02',
      notes: 'Campus Cafeteria Lunch',
      createdAt: '2026-09-02T13:00:00.000Z',
    },
    {
      id: 'tx_init_3',
      type: 'expense',
      amount: 450,
      category: 'Commute',
      date: '2026-09-02',
      notes: 'Metro Card Reload',
      createdAt: '2026-09-02T17:00:00.000Z',
    },
    {
      id: 'tx_init_4',
      type: 'income',
      amount: 8000,
      category: 'Income',
      date: '2026-09-01',
      notes: 'Academic Assistant Stipend',
      createdAt: '2026-09-01T09:00:00.000Z',
    },
  ];

  const today = getTodayDateString();
  const initialHabits: Record<string, HabitRecord> = {
    [today]: {
      date: today,
      workout: true,
      waterGlasses: 6,
      waterGoalMet: false,
      studyHours: 3.5,
      studyGoalMet: true,
      workoutNotes: 'Upper Body & Core',
    },
  };

  return {
    subjects: subjectsWithIds,
    events: eventsWithIds,
    transactions: sampleTxs,
    budget: 10000,
    habits: initialHabits,
    milestones: milestonesWithIds,
    userProfile: DEFAULT_USER_PROFILE,
    officialMilestones: INITIAL_OFFICIAL_MILESTONES,
    lastUpdated: new Date().toISOString(),
  };
}

function sanitizeUserProfile(profile: any): UserProfile {
  if (!profile || typeof profile !== 'object') {
    return DEFAULT_USER_PROFILE;
  }
  return {
    displayName: typeof profile.displayName === 'string' && profile.displayName.trim() ? profile.displayName.trim() : DEFAULT_USER_PROFILE.displayName,
    semester: typeof profile.semester === 'string' && profile.semester.trim() ? profile.semester.trim() : DEFAULT_USER_PROFILE.semester,
    year: typeof profile.year === 'string' && profile.year.trim() ? profile.year.trim() : DEFAULT_USER_PROFILE.year,
    targetAttendance: typeof profile.targetAttendance === 'number' && !isNaN(profile.targetAttendance) && profile.targetAttendance >= 1 && profile.targetAttendance <= 100 ? profile.targetAttendance : 75,
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
}

function sanitizeOfficialMilestones(milestones: any): OfficialAcademicMilestone[] {
  if (Array.isArray(milestones) && milestones.length > 0) {
    return milestones;
  }
  return INITIAL_OFFICIAL_MILESTONES;
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
          subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
          events: Array.isArray(parsed.events) ? parsed.events : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          budget: typeof parsed.budget === 'number' ? parsed.budget : 10000,
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
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            events: Array.isArray(parsed.events) ? parsed.events : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budget: typeof parsed.budget === 'number' ? parsed.budget : 10000,
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
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            events: Array.isArray(parsed.events) ? parsed.events : [],
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            budget: typeof parsed.budget === 'number' ? parsed.budget : 10000,
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

    // 4. Scan for any existing user keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('academic_life_dashboard_') || key.startsWith('academic_dash_'))) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed && Array.isArray(parsed.subjects)) {
              const validated: StoredDashboardData = {
                subjects: parsed.subjects || [],
                events: Array.isArray(parsed.events) ? parsed.events : [],
                transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
                budget: typeof parsed.budget === 'number' ? parsed.budget : 10000,
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
        } catch {
          // Continue scanning
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load local dashboard data from localStorage:', err);
  }

  // 5. Only if absolutely no prior data was found anywhere, initialize default data
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
    // Current base from cache or raw storage
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
      habits: data.habits !== undefined ? data.habits : current.habits,
      milestones: data.milestones !== undefined ? data.milestones : current.milestones,
      userProfile: data.userProfile !== undefined ? data.userProfile : current.userProfile,
      officialMilestones: data.officialMilestones !== undefined ? data.officialMilestones : current.officialMilestones,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache = updated;
    const json = JSON.stringify(updated);

    localStorage.setItem(PRIMARY_STORAGE_KEY, json);
    localStorage.setItem('academic_life_dashboard_global_store_v2', json);
    if (userId) {
      localStorage.setItem(`academic_life_dashboard_user_${userId}`, json);
    }
  } catch (err) {
    console.warn('Failed to save local dashboard data to localStorage:', err);
  }
}

