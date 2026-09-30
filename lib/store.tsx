'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as repo from './repo';
import type { ActionItem, AuditEntry, Delay, DprRow, DrawingRow, DrawingType, Entity, Gran, PoRow, Project, Risk } from './types';
import { inRange } from './metrics';

export interface Filters { projectId: string; discipline: string; range: string; gran: Gran }
export interface Toast { id: number; msg: string; tone: 'ok' | 'error' }
interface Data { actions: ActionItem[]; risks: Risk[]; delays: Delay[]; dpr: DprRow[]; audit: AuditEntry[] }
interface Ref {
  projects: Project[]; drawings: { types: (DrawingType & { discipline: string })[]; tracker: DrawingRow[] };
  procurement: { rows: PoRow[]; categories: { name: string; total: number; planned: number; released: number; pastDue: number }[]; pipeline: { name: string; value: number; pastDue: number }[]; releasePlan: number[] };
  contractors: Awaited<ReturnType<typeof repo.getContractors>>; schedule: Awaited<ReturnType<typeof repo.getSchedule>>;
  outline: [number, number][]; trends: Record<string, number[]>;
}
type Row = { id: string };

interface Ctx extends Data, Ref {
  ready: boolean; error: string; retry: () => void; filters: Filters; setFilters: (p: Partial<Filters>) => void;
  updateRow: (entity: Entity, id: string, patch: Record<string, unknown>) => void;
  addRow: (entity: Entity, row: Row) => void;
  auditOpen: boolean; setAuditOpen: (v: boolean) => void;
  cmd: number; fireCmd: () => void; showFilters: boolean; setShowFilters: (v: boolean) => void;
  toasts: Toast[]; toast: (msg: string, tone?: Toast['tone']) => void;
}

const KEY = 'sitewise:v3';
export const PRIMARY = repo.PRIMARY;
export const DISCIPLINES = ['All', 'Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];
const emptyRef: Ref = { projects: [], drawings: { types: [], tracker: [] }, procurement: { rows: [], categories: [], pipeline: [], releasePlan: [] }, contractors: { monthly: [], manpower: [], vendors: [], quantities: [] }, schedule: [], outline: [], trends: {} };
const emptyData: Data = { actions: [], risks: [], delays: [], dpr: [], audit: [] };
const StoreCtx = createContext<Ctx | null>(null);
const show = (v: unknown) => (Array.isArray(v) ? `${v.length} comments` : String(v ?? ''));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(emptyData);
  const [ref, setRef] = useState<Ref>(emptyRef);
  const [filters, setF] = useState<Filters>({ projectId: PRIMARY, discipline: 'All', range: 'all', gran: 'Monthly' });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [cmd, setCmd] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const fireCmd = useCallback(() => setCmd((c) => c + 1), []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    let dead = false;
    setError(''); setReady(false);
    (async () => {
      try {
        const [projects, actions, risks, delays, dpr, drawings, procurement, contractors, schedule, outline, trends] = await Promise.all([
          repo.getProjects(), repo.getActions(), repo.getRisks(), repo.getDelays(), repo.getDpr(), repo.getDrawings(), repo.getProcurement(), repo.getContractors(), repo.getSchedule(), repo.getMapOutline(), repo.getTrends(),
        ]);
        let saved: { data?: Partial<Data>; filters?: Partial<Filters> } | null = null;
        try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { /* storage unavailable */ }
        if (dead) return;
        setRef({ projects, drawings, procurement, contractors, schedule, outline, trends });
        setData({ actions: saved?.data?.actions ?? actions, risks: saved?.data?.risks ?? risks, delays: saved?.data?.delays ?? delays, dpr: saved?.data?.dpr ?? dpr, audit: saved?.data?.audit ?? [] });
        if (saved?.filters) setF((f) => ({ ...f, ...saved!.filters }));
        setReady(true);
      } catch (e) {
        if (!dead) { setError(e instanceof Error ? e.message : 'Data could not be loaded.'); setReady(true); }
      }
    })();
    return () => { dead = true; };
  }, [attempt]);
  useEffect(() => {
    if (!ready || error) return;
    try { localStorage.setItem(KEY, JSON.stringify({ data, filters })); } catch { /* storage full or blocked */ }
  }, [data, filters, ready, error]);

  const setFilters = useCallback((p: Partial<Filters>) => setF((f) => ({ ...f, ...p })), []);
  const retry = useCallback(() => setAttempt((a) => a + 1), []);
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

  const value = useMemo<Ctx>(() => ({ ...data, ...ref, ready, error, retry, filters, setFilters, updateRow, addRow, auditOpen, setAuditOpen, cmd, fireCmd, showFilters, setShowFilters, toasts, toast }),
    [data, ref, ready, error, retry, filters, setFilters, updateRow, addRow, auditOpen, cmd, fireCmd, showFilters, toasts, toast]);
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
  const active = s.projects.find((p) => p.id === projectId) ?? s.projects.find((p) => p.id === PRIMARY) ?? s.projects[0];
  const hasDetail = projectId === 'all' || projectId === PRIMARY;
  return useMemo(() => {
    const scope = <T extends { projectId: string; discipline: string; openDate?: string }>(rows: T[]) =>
      rows.filter((r) => (projectId === 'all' || r.projectId === projectId) && (discipline === 'All' || r.discipline === discipline) && (!r.openDate || inRange(r.openDate, range)));
    return { ...s, active, hasDetail, actions: scope(s.actions), risks: scope(s.risks), delays: scope(s.delays), dpr: scope(s.dpr) };
  }, [s, projectId, discipline, range, active, hasDetail]);
}
