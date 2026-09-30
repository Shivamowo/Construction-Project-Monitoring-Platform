'use client';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useDark } from './dark';

export { BigStat, StripeBar, toneFor } from './Stats';
export { FilterBar, PillSelect } from './FilterBar';
export { DarkPanel, TabNotch, MasterRow, DetailPane, InnerTile } from './Panel';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  return r;
}

export function Tile({ title, action, children, className, surface }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; surface?: boolean }) {
  return (
    <section className={clsx('rounded-xl p-6', surface ? 'bg-surface' : 'bg-tile', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-medium">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const TONE = {
  good: ['bg-good/[.12] text-good', 'bg-white/10 text-[#7FD99A]', 'bg-good'],
  warn: ['bg-warn/[.12] text-warn', 'bg-white/10 text-[#FFB866]', 'bg-warn'],
  bad: ['bg-bad/[.12] text-bad', 'bg-white/10 text-[#FF9A92]', 'bg-bad'],
  info: ['bg-info/[.12] text-[#0F6DB3]', 'bg-white/10 text-[#8DCBFF]', 'bg-info'],
  none: ['bg-ink/[.08] text-sub', 'bg-white/10 text-fog', 'bg-muted'],
} as const;
export type Tone = keyof typeof TONE;

export function Chip({ tone = 'none', children }: { tone?: Tone; children: ReactNode }) {
  const dark = useDark();
  return <span className={clsx('inline-flex items-center whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-medium', TONE[tone][dark ? 1 : 0])}>{children}</span>;
}
export const statusTone = (s: string): Tone => (s === 'On track' ? 'good' : s === 'At risk' ? 'warn' : s === 'Delay' ? 'bad' : 'none');

const AV = ['bg-info/[.16] text-[#0F6DB3]', 'bg-good/[.16] text-good', 'bg-warn/[.16] text-warn', 'bg-ink/[.12] text-ink'];
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const tone = AV[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return <span title={name} style={{ width: size, height: size }} className={clsx('inline-flex shrink-0 items-center justify-center rounded-full text-xs font-medium', tone)}>{ini}</span>;
}

export function Button({ variant = 'secondary', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button type="button" {...p}
      className={clsx('inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-ink hover:brightness-95',
        variant === 'secondary' && 'bg-surface text-ink hover:bg-white/70',
        variant === 'ghost' && 'text-ink hover:bg-ink/10', className)} />
  );
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-full bg-surface p-1">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={o === value} onClick={() => onChange(o)} className={clsx('h-8 rounded-full px-4 text-sm font-medium', o === value ? 'bg-brand text-ink' : 'text-sub hover:text-ink')}>{o}</button>
      ))}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-tile p-6">
      <p className="max-w-[60ch] text-base">{title}</p>
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
  return (
    <div className={clsx('fixed inset-0 z-50', !open && 'pointer-events-none')} aria-hidden={!open}>
      <div onClick={onClose} className={clsx('absolute inset-0 bg-ink/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        className={clsx('absolute flex flex-col overflow-hidden bg-surface transition-transform duration-200 focus:outline-none',
          side === 'right' ? 'right-0 top-0 h-full w-full max-w-md rounded-l-3xl' : 'bottom-0 left-0 max-h-[80vh] w-full rounded-t-3xl',
          open ? 'translate-x-0 translate-y-0' : side === 'right' ? 'translate-x-full' : 'translate-y-full')}>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close panel" className="flex h-10 w-10 items-center justify-center rounded-full bg-tile hover:bg-line"><X size={20} /></button>
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
        <div key={t.id} className={clsx('max-w-md rounded-full bg-panel px-5 py-3 text-sm text-white', t.tone === 'error' && 'outline outline-2 outline-[#FF9A92]')}>{t.msg}</div>
      ))}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>
);
export const inputCls = 'h-10 w-full rounded-full border border-line bg-surface px-4 text-sm font-normal text-ink';
