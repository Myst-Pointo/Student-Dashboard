import { AttendanceStats, DualAttendanceOverview, Subject } from '../types';

export function calculateAttendanceStats(attended: number, total: number, target: number = 75): AttendanceStats {
  const targetPct = typeof target === 'number' && target > 0 && target <= 100 ? target : 75;
  if (total <= 0) {
    return {
      percentage: 100,
      isSafe: true,
      message: 'No classes conducted yet',
      classesToAttend: 0,
      classesCanBunk: 0,
      margin: Math.round((100 - targetPct) * 10) / 10,
    };
  }

  // Clamped attended to never exceed total
  const clampedAttended = Math.min(attended, total);
  const rawPercentage = (clampedAttended / total) * 100;
  const percentage = Math.round(rawPercentage * 10) / 10;
  const isSafe = percentage >= targetPct;
  const margin = Math.round((percentage - targetPct) * 10) / 10;

  const t = targetPct / 100;

  if (isSafe) {
    // Equation: (attended) / (total + Y) >= t => Y <= (attended - t * total) / t
    const canBunk = t > 0 ? Math.max(0, Math.floor((clampedAttended - t * total) / t)) : 0;
    const message =
      canBunk === 0
        ? `On the ${targetPct}% borderline! Next class is critical.`
        : `Safe to bunk next ${canBunk} class${canBunk > 1 ? 'es' : ''} while staying ≥ ${targetPct}%`;
    return {
      percentage,
      isSafe,
      message,
      classesToAttend: 0,
      classesCanBunk: canBunk,
      margin,
    };
  } else {
    // Equation: (attended + X) / (total + X) >= t => (1 - t) * X >= t * total - attended
    const toAttend = t < 1
      ? Math.max(1, Math.ceil((t * total - clampedAttended) / (1 - t)))
      : Math.max(1, total - clampedAttended);
    const message = `Attend next ${toAttend} class${toAttend > 1 ? 'es' : ''} consecutively to hit ${targetPct}%`;
    return {
      percentage,
      isSafe,
      message,
      classesToAttend: toAttend,
      classesCanBunk: 0,
      margin,
    };
  }
}

export function calculateDualAttendance(subjects: Subject[], target: number = 75): DualAttendanceOverview {
  const targetPct = typeof target === 'number' && target > 0 && target <= 100 ? target : 75;
  const totalConducted = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
  const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
  const totalMissed = Math.max(0, totalConducted - totalAttended);

  const aggregatePercentage =
    totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 1000) / 10 : 100;
  const isAggregateSafe = aggregatePercentage >= targetPct;

  const t = targetPct / 100;
  const aggregateCanBunk = isAggregateSafe
    ? (t > 0 ? Math.max(0, Math.floor((totalAttended - t * totalConducted) / t)) : 0)
    : 0;
  const aggregateToAttend = !isAggregateSafe
    ? (t < 1 ? Math.max(1, Math.ceil((t * totalConducted - totalAttended) / (1 - t))) : Math.max(1, totalConducted - totalAttended))
    : 0;

  const shortageSubjects: Array<{ id: string; name: string; percentage: number; needed: number }> = [];
  let safeSubjectsCount = 0;

  subjects.forEach((s) => {
    const stats = calculateAttendanceStats(s.attendedClasses, s.totalClasses, targetPct);
    if (stats.isSafe) {
      safeSubjectsCount += 1;
    } else {
      shortageSubjects.push({
        id: s.id,
        name: s.name,
        percentage: stats.percentage,
        needed: stats.classesToAttend,
      });
    }
  });

  const shortageSubjectsCount = shortageSubjects.length;

  let complianceStatus: 'FULL_CLEARANCE' | 'PARTIAL_SHORTAGE' | 'CRITICAL_SHORTAGE';
  if (isAggregateSafe && shortageSubjectsCount === 0) {
    complianceStatus = 'FULL_CLEARANCE';
  } else if (isAggregateSafe && shortageSubjectsCount > 0) {
    complianceStatus = 'PARTIAL_SHORTAGE';
  } else {
    complianceStatus = 'CRITICAL_SHORTAGE';
  }

  return {
    totalConducted,
    totalAttended,
    totalMissed,
    aggregatePercentage,
    isAggregateSafe,
    aggregateCanBunk,
    aggregateToAttend,
    totalSubjects: subjects.length,
    safeSubjectsCount,
    shortageSubjectsCount,
    shortageSubjects,
    complianceStatus,
  };
}

export function isDueWithin48Hours(dateStr: string, referenceDate: Date = new Date()): {
  isWithin: boolean;
  hoursRemaining: number;
  isPast: boolean;
  badgeText: string;
} {
  try {
    const target = new Date(dateStr + (dateStr.length === 10 ? 'T23:59:59' : ''));
    const diffMs = target.getTime() - referenceDate.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffMs < 0) {
      return {
        isWithin: false,
        hoursRemaining: diffHours,
        isPast: true,
        badgeText: 'Past Due',
      };
    }

    if (diffHours <= 48) {
      let badgeText = `${diffHours}h left`;
      if (diffHours <= 12) badgeText = 'Due Today!';
      else if (diffHours <= 24) badgeText = 'Due in 24h';
      else badgeText = 'Due in <48h';
      return {
        isWithin: true,
        hoursRemaining: diffHours,
        isPast: false,
        badgeText,
      };
    }

    return {
      isWithin: false,
      hoursRemaining: diffHours,
      isPast: false,
      badgeText: '',
    };
  } catch {
    return {
      isWithin: false,
      hoursRemaining: 999,
      isPast: false,
      badgeText: '',
    };
  }
}

export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).formatToParts(0);
    const symbolPart = parts.find((p) => p.type === 'currency');
    return symbolPart ? symbolPart.value : (currencyCode || '$');
  } catch {
    return currencyCode || '$';
  }
}

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol} ${amount.toLocaleString()}`;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDays(centerDate: Date = new Date()): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const result = [];
  const current = new Date(centerDate);
  // Get Monday of this week
  const dayOfWeek = current.getDay(); // 0 is Sunday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  current.setDate(current.getDate() - distanceToMonday);

  const todayStr = getTodayDateString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(current);
    d.setDate(current.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    
    result.push({
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return result;
}
