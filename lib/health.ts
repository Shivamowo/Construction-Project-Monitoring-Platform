import { ageing, drawingPct, isOverdue, poReleasedPct, varianceDays } from './metrics';
import { hash01 } from './series';
import type { ActionItem, DrawingType, Project, Risk } from './types';

export type HealthTone = 'good' | 'warn' | 'bad' | 'none';
export interface HealthCell { key: string; label: string; tone: HealthTone; value: string }
export const HEALTH_COLS = ['Schedule', 'Progress', 'Drawings', 'Procurement', 'Risks', 'Actions'] as const;

interface Sources { actions: ActionItem[]; risks: Risk[]; drawingTypes: DrawingType[]; po: { total: number; planned: number; released: number }; detailId: string }

const band = (v: number, good: number, warn: number, higherIsBetter = true): HealthTone =>
  higherIsBetter ? (v >= good ? 'good' : v >= warn ? 'warn' : 'bad') : (v <= good ? 'good' : v <= warn ? 'warn' : 'bad');

/**
 * One health row per project. The project with full registers uses them directly; the others
 * use estimates from their plan and actual progress until their registers are connected.
 */
export function projectHealth(p: Project, s: Sources): HealthCell[] {
  if (p.phase === 'Planned') return HEALTH_COLS.map((c) => ({ key: c, label: c, tone: 'none', value: 'Not started' }));
  const v = varianceDays(p.baselineFinish, p.forecastFinish);
  const gap = +(p.actualPct - p.planPct).toFixed(1);
  const h = hash01(p.id);
  let drawings: number, procurement: number, highRisks: number, overdue: number;
  if (p.id === s.detailId) {
    const civil = s.drawingTypes.find((d) => d.name === 'Civil');
    drawings = civil ? drawingPct(civil.received, civil.plan) : 0;
    procurement = poReleasedPct(s.po.released, s.po.planned);
    highRisks = s.risks.filter((r) => r.projectId === p.id && r.status !== 'Closed' && r.rating === 'High').length;
    overdue = s.actions.filter((a) => a.projectId === p.id && isOverdue(a)).length;
  } else {
    const behind = Math.max(-gap, 0);
    drawings = Math.round(100 - behind * 2 - h * 6);
    procurement = Math.round(98 - behind * 3 - h * 8);
    highRisks = p.status === 'Delay' ? 4 : p.status === 'At risk' ? 2 : Math.round(h);
    overdue = Math.round(behind * 1.2 + h * 2);
  }
  return [
    { key: 'Schedule', label: 'Schedule', tone: band(v, 0, 14, false), value: v > 0 ? `${v} days late` : v < 0 ? `${-v} days early` : 'On baseline' },
    { key: 'Progress', label: 'Progress', tone: band(gap, 0, -5), value: `${gap > 0 ? '+' : ''}${gap} pts against plan` },
    { key: 'Drawings', label: 'Drawings', tone: band(drawings, 100, 85), value: `${Math.round(drawings)}% of planned received` },
    { key: 'Procurement', label: 'Procurement', tone: band(procurement, 90, 75), value: `${Math.round(procurement)}% of planned POs released` },
    { key: 'Risks', label: 'Risks', tone: band(highRisks, 0, 2, false), value: `${highRisks} high risks open` },
    { key: 'Actions', label: 'Actions', tone: band(overdue, 0, 3, false), value: `${overdue} actions open over 30 days` },
  ];
}

/** Ageing bins in days open. */
export const AGE_BINS = ['0 to 14', '14 to 30', '30 to 60', 'Over 60'];
export const ageBin = (open: string) => { const d = ageing(open); return d < 14 ? AGE_BINS[0] : d <= 30 ? AGE_BINS[1] : d <= 60 ? AGE_BINS[2] : AGE_BINS[3]; };
