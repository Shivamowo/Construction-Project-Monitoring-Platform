import { REPORT_DATE } from './brand';
import type { ActionItem, Milestone, PoRow } from './types';

const DAY = 86400000;
const parse = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
export const diffDays = (a: string, b: string) => Math.round((parse(a) - parse(b)) / DAY);

export const varianceDays = (baseline: string, forecast: string) => diffDays(forecast, baseline);
export const daysRemaining = (forecast: string) => diffDays(forecast, REPORT_DATE);
export const drawingPct = (received: number, scope: number) => (scope ? (received / scope) * 100 : 0);
export const poReleasedPct = (released: number, total: number) => (total ? (released / total) * 100 : 0);
export const productivity = (qty: number, manDays: number) => (manDays ? qty / manDays : 0);
export const ageing = (open: string) => diffDays(REPORT_DATE, open);
export const ageBucket = (days: number) => (days <= 7 ? '0 to 7 days' : days <= 14 ? '8 to 14 days' : days <= 30 ? '15 to 30 days' : 'Over 30 days');
export const AGE_BUCKETS = ['0 to 7 days', '8 to 14 days', '15 to 30 days', 'Over 30 days'];
export const isOverdue = (a: ActionItem) => a.status !== 'Closed' && diffDays(REPORT_DATE, a.dueDate) > 0;
export const needsEscalation = (a: ActionItem) => a.status !== 'Closed' && ageing(a.openDate) > 14;
export const milestoneLate = (m: Milestone) => (m.actual ? m.actual > m.plan : m.plan < REPORT_DATE);
export const poStages = (p: PoRow) => [p.eng, p.tender, p.tech, p.commercial, p.po];
export const poDelayed = (p: PoRow) => poStages(p).some(milestoneLate);
export const poReleased = (p: PoRow) => !!p.po.actual;

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (d: string) => (d ? `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : 'Not set');
export const fmtNum = (n: number, dp = 0) => n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
export const fmtPct = (n: number, dp = 0) => `${fmtNum(n, dp)}%`;
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const cumulative = (xs: number[]) => { let t = 0; return xs.map((x) => (t += x)); };

export const RANGES = [
  { id: 'all', label: 'All dates', from: '', to: '' },
  { id: 'fy', label: 'Apr 2025 to Mar 2026', from: '2025-04-01', to: '2026-03-31' },
  { id: 'act', label: 'Apr to Aug 2025', from: '2025-04-01', to: '2025-08-31' },
  { id: '90', label: 'Last 90 days', from: '2026-07-02', to: '2026-09-30' },
];
export const inRange = (date: string, rangeId: string) => {
  const r = RANGES.find((x) => x.id === rangeId);
  return !r || !r.from || (date >= r.from && date <= r.to);
};
export const monthInRange = (ym: string, rangeId: string) => {
  const r = RANGES.find((x) => x.id === rangeId);
  return !r || !r.from || (ym >= r.from.slice(0, 7) && ym <= r.to.slice(0, 7));
};

/** Split monthly rows into four weekly rows each. */
export function toGranularity<T extends { label: string; ym: string }>(rows: T[], gran: 'Weekly' | 'Monthly', fields: (keyof T)[]): T[] {
  if (gran === 'Monthly') return rows;
  return rows.flatMap((r) =>
    [1, 2, 3, 4].map((w) => {
      const o: Record<string, unknown> = { ...r, label: `W${w} ${r.label}` };
      fields.forEach((f) => { const v = r[f]; o[f as string] = typeof v === 'number' ? Math.round((v / 4) * 100) / 100 : v; });
      return o as T;
    }),
  );
}
