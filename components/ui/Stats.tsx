'use client';
import Link from 'next/link';
import clsx from 'clsx';
import { useDark } from './dark';
import { Chip, type Tone } from './index';

export function BigStat({ label, value, unit, delta, deltaTone, tone, href, size = 'stat' }: {
  label: string; value: string | number; unit?: string; delta?: string; deltaTone?: Tone; tone?: 'bad' | 'good'; href?: string; size?: 'stat' | 'title-sm';
}) {
  const dark = useDark();
  const num = (
    <span className={clsx('inline-flex items-baseline gap-1.5', tone === 'bad' && (dark ? 'text-[#FF9A92]' : 'text-bad'), tone === 'good' && (dark ? 'text-[#7FD99A]' : 'text-good'))}>
      <span className={clsx('font-display font-light', size === 'stat' ? 'text-stat' : 'text-title-sm')}>{value}</span>
      {unit && <span className={clsx('text-base font-normal', dark ? 'text-fog' : 'text-sub')}>{unit}</span>}
    </span>
  );
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={clsx('text-sm', dark ? 'text-fog' : 'text-sub')}>{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {href ? <Link href={href} aria-label={`${label}: ${value} ${unit ?? ''}. Show rows`} className="rounded-full underline-offset-4 hover:underline">{num}</Link> : num}
        {delta && <Chip tone={deltaTone}>{delta}</Chip>}
      </div>
    </div>
  );
}

const COL = { yellow: '#FFE600', good: '#168736', warn: '#B86200', bad: '#B9251C', ink: '#2E2E38', steel: '#4F5D70' };
export const toneFor = (actual: number, plan: number): keyof typeof COL => (actual >= plan ? 'good' : actual >= plan * 0.85 ? 'warn' : 'bad');

export function StripeBar({ value, plan, color = 'yellow', label }: { value: number; plan?: number; color?: keyof typeof COL; label: string }) {
  const dark = useDark();
  const v = Math.min(Math.max(value, 0), 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}
      className={clsx('relative h-2.5 w-full rounded-full', dark ? 'bg-white/20' : 'bg-line')}>
      <div className="stripe absolute inset-y-0 left-0 rounded-full" style={{ width: `${v}%`, ['--c' as string]: COL[color] }} />
      {plan !== undefined && <span aria-hidden className={clsx('absolute -top-0.5 h-3.5 w-[2px]', dark ? 'bg-white' : 'bg-ink')} style={{ left: `${Math.min(plan, 100)}%` }} />}
    </div>
  );
}
