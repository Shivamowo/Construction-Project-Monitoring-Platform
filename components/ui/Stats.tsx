'use client';
import Link from 'next/link';
import clsx from 'clsx';
import { Chip, type Tone } from './index';

export function BigStat({ label, value, unit, delta, deltaTone, tone, href, size = 'stat' }: {
  label: string; value: string | number; unit?: string; delta?: string; deltaTone?: Tone; tone?: 'bad' | 'good'; href?: string; size?: 'stat' | 'title-sm';
}) {
  const num = (
    <span className={clsx('inline-flex items-baseline', tone && `stat-tone-${tone}`)}>
      <span className={clsx('numeral', size === 'title-sm' && 'sm')}>{value}</span>
      {unit && <span className="unit">{unit}</span>}
    </span>
  );
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="label">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {href ? <Link href={href} aria-label={`${label}: ${value} ${unit ?? ''}. Show rows`} className="underline-offset-4 hover:underline">{num}</Link> : num}
        {delta && <Chip tone={deltaTone}>{delta}</Chip>}
      </div>
    </div>
  );
}

const COL = { yellow: '#FFE600', good: '#168736', warn: '#B86200', bad: '#B9251C', ink: '#2E2E38', steel: '#4F5D70' };
export const toneFor = (actual: number, plan: number): keyof typeof COL => (actual >= plan ? 'good' : actual >= plan * 0.85 ? 'warn' : 'bad');

export function StripeBar({ value, plan, color = 'yellow', label }: { value: number; plan?: number; color?: keyof typeof COL; label: string }) {
  const v = Math.min(Math.max(value, 0), 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} className="stripe">
      <i style={{ width: `${v}%`, ['--c' as string]: COL[color] }} />
      {plan !== undefined && <b aria-hidden style={{ left: `calc(${Math.min(plan, 100)}% - 1px)` }} />}
    </div>
  );
}
