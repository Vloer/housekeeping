/**
 * Centralized Date & Overdue Utility Functions
 */

export const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getTodayStr = (): string => {
  return formatDate(new Date());
};

export const getIn7DaysStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return formatDate(d);
};

export const getThisWeekBounds = (): { mondayStr: string; sundayStr: string } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
  const distToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const mon = new Date(now);
  mon.setDate(now.getDate() - distToMon);

  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  return {
    mondayStr: formatDate(mon),
    sundayStr: formatDate(sun),
  };
};

/**
 * Lenient Overdue Progression Brackets:
 * 1-3d -> Light Warm Red (#F87171)
 * 4-7d -> Medium Red (#EF4444)
 * 8-14d -> Deep Red (#DC2626)
 * >14d -> Intense Dark Red (#991B1B)
 */
export const getOverdueTheme = (daysOverdue: number): { text: string; bg: string; border: string } => {
  if (daysOverdue <= 3) {
    return { text: '#F87171', bg: '#FEF2F2', border: 'rgba(248, 113, 113, 0.3)' };
  }
  if (daysOverdue <= 7) {
    return { text: '#EF4444', bg: '#FEE2E2', border: 'rgba(239, 68, 68, 0.3)' };
  }
  if (daysOverdue <= 14) {
    return { text: '#DC2626', bg: '#FEE2E2', border: 'rgba(220, 38, 38, 0.4)' };
  }
  return { text: '#991B1B', bg: '#FEE2E2', border: 'rgba(153, 27, 27, 0.4)' };
};
