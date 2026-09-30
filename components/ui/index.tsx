'use client';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

export { BigStat, StripeBar, toneFor } from './Stats';
export { FilterBar, PillSelect } from './FilterBar';
export { KpiCard, Sparkline, RAIL } from './Kpi';
export { StatusChip, AgeingCell, OwnerCell, VarianceChip, Skeleton, Gate } from './Cells';
export { FilterCluster, HeaderFilters, useUrlParams, type FilterDef } from './FilterCluster';
export { DarkPanel, TabNotch, MasterRow, DetailPane, InnerTile } from './Panel';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  return r;
}

export function Tile({ title, action, children, className, surface }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; surface?: boolean }) {
  return (
    <section className={clsx(surface ? 'tile-white' : 'tile', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="m-0 text-base font-medium">{title}</h2>}
          {action}
        </div>
      )}
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
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const [bg, fg] = AV[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return <span title={name} className="avatar" style={{ width: size, height: size, background: bg, color: fg }}>{ini}</span>;
}

export function Button({ variant = 'secondary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'dark' }) {
  const cls = { primary: 'btn-primary', secondary: 'btn', ghost: 'btn-ghost', dark: 'btn-dark' }[variant];
  return <button type="button" {...p} className={clsx(cls, className)} />;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 gap-1 rounded-full bg-surface p-1">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={o === value} onClick={() => onChange(o)}
          className="h-9 rounded-full px-4 text-sm font-medium" style={o === value ? { background: 'var(--yellow)', color: 'var(--text)' } : { color: 'var(--muted)' }}>{o}</button>
      ))}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="tile flex flex-col items-start gap-3">
      <p className="m-0 max-w-[60ch] text-base">{title}</p>
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
    <div className="fixed inset-0 z-50" style={{ pointerEvents: open ? 'auto' : 'none' }} aria-hidden={!open}>
      <div onClick={onClose} className="absolute inset-0" style={{ background: 'rgba(46,46,56,.45)', opacity: open ? 1 : 0, transition: 'opacity 200ms' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="absolute flex flex-col overflow-hidden focus:outline-none" style={{ background: 'var(--surface)', transition: 'transform 200ms', ...pos }}>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="m-0 text-lg font-medium">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close panel" className="icon-btn" style={{ background: 'var(--tile)' }}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{open && children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="max-w-md rounded-full px-5 py-3 text-sm" style={{ background: 'var(--panel)', color: '#fff', outline: t.tone === 'error' ? '2px solid #FF9A92' : 'none' }}>{t.msg}</div>
      ))}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>
);
export const inputCls = 'input';
