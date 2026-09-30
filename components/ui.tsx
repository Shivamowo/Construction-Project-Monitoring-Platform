'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { setR(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  return r;
}

export function PageHeader({ title, lede, children }: { title: string; lede?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-semibold">{title}</h1>
        {lede && <p className="mt-1 max-w-[60ch] text-sm text-graphite">{lede}</p>}
      </div>
      {children}
    </div>
  );
}

export function Tile({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-lg border border-line bg-white p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, href, tone, note }: { label: string; value: string | number; href?: string; tone?: 'bad' | 'good'; note?: string }) {
  const num = <span className={clsx('font-display text-2xl font-semibold', tone === 'bad' && 'text-bad', tone === 'good' && 'text-good')}>{value}</span>;
  return (
    <div className="flex h-full flex-col justify-between gap-2 rounded-lg border border-line bg-white p-4 sm:p-5">
      <span className="text-sm text-graphite">{label}</span>
      {href ? <Link href={href} className="w-fit underline-offset-4 hover:underline" aria-label={`${label}: ${value}. Show rows`}>{num}</Link> : num}
      {note && <span className={clsx('text-xs', tone === 'bad' ? 'text-bad' : 'text-graphite')}>{note}</span>}
    </div>
  );
}

const DOT = { good: 'bg-good', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-info', none: 'bg-graphite' };
export function Chip({ tone = 'none', children }: { tone?: keyof typeof DOT; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-white px-2.5 py-0.5 text-xs font-medium text-ink">
      <span aria-hidden className={clsx('h-2 w-2 rounded-full', DOT[tone])} />
      {children}
    </span>
  );
}
export const statusTone = (s: string): keyof typeof DOT => (s === 'On track' ? 'good' : s === 'At risk' ? 'warn' : s === 'Delay' ? 'bad' : 'none');

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-full border border-line bg-white p-0.5">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={o === value} onClick={() => onChange(o)}
          className={clsx('h-8 rounded-full px-3 text-sm font-medium transition-colors', o === value ? 'bg-brand text-ink' : 'text-graphite hover:text-ink')}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, children }: { title: string; hint: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line bg-white p-6">
      <p className="text-base font-semibold">{title}</p>
      <p className="max-w-[60ch] text-sm text-graphite">{hint}</p>
      {children}
    </div>
  );
}

export function Button({ variant = 'secondary', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return (
    <button type="button" {...p}
      className={clsx('inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded px-3 text-sm font-semibold transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-ink hover:brightness-95',
        variant === 'secondary' && 'border border-line bg-white text-ink hover:bg-mist',
        variant === 'ghost' && 'text-ink hover:bg-mist', className)} />
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
        className={clsx('absolute flex flex-col overflow-hidden border-line bg-white transition-transform duration-200 focus:outline-none',
          side === 'right' ? 'right-0 top-0 h-full w-full max-w-md border-l' : 'bottom-0 left-0 max-h-[80vh] w-full rounded-t-lg border-t',
          open ? 'translate-x-0 translate-y-0' : side === 'right' ? 'translate-x-full' : 'translate-y-full')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close panel" className="rounded p-1 hover:bg-mist"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5">{open && children}</div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div key={t.id} className={clsx('max-w-md rounded border-l-4 bg-ink px-4 py-2 text-sm text-white', t.tone === 'error' ? 'border-bad' : 'border-brand')}>{t.msg}</div>
      ))}
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="flex flex-col gap-1 text-sm font-medium">{label}{children}</label>
);
export const inputCls = 'h-9 w-full rounded border border-line bg-white px-2 text-sm font-normal text-ink';
