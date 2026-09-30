import { REPORT_DATE } from './brand';
import type { DprRow } from './types';

/** Deterministic 0..1 value from a string, so derived series are stable between renders. */
export function hash01(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const reportT = Date.parse(`${REPORT_DATE}T00:00:00Z`);

/**
 * Daily plan and actual for a DPR row over the last `days` days, ending on the report date.
 * The report-date point is the logged FTD value; earlier points are estimated around it.
 */
export function dprDaily(r: DprRow, days = 14) {
  return Array.from({ length: days }, (_, i) => {
    const date = iso(reportT - (days - 1 - i) * DAY);
    const last = i === days - 1;
    const f = 0.72 + hash01(`${r.id}:${date}`) * 0.4;
    return { date, plan: r.ftdPlan, actual: last ? r.ftdAct : Math.round(r.ftdAct * f) };
  });
}

/** Total shortfall (plan minus actual, floored at 0) per day of the report month. */
export function monthShortfall(rows: DprRow[]) {
  const [y, m] = [+REPORT_DATE.slice(0, 4), +REPORT_DATE.slice(5, 7)];
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const first = Date.UTC(y, m - 1, 1);
  const series = rows.map((r) => dprDaily(r, len));
  return Array.from({ length: len }, (_, i) => {
    const date = iso(first + i * DAY);
    const total = series.reduce((s, sr) => s + Math.max(sr[i].plan - sr[i].actual, 0), 0);
    return { date, day: i + 1, weekday: (new Date(first + i * DAY).getUTCDay() + 6) % 7, total };
  });
}
