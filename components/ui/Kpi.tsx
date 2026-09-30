'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const RAIL = { neutral: '#188CE5', good: '#168736', caution: '#E08A1E', critical: '#B9251C' };

export function Sparkline({ data, color = '#188CE5' }: { data: number[]; color?: string }) {
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * 76 + 2, 20 - ((v - min) / span) * 16 + 2] as const);
  const last = pts[pts.length - 1];
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" aria-hidden className="shrink-0">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#9AA0AE" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export function KpiCard({ label, value, unit, context, rail = 'neutral', href, spark, children }: {
  label: string; value: string | number; unit?: string; context?: string; rail?: keyof typeof RAIL; href?: string; spark?: number[]; children?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="label">{label}</span>
        <span className="inline-flex items-baseline"><span className="numeral">{value}</span>{unit && <span className="unit">{unit}</span>}</span>
        {context && <span className="ctx">{context}</span>}
        {children}
      </div>
      {spark && <Sparkline data={spark} color={RAIL[rail]} />}
    </>
  );
  const style = { ['--rail' as string]: RAIL[rail] };
  return href
    ? <Link href={href} className="tile-white kpi" style={style} aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}. ${context ?? ''} Show rows`}>{body}</Link>
    : <div className="tile-white kpi" style={style}>{body}</div>;
}
