'use client';
import type { ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { ageTone } from '@/lib/metrics';
import { num } from '@/lib/format';
import { Avatar, EmptyState, Button, type Tone } from './index';
import { StripeBar } from './Stats';

export function StatusChip({ tone = 'none', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`chip chip-${tone}`}><i className="dot" aria-hidden />{children}</span>;
}

export function AgeingCell({ days }: { days: number }) {
  const t = ageTone(days);
  return (
    <div className="flex min-w-[110px] flex-col gap-1" title={`${days} days open`}>
      <span className="text-sm">{days} days</span>
      <div style={{ width: 80 }}><StripeBar label={`Open ${days} days`} value={Math.min((days / 60) * 100, 100)} color={t} /></div>
    </div>
  );
}

export function OwnerCell({ role }: { role: string }) {
  return <span className="inline-flex items-center gap-2 text-sm"><Avatar name={role} size={28} />{role}</span>;
}

/** Variance is plan minus received: positive means behind plan. */
export function VarianceChip({ plan, received }: { plan: number; received: number }) {
  const v = plan - received;
  if (v === 0) return <StatusChip>On plan</StatusChip>;
  if (v < 0) return <StatusChip tone="good">{num(-v)} ahead</StatusChip>;
  return <StatusChip tone={v / (plan || 1) > 0.2 ? 'bad' : 'warn'}>{num(v)} behind</StatusChip>;
}

export function Skeleton({ h = 160, className = '' }: { h?: number; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ height: h }} aria-hidden />;
}

/** Loading and error states for every data view. */
export function Gate({ children }: { children: ReactNode }) {
  const { ready, error, retry } = useStore();
  if (!ready) return <div role="status" aria-label="Loading data" className="flex flex-col gap-4"><div className="grid gap-4 md:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div><Skeleton h={320} /></div>;
  if (error) return <EmptyState title={`Data could not be loaded: ${error}. Check the connection and retry.`} action={{ label: 'Retry', onClick: retry }} />;
  return <>{children}</>;
}
export { Button };
