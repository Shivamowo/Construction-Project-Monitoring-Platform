'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ACTIONS, DELAYS, DPR, PRIMARY, PROJECTS, RISKS } from '@/data/seed';
import type { ActionItem, AuditEntry, Delay, DprRow, Entity, Gran, Risk } from './types';
import { inRange } from './metrics';

export interface Filters { projectId: string; discipline: string; range: string; gran: Gran }
export interface Toast { id: number; msg: string; tone: 'ok' | 'error' }
interface Data { actions: ActionItem[]; risks: Risk[]; delays: Delay[]; dpr: DprRow[]; audit: AuditEntry[] }
type Row = { id: string };

interface Ctx extends Data {
  ready: boolean; filters: Filters; setFilters: (p: Partial<Filters>) => void;
  updateRow: (entity: Entity, id: string, patch: Record<string, unknown>) => void;
  addRow: (entity: Entity, row: Row) => void;
  auditOpen: boolean; setAuditOpen: (v: boolean) => void;
  toasts: Toast[]; toast: (msg: string, tone?: Toast['tone']) => void;
}

const KEY = 'sitewise:v1';
export const DISCIPLINES = ['All', 'Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];
const initial: Data = { actions: ACTIONS, risks: RISKS, delays: DELAYS, dpr: DPR, audit: [] };
const StoreCtx = createContext<Ctx | null>(null);
const show = (v: unknown) => (Array.isArray(v) ? `${v.length} comments` : String(v ?? ''));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(initial);
  const [filters, setF] = useState<Filters>({ projectId: PRIMARY, discipline: 'All', range: 'all', gran: 'Monthly' });
  const [ready, setReady] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.data) setData((d) => ({ ...d, ...s.data }));
        if (s.filters) setF((f) => ({ ...f, ...s.filters }));
      }
    } catch { /* storage unavailable */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ data, filters })); } catch { /* storage full or blocked */ }
  }, [data, filters, ready]);

  const setFilters = useCallback((p: Partial<Filters>) => setF((f) => ({ ...f, ...p })), []);
  const toast = useCallback((msg: string, tone: Toast['tone'] = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  const updateRow = useCallback((entity: Entity, id: string, patch: Record<string, unknown>) => {
    setData((d) => {
      const rows = d[entity] as unknown as (Row & Record<string, unknown>)[];
      const old = rows.find((r) => r.id === id);
      if (!old) return d;
      const at = new Date().toISOString();
      const entries: AuditEntry[] = Object.keys(patch)
        .filter((k) => show(old[k]) !== show(patch[k]))
        .map((k) => ({ id: uid(), at, entity, rowId: id, kind: 'updated', field: k, from: show(old[k]), to: show(patch[k]) }));
      if (!entries.length) return d;
      return { ...d, [entity]: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)), audit: [...entries, ...d.audit].slice(0, 300) };
    });
  }, []);
  const addRow = useCallback((entity: Entity, row: Row) => {
    setData((d) => ({
      ...d, [entity]: [row, ...(d[entity] as unknown as Row[])],
      audit: [{ id: uid(), at: new Date().toISOString(), entity, rowId: row.id, kind: 'created' as const, field: '', from: '', to: '' }, ...d.audit].slice(0, 300),
    }));
  }, []);

  const value = useMemo<Ctx>(() => ({ ...data, ready, filters, setFilters, updateRow, addRow, auditOpen, setAuditOpen, toasts, toast }), [data, ready, filters, setFilters, updateRow, addRow, auditOpen, toasts, toast]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

/** Data narrowed by the global project, discipline and date range filters. */
export function useScoped() {
  const s = useStore();
  const { projectId, discipline, range } = s.filters;
  const active = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];
  const hasDetail = projectId === 'all' || projectId === PRIMARY;
  return useMemo(() => {
    const scope = <T extends { projectId: string; discipline: string; openDate?: string }>(rows: T[]) =>
      rows.filter((r) => (projectId === 'all' || r.projectId === projectId) && (discipline === 'All' || r.discipline === discipline) && (!r.openDate || inRange(r.openDate, range)));
    return { ...s, active, hasDetail, actions: scope(s.actions), risks: scope(s.risks), delays: scope(s.delays), dpr: scope(s.dpr) };
  }, [s, projectId, discipline, range, active, hasDetail]);
}
