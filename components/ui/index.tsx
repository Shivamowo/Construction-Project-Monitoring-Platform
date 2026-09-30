'use client';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { TileHeader } from './TileHeader';

export { TileHeader } from './TileHeader';
export { BigStat, StripeBar, toneFor } from './Stats';
export { FilterBar, PillSelect } from './FilterBar';
export { DarkPanel, TabNotch, MasterRow, DetailPane, InnerTile } from './Panel';
export { KpiCard, KpiRow, Sparkline, RAIL } from './Kpi';
export { StatusChip, AgeingCell, OwnerCell, VarianceChip, Skeleton, Gate } from './Cells';
export { FilterCluster, HeaderFilters, useUrlParams, type FilterDef } from './FilterCluster';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  return r;
}

export function Tile({ title, action, children, className, surface }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; surface?: boolean }) {
  return (
    <section className={clsx('tile', surface && 'tile-white', className)}>
      {title && <TileHeader title={title}>{action}</TileHeader>}
      {children}
    </section>
  );
}

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'none';
export function Chip({ tone = 'none', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx('chip', `chip-${tone}`)}>{children}</span>;
}
export const statusTone = (s: string): Tone => (s === 'On track' ? 'good' : s === 'At risk' ? 'warn' : s === 'Delay' ? 'bad' : 'none');

const AV = [['rgba(24,140,229,.16)', '#0F6DB3'], ['rgba(22,135,54,.16)', '#168736'], ['rgba(184,98,0,.16)', '#B86200'], ['rgba(46,46,56,.12)', '#2E2E38']];
export function Avatar({ name }: { name: string }) {
  const ini = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const [bg, fg] = AV[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return <span title={name} className="avatar" style={{ background: bg, color: fg }}>{ini}</span>;
}

export function Button({ variant = 'secondary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'dark' }) {
  const cls = { primary: 'btn-primary', secondary: 'btn', ghost: 'btn-ghost', dark: 'btn-dark' }[variant];
  return <button type="button" {...p} className={clsx(cls, className)} />;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="seg">
      {options.map((o) => <button key={o} type="button" role="radio" aria-checked={o === value} onClick={() => onChange(o)}>{o}</button>)}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="tile flex flex-col items-center gap-3 text-center">
      <p className="body">{title}</p>
      {action && <Button variant="primary" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

export function Drawer({ open, onClose, title, side = 'right', children }: { open: boolean; onClose: () => void; title: string; side?: 'right' | 'bottom'; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); prev?.focus?.(); };
  }, [open, onClose]);
  const pos = side === 'right'
    ? { right: 0, top: 0, height: '100%', width: '100%', maxWidth: 448, borderRadius: '32px 0 0 32px', transform: open ? 'none' : 'translateX(100%)' }
    : { bottom: 0, left: 0, width: '100%', maxHeight: '80vh', borderRadius: '32px 32px 0 0', transform: open ? 'none' : 'translateY(100%)' };
  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: open ? 'auto' : 'none', visibility: open ? 'visible' : 'hidden', transition: 'visibility 200ms' }} aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(46,46,56,.45)', opacity: open ? 1 : 0, transition: 'opacity 200ms' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="absolute flex flex-col overflow-hidden p-6 focus:outline-none" style={{ background: 'var(--surface)', transition: 'transform 200ms', ...pos }}>
        <TileHeader title={title}><button type="button" onClick={onClose} aria-label="Close panel" className="icon-btn" style={{ background: 'var(--tile)' }}><X /></button></TileHeader>
        <div className="overflow-y-auto">{open && children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => <div key={t.id} className="toast" style={{ outline: t.tone === 'error' ? '2px solid var(--red-d)' : 'none' }}>{t.msg}</div>)}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="label flex flex-col gap-2" style={{ color: 'var(--text)' }}>{label}{children}</label>
);
export const inputCls = 'input';
