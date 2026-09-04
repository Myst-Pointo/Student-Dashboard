import { AcademicEvent, ClassScheduleItem, LearningMilestone, OfficialAcademicMilestone, Subject } from '../types';

// Generic academic schedule and initial store - empty by default so new users configure their own courses
export const WEEKLY_CLASS_SCHEDULE: ClassScheduleItem[] = [];

export const INITIAL_SUBJECTS: Omit<Subject, 'id'>[] = [];

export const INITIAL_ACADEMIC_EVENTS: Omit<AcademicEvent, 'id'>[] = [];

export const INITIAL_MILESTONES: Omit<LearningMilestone, 'id'>[] = [];

export const INITIAL_OFFICIAL_MILESTONES: OfficialAcademicMilestone[] = [];
