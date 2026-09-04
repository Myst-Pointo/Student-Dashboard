import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, googleSignIn, logoutGoogle, getAccessToken } from '../firebase';
import {
  AcademicEvent,
  GoogleCalendarEvent,
  GoogleCalendarEventInput,
  GoogleCalendarItem,
  HabitRecord,
  LearningMilestone,
  MilestoneStatus,
  OfficialAcademicMilestone,
  Subject,
  TabType,
  Transaction,
  UserProfile,
} from '../types';
import { getTodayDateString } from '../utils/dashboardUtils';
import { INITIAL_OFFICIAL_MILESTONES } from '../data/academicData';
import {
  fetchCalendarList,
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  pushAcademicEventToGoogle,
} from '../services/googleCalendarService';
import { DEFAULT_USER_PROFILE, loadLocalData, saveLocalData } from '../utils/storage';

const LOCAL_USER_ID = 'student_local_user';

interface DashboardContextType {
  user: User | null;
  userId: string;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  subjects: Subject[];
  events: AcademicEvent[];
  transactions: Transaction[];
  budget: number;
  habits: Record<string, HabitRecord>;
  milestones: LearningMilestone[];
  userProfile: UserProfile;
  officialMilestones: OfficialAcademicMilestone[];
  loading: boolean;
  syncStatus: 'synced' | 'saving' | 'offline';

  // Profile and Settings
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  profileModalOpen: boolean;
  setProfileModalOpen: (open: boolean) => void;

  // Official Milestones
  addOfficialMilestone: (item: Omit<OfficialAcademicMilestone, 'id'>) => Promise<void>;
  updateOfficialMilestone: (id: string, updates: Partial<OfficialAcademicMilestone>) => Promise<void>;
  deleteOfficialMilestone: (id: string) => Promise<void>;
  resetOfficialMilestones: () => Promise<void>;

  // Attendance actions
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  recordAttendance: (id: string, action: 'attended' | 'missed') => Promise<void>;

  // Calendar actions
  addEvent: (event: Omit<AcademicEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<AcademicEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventDone: (id: string) => Promise<void>;

  // Google Calendar Integration
  isGoogleConnected: boolean;
  googleToken: string | null;
  googleUserEmail: string | null;
  googleUserName: string | null;
  googleUserPhoto: string | null;
  googleCalendars: GoogleCalendarItem[];
  selectedCalendarId: string;
  setSelectedCalendarId: (id: string) => void;
  googleEvents: GoogleCalendarEvent[];
  loadingGCal: boolean;
  gCalError: string | null;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  refreshGoogleCalendar: () => Promise<void>;
  createGoogleCalendarEvent: (eventData: GoogleCalendarEventInput) => Promise<GoogleCalendarEvent>;
  deleteGoogleCalendarEvent: (eventId: string) => Promise<void>;
  syncAcademicEventToGCal: (event: AcademicEvent) => Promise<void>;
  syncAllDeadlinesToGCal: () => Promise<{ synced: number; failed: number }>;
  importGoogleEventToAcademic: (gEvent: GoogleCalendarEvent) => Promise<void>;

  // Finance actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateBudget: (newBudget: number) => Promise<void>;

  // Fitness / Habits actions
  toggleWorkout: (dateStr?: string, notes?: string) => Promise<void>;
  updateWater: (dateStr: string, glasses: number) => Promise<void>;
  updateStudy: (dateStr: string, hours: number) => Promise<void>;

  // Learning Milestones
  addMilestone: (milestone: Omit<LearningMilestone, 'id'>) => Promise<void>;
  updateMilestoneStatus: (id: string, status: MilestoneStatus) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;

  // Quick Action Modal control
  quickActionOpen: 'attendance' | 'expense' | 'workout' | null;
  openQuickAction: (type: 'attendance' | 'expense' | 'workout' | null) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => auth.currentUser);
  const [userId, setUserId] = useState<string>(() => auth.currentUser?.uid || LOCAL_USER_ID);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline'>('synced');

  // Synchronous initial load from local persistence - NEVER starts empty, NEVER resets to random data
  const [initialData] = useState(() => loadLocalData());
  const [subjects, setSubjects] = useState<Subject[]>(initialData.subjects);
  const [events, setEvents] = useState<AcademicEvent[]>(initialData.events);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);
  const [budget, setBudget] = useState<number>(initialData.budget);
  const [habits, setHabits] = useState<Record<string, HabitRecord>>(initialData.habits);
  const [milestones, setMilestones] = useState<LearningMilestone[]>(initialData.milestones);
  const [userProfile, setUserProfile] = useState<UserProfile>(
    initialData.userProfile || DEFAULT_USER_PROFILE
  );
  const [officialMilestones, setOfficialMilestones] = useState<OfficialAcademicMilestone[]>(
    initialData.officialMilestones || INITIAL_OFFICIAL_MILESTONES
  );

  // Profile modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Quick Action modal
  const [quickActionOpen, setQuickActionOpen] = useState<'attendance' | 'expense' | 'workout' | null>(null);

  // 1. Maintain active Firebase Auth listener so user state is always synchronized
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
      } else {
        setUser(null);
        setUserId(LOCAL_USER_ID);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Cloud Firestore synchronization (only when user is authenticated)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const subjectsRef = collection(userDocRef, 'subjects');
    const eventsRef = collection(userDocRef, 'events');
    const transactionsRef = collection(userDocRef, 'transactions');
    const habitsRef = collection(userDocRef, 'habits');
    const milestonesRef = collection(userDocRef, 'milestones');
    const officialMilestonesRef = collection(userDocRef, 'officialMilestones');
    const settingsRef = doc(userDocRef, 'settings', 'finance');
    const profileDocRef = doc(userDocRef, 'settings', 'profile');

    let isMounted = true;

    // Check if cloud seeding or migration of current active local data is needed
    const checkAndSyncFirestore = async () => {
      try {
        const subSnap = await getDocs(subjectsRef);
        if (subSnap.empty) {
          // New cloud user: migrate active local state to Firestore so existing entries are preserved
          const activeLocal = loadLocalData();
          const batch = writeBatch(db);

          const subjectsToSync = subjects.length > 0 ? subjects : activeLocal.subjects;
          const eventsToSync = events.length > 0 ? events : activeLocal.events;
          const txToSync = transactions.length > 0 ? transactions : activeLocal.transactions;
          const msToSync = milestones.length > 0 ? milestones : activeLocal.milestones;
          const officialMsToSync = officialMilestones.length > 0 ? officialMilestones : (activeLocal.officialMilestones || INITIAL_OFFICIAL_MILESTONES);
          const habitsToSync = Object.keys(habits).length > 0 ? habits : activeLocal.habits;
          const budgetToSync = budget || activeLocal.budget;
          const profileToSync = {
            ...userProfile,
            ...(user.displayName ? { displayName: user.displayName } : {}),
          };

          subjectsToSync.forEach((s) => {
            const ref = doc(subjectsRef, s.id);
            batch.set(ref, { ...s, updatedAt: new Date().toISOString() });
          });

          eventsToSync.forEach((e) => {
            const ref = doc(eventsRef, e.id);
            batch.set(ref, e);
          });

          txToSync.forEach((tx) => {
            const ref = doc(transactionsRef, tx.id);
            batch.set(ref, { ...tx, createdAt: tx.createdAt || new Date().toISOString() });
          });

          msToSync.forEach((m) => {
            const ref = doc(milestonesRef, m.id);
            batch.set(ref, { ...m, updatedAt: new Date().toISOString() });
          });

          officialMsToSync.forEach((om) => {
            const ref = doc(officialMilestonesRef, om.id);
            batch.set(ref, { ...om, updatedAt: new Date().toISOString() });
          });

          Object.entries(habitsToSync).forEach(([dateStr, h]) => {
            const ref = doc(habitsRef, dateStr);
            batch.set(ref, h);
          });

          batch.set(settingsRef, { monthlyBudget: budgetToSync, currency: 'INR' });
          batch.set(profileDocRef, { ...profileToSync, updatedAt: new Date().toISOString() }, { merge: true });
          batch.set(userDocRef, { profile: profileToSync }, { merge: true });

          await batch.commit();
        } else {
          // Check if officialMilestones needs initial seeding
          const omSnap = await getDocs(officialMilestonesRef);
          if (omSnap.empty) {
            const batch = writeBatch(db);
            const officialMsToSync = officialMilestones.length > 0 ? officialMilestones : INITIAL_OFFICIAL_MILESTONES;
            officialMsToSync.forEach((om) => {
              const ref = doc(officialMilestonesRef, om.id);
              batch.set(ref, { ...om, updatedAt: new Date().toISOString() });
            });
            await batch.commit();
          }
        }
      } catch (err: any) {
        if (err?.code === 'permission-denied') {
          console.info('Firestore cloud sync pending user authorization.');
        } else {
          console.info('Firestore initial migration check info:', err?.message || err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAndSyncFirestore();

    // Listeners for real-time synchronization with safe error fallbacks
    const unsubSubjects = onSnapshot(
      subjectsRef,
      (snapshot) => {
        if (!isMounted) return;
        const list: Subject[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Subject, 'id'>) });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (list.length > 0) {
          setSubjects(list);
          saveLocalData(user.uid, { subjects: list });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Subjects sync running in local-first mode');
        } else {
          console.info('Subjects snapshot notice:', err.message);
        }
      }
    );

    const unsubEvents = onSnapshot(
      eventsRef,
      (snapshot) => {
        if (!isMounted) return;
        const list: AcademicEvent[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<AcademicEvent, 'id'>) });
        });
        list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        if (list.length > 0) {
          setEvents(list);
          saveLocalData(user.uid, { events: list });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Events sync running in local-first mode');
        } else {
          console.info('Events snapshot notice:', err.message);
        }
      }
    );

    const unsubTransactions = onSnapshot(
      transactionsRef,
      (snapshot) => {
        if (!isMounted) return;
        const list: Transaction[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) });
        });
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (list.length > 0) {
          setTransactions(list);
          saveLocalData(user.uid, { transactions: list });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Transactions sync running in local-first mode');
        } else {
          console.info('Transactions snapshot notice:', err.message);
        }
      }
    );

    const unsubHabits = onSnapshot(
      habitsRef,
      (snapshot) => {
        if (!isMounted) return;
        const map: Record<string, HabitRecord> = {};
        snapshot.forEach((d) => {
          const data = d.data() as HabitRecord;
          if (data.date) map[data.date] = data;
        });
        if (Object.keys(map).length > 0) {
          setHabits((prev) => {
            const merged = { ...prev, ...map };
            saveLocalData(user.uid, { habits: merged });
            return merged;
          });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Habits sync running in local-first mode');
        } else {
          console.info('Habits snapshot notice:', err.message);
        }
      }
    );

    const unsubMilestones = onSnapshot(
      milestonesRef,
      (snapshot) => {
        if (!isMounted) return;
        const list: LearningMilestone[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<LearningMilestone, 'id'>) });
        });
        if (list.length > 0) {
          setMilestones(list);
          saveLocalData(user.uid, { milestones: list });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Milestones sync running in local-first mode');
        } else {
          console.info('Milestones snapshot notice:', err.message);
        }
      }
    );

    const unsubSettings = onSnapshot(
      settingsRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.monthlyBudget !== undefined) {
            const b = Number(data.monthlyBudget);
            setBudget(b);
            saveLocalData(user.uid, { budget: b });
          }
        }
        setLoading(false);
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Settings sync running in local-first mode');
        } else {
          console.info('Settings snapshot notice:', err.message);
        }
        if (isMounted) setLoading(false);
      }
    );

    const unsubProfile = onSnapshot(
      profileDocRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setUserProfile((prev) => {
            const merged = { ...prev, ...data };
            saveLocalData(user.uid, { userProfile: merged });
            return merged;
          });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Profile sync running in local-first mode');
        } else {
          console.info('Profile snapshot notice:', err.message);
        }
      }
    );

    const unsubOfficialMilestones = onSnapshot(
      officialMilestonesRef,
      (snapshot) => {
        if (!isMounted) return;
        const list: OfficialAcademicMilestone[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<OfficialAcademicMilestone, 'id'>) });
        });
        if (list.length > 0) {
          setOfficialMilestones(list);
          saveLocalData(user.uid, { officialMilestones: list });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') {
          console.info('Official Milestones sync running in local-first mode');
        } else {
          console.info('Official Milestones snapshot notice:', err.message);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubSubjects();
      unsubEvents();
      unsubTransactions();
      unsubHabits();
      unsubMilestones();
      unsubSettings();
      unsubProfile();
      unsubOfficialMilestones();
    };
  }, [user]);

  // Actions with DUAL-PERSISTENCE (Instant UI + LocalStorage + Cloud Firestore)
  const addSubject = async (sub: Omit<Subject, 'id'>) => {
    setSyncStatus('saving');
    const newId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSubject: Subject = { id: newId, ...sub, updatedAt: new Date().toISOString() };
    const updated = [...subjects, newSubject].sort((a, b) => a.name.localeCompare(b.name));
    setSubjects(updated);
    saveLocalData(userId, { subjects: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'subjects', newId);
        await setDoc(ref, newSubject);
      } catch (err: any) {
        console.warn('Firestore addSubject warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    setSyncStatus('saving');
    const updated = subjects.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
    setSubjects(updated);
    saveLocalData(userId, { subjects: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'subjects', id);
        await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.warn('Firestore updateSubject warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const deleteSubject = async (id: string) => {
    setSyncStatus('saving');
    const updated = subjects.filter((s) => s.id !== id);
    setSubjects(updated);
    saveLocalData(userId, { subjects: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'subjects', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.warn('Firestore deleteSubject warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const recordAttendance = async (id: string, action: 'attended' | 'missed') => {
    setSyncStatus('saving');
    let updatedTotal = 0;
    let updatedAttended = 0;

    const updated = subjects.map((s) => {
      if (s.id === id) {
        const total = s.totalClasses + 1;
        const attended = action === 'attended' ? s.attendedClasses + 1 : s.attendedClasses;
        updatedTotal = total;
        updatedAttended = attended;
        return {
          ...s,
          totalClasses: total,
          attendedClasses: attended,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    setSubjects(updated);
    saveLocalData(userId, { subjects: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'subjects', id);
        await updateDoc(ref, {
          totalClasses: updatedTotal,
          attendedClasses: updatedAttended,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('Firestore recordAttendance warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const addEvent = async (event: Omit<AcademicEvent, 'id'>) => {
    setSyncStatus('saving');
    const newId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newEvent: AcademicEvent = { id: newId, ...event };
    const updated = [...events, newEvent].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    setEvents(updated);
    saveLocalData(userId, { events: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'events', newId);
        await setDoc(ref, newEvent);
      } catch (err: any) {
        console.warn('Firestore addEvent warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateEvent = async (id: string, updates: Partial<AcademicEvent>) => {
    setSyncStatus('saving');
    const updated = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setEvents(updated);
    saveLocalData(userId, { events: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'events', id);
        await updateDoc(ref, updates);
      } catch (err: any) {
        console.warn('Firestore updateEvent warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const deleteEvent = async (id: string) => {
    setSyncStatus('saving');
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveLocalData(userId, { events: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'events', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.warn('Firestore deleteEvent warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const toggleEventDone = async (id: string) => {
    const item = events.find((e) => e.id === id);
    if (!item) return;
    await updateEvent(id, { done: !item.done });
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    setSyncStatus('saving');
    const newId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = { id: newId, ...tx, createdAt: new Date().toISOString() };
    const updated = [newTx, ...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    setTransactions(updated);
    saveLocalData(userId, { transactions: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'transactions', newId);
        await setDoc(ref, newTx);
      } catch (err: any) {
        console.warn('Firestore addTransaction warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const deleteTransaction = async (id: string) => {
    setSyncStatus('saving');
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveLocalData(userId, { transactions: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'transactions', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.warn('Firestore deleteTransaction warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateBudget = async (newBudget: number) => {
    setSyncStatus('saving');
    setBudget(newBudget);
    saveLocalData(userId, { budget: newBudget });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'settings', 'finance');
        await setDoc(ref, { monthlyBudget: newBudget, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err: any) {
        console.warn('Firestore updateBudget warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const toggleWorkout = async (dateStr?: string, notes?: string) => {
    const targetDate = dateStr || getTodayDateString();
    const current = habits[targetDate] || {
      date: targetDate,
      workout: false,
      waterGlasses: 0,
      waterGoalMet: false,
      studyHours: 0,
      studyGoalMet: false,
    };

    const newWorkout = !current.workout;
    const updatedRecord: HabitRecord = {
      ...current,
      workout: newWorkout,
      workoutNotes: notes !== undefined ? notes : current.workoutNotes,
    };

    const updatedHabits = { ...habits, [targetDate]: updatedRecord };
    setHabits(updatedHabits);
    saveLocalData(userId, { habits: updatedHabits });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'habits', targetDate);
        await setDoc(ref, updatedRecord, { merge: true });
      } catch (err: any) {
        console.warn('Firestore toggleWorkout warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateWater = async (dateStr: string, glasses: number) => {
    const current = habits[dateStr] || {
      date: dateStr,
      workout: false,
      waterGlasses: 0,
      waterGoalMet: false,
      studyHours: 0,
      studyGoalMet: false,
    };

    const newGlasses = Math.max(0, glasses);
    const updatedRecord: HabitRecord = {
      ...current,
      waterGlasses: newGlasses,
      waterGoalMet: newGlasses >= 8,
    };

    const updatedHabits = { ...habits, [dateStr]: updatedRecord };
    setHabits(updatedHabits);
    saveLocalData(userId, { habits: updatedHabits });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'habits', dateStr);
        await setDoc(ref, updatedRecord, { merge: true });
      } catch (err: any) {
        console.warn('Firestore updateWater warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateStudy = async (dateStr: string, hours: number) => {
    const current = habits[dateStr] || {
      date: dateStr,
      workout: false,
      waterGlasses: 0,
      waterGoalMet: false,
      studyHours: 0,
      studyGoalMet: false,
    };

    const newHours = Math.max(0, hours);
    const updatedRecord: HabitRecord = {
      ...current,
      studyHours: newHours,
      studyGoalMet: newHours >= 2,
    };

    const updatedHabits = { ...habits, [dateStr]: updatedRecord };
    setHabits(updatedHabits);
    saveLocalData(userId, { habits: updatedHabits });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'habits', dateStr);
        await setDoc(ref, updatedRecord, { merge: true });
      } catch (err: any) {
        console.warn('Firestore updateStudy warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const addMilestone = async (milestone: Omit<LearningMilestone, 'id'>) => {
    setSyncStatus('saving');
    const newId = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMilestone: LearningMilestone = {
      id: newId,
      ...milestone,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...milestones, newMilestone];
    setMilestones(updated);
    saveLocalData(userId, { milestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'milestones', newId);
        await setDoc(ref, newMilestone);
      } catch (err: any) {
        console.warn('Firestore addMilestone warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateMilestoneStatus = async (id: string, status: MilestoneStatus) => {
    setSyncStatus('saving');
    const updated = milestones.map((m) =>
      m.id === id ? { ...m, status, updatedAt: new Date().toISOString() } : m
    );
    setMilestones(updated);
    saveLocalData(userId, { milestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'milestones', id);
        await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
      } catch (err: any) {
        console.warn('Firestore updateMilestoneStatus warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const deleteMilestone = async (id: string) => {
    setSyncStatus('saving');
    const updated = milestones.filter((m) => m.id !== id);
    setMilestones(updated);
    saveLocalData(userId, { milestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'milestones', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.warn('Firestore deleteMilestone warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  // User Profile Actions
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    setSyncStatus('saving');
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(updated);
    saveLocalData(userId, { userProfile: updated });

    if (user?.uid) {
      try {
        const profileRef = doc(db, 'users', user.uid, 'settings', 'profile');
        const userRootRef = doc(db, 'users', user.uid);
        await setDoc(profileRef, updated, { merge: true });
        await setDoc(userRootRef, { profile: updated }, { merge: true });
      } catch (err: any) {
        console.warn('Firestore updateUserProfile warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  // Official Academic Milestones Actions
  const addOfficialMilestone = async (item: Omit<OfficialAcademicMilestone, 'id'>) => {
    setSyncStatus('saving');
    const newId = `om_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMilestone: OfficialAcademicMilestone = {
      id: newId,
      ...item,
      updatedAt: new Date().toISOString(),
    };
    const updated = [...officialMilestones, newMilestone];
    setOfficialMilestones(updated);
    saveLocalData(userId, { officialMilestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'officialMilestones', newId);
        await setDoc(ref, newMilestone);
      } catch (err: any) {
        console.warn('Firestore addOfficialMilestone warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const updateOfficialMilestone = async (id: string, updates: Partial<OfficialAcademicMilestone>) => {
    setSyncStatus('saving');
    const updated = officialMilestones.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
    );
    setOfficialMilestones(updated);
    saveLocalData(userId, { officialMilestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'officialMilestones', id);
        await setDoc(ref, { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err: any) {
        console.warn('Firestore updateOfficialMilestone warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const deleteOfficialMilestone = async (id: string) => {
    setSyncStatus('saving');
    const updated = officialMilestones.filter((m) => m.id !== id);
    setOfficialMilestones(updated);
    saveLocalData(userId, { officialMilestones: updated });

    if (user?.uid) {
      try {
        const ref = doc(db, 'users', user.uid, 'officialMilestones', id);
        await deleteDoc(ref);
      } catch (err: any) {
        console.warn('Firestore deleteOfficialMilestone warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  const resetOfficialMilestones = async () => {
    setSyncStatus('saving');
    setOfficialMilestones(INITIAL_OFFICIAL_MILESTONES);
    saveLocalData(userId, { officialMilestones: INITIAL_OFFICIAL_MILESTONES });

    if (user?.uid) {
      try {
        const batch = writeBatch(db);
        const officialMilestonesRef = collection(db, 'users', user.uid, 'officialMilestones');
        const snap = await getDocs(officialMilestonesRef);
        snap.forEach((d) => batch.delete(d.ref));
        INITIAL_OFFICIAL_MILESTONES.forEach((m) => {
          const ref = doc(officialMilestonesRef, m.id);
          batch.set(ref, m);
        });
        await batch.commit();
      } catch (err: any) {
        console.warn('Firestore resetOfficialMilestones warning:', err?.message || err);
      }
    }
    setSyncStatus('synced');
  };

  // Google Calendar state
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendarItem[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loadingGCal, setLoadingGCal] = useState<boolean>(false);
  const [gCalError, setGCalError] = useState<string | null>(null);

  const isGoogleConnected = Boolean(googleToken);
  const googleUserEmail = user?.email || null;
  const googleUserName = user?.displayName || null;
  const googleUserPhoto = user?.photoURL || null;

  const refreshGoogleCalendar = async () => {
    const token = googleToken || (await getAccessToken());
    if (!token) return;
    setLoadingGCal(true);
    setGCalError(null);
    try {
      const [cals, evts] = await Promise.all([
        fetchCalendarList(token).catch(() => []),
        fetchCalendarEvents(token, selectedCalendarId),
      ]);
      if (cals.length > 0) {
        setGoogleCalendars(cals);
      }
      setGoogleEvents(evts);
    } catch (err: any) {
      console.error('refreshGoogleCalendar error:', err);
      setGCalError(err.message || 'Failed to fetch Google Calendar events');
    } finally {
      setLoadingGCal(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setLoadingGCal(true);
    setGCalError(null);
    try {
      const { user: gUser, accessToken } = await googleSignIn();
      setUser(gUser);
      setUserId(gUser.uid);
      setGoogleToken(accessToken);

      // Load calendars and events
      const [cals, evts] = await Promise.all([
        fetchCalendarList(accessToken).catch(() => []),
        fetchCalendarEvents(accessToken, 'primary'),
      ]);
      setGoogleCalendars(cals);
      setGoogleEvents(evts);
    } catch (err: any) {
      console.error('connectGoogleCalendar error:', err);
      setGCalError(err.message || 'Failed to connect Google Calendar');
      throw err;
    } finally {
      setLoadingGCal(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await logoutGoogle();
      setGoogleToken(null);
      setGoogleCalendars([]);
      setGoogleEvents([]);
      setUser(null);
      setUserId(LOCAL_USER_ID);
    } catch (err) {
      console.error('disconnectGoogleCalendar error:', err);
    }
  };

  const createGoogleCalendarEvent = async (eventData: GoogleCalendarEventInput) => {
    const token = googleToken || (await getAccessToken());
    if (!token) throw new Error('Not connected to Google Calendar');
    const newEvent = await createCalendarEvent(token, selectedCalendarId, eventData);
    setGoogleEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const deleteGoogleCalendarEvent = async (eventId: string) => {
    const token = googleToken || (await getAccessToken());
    if (!token) throw new Error('Not connected to Google Calendar');
    await deleteCalendarEvent(token, selectedCalendarId, eventId);
    setGoogleEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const syncAcademicEventToGCal = async (event: AcademicEvent) => {
    const token = googleToken || (await getAccessToken());
    if (!token) throw new Error('Not connected to Google Calendar');
    const gEvent = await pushAcademicEventToGoogle(token, event, selectedCalendarId);
    await updateEvent(event.id, {
      googleCalendarEventId: gEvent.id,
      googleCalendarHtmlLink: gEvent.htmlLink,
    });
    setGoogleEvents((prev) => {
      const exists = prev.some((e) => e.id === gEvent.id);
      return exists ? prev : [gEvent, ...prev];
    });
  };

  const syncAllDeadlinesToGCal = async () => {
    const token = googleToken || (await getAccessToken());
    if (!token) throw new Error('Not connected to Google Calendar');
    let synced = 0;
    let failed = 0;
    for (const evt of events) {
      if (!evt.done) {
        try {
          const gEvent = await pushAcademicEventToGoogle(token, evt, selectedCalendarId);
          await updateEvent(evt.id, {
            googleCalendarEventId: gEvent.id,
            googleCalendarHtmlLink: gEvent.htmlLink,
          });
          synced++;
        } catch (e) {
          console.error(`Failed to sync event ${evt.title}:`, e);
          failed++;
        }
      }
    }
    await refreshGoogleCalendar();
    return { synced, failed };
  };

  const importGoogleEventToAcademic = async (gEvent: GoogleCalendarEvent) => {
    const dateStr =
      gEvent.start.date ||
      (gEvent.start.dateTime ? gEvent.start.dateTime.substring(0, 10) : getTodayDateString());
    const timeStr = gEvent.start.dateTime ? gEvent.start.dateTime.substring(11, 16) : undefined;

    const lower = gEvent.summary.toLowerCase();
    let cat: 'Exam' | 'Assignment' | 'Project' | 'Class Schedule' = 'Assignment';
    if (
      lower.includes('exam') ||
      lower.includes('midterm') ||
      lower.includes('quiz') ||
      lower.includes('final')
    ) {
      cat = 'Exam';
    } else if (lower.includes('project') || lower.includes('presentation')) {
      cat = 'Project';
    } else if (lower.includes('class') || lower.includes('lecture') || lower.includes('lab')) {
      cat = 'Class Schedule';
    }

    await addEvent({
      title: gEvent.summary,
      date: dateStr,
      time: timeStr,
      priority: 'Medium',
      category: cat,
      done: false,
      notes: gEvent.description || undefined,
      semester: 1,
      googleCalendarEventId: gEvent.id,
      googleCalendarHtmlLink: gEvent.htmlLink,
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        userId,
        activeTab,
        setActiveTab,
        subjects,
        events,
        transactions,
        budget,
        habits,
        milestones,
        userProfile,
        officialMilestones,
        loading,
        syncStatus,
        updateUserProfile,
        profileModalOpen,
        setProfileModalOpen,
        addOfficialMilestone,
        updateOfficialMilestone,
        deleteOfficialMilestone,
        resetOfficialMilestones,
        addSubject,
        updateSubject,
        deleteSubject,
        recordAttendance,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleEventDone,
        isGoogleConnected,
        googleToken,
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
        syncAcademicEventToGCal,
        syncAllDeadlinesToGCal,
        importGoogleEventToAcademic,
        addTransaction,
        deleteTransaction,
        updateBudget,
        toggleWorkout,
        updateWater,
        updateStudy,
        addMilestone,
        updateMilestoneStatus,
        deleteMilestone,
        quickActionOpen,
        openQuickAction: setQuickActionOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
