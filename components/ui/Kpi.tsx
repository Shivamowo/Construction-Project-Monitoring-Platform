'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const RAIL = { neutral: '#188CE5', good: '#168736', caution: '#E08A1E', critical: '#B9251C' };

export function Sparkline({ data, color = '#188CE5', w = 80, h = 24 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 4) + 2, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#9AA0AE" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

/** Equal-width KPI row; `n` is the column count on wide screens. */
export function KpiRow({ n, children }: { n: number; children: ReactNode }) {
  return <div className="kpis" style={{ ['--n' as string]: n }}>{children}</div>;
}

export function KpiCard({ label, value, unit, context, rail = 'neutral', href, spark, children, foot }: {
  label: string; value?: string | number; unit?: string; context?: string; rail?: keyof typeof RAIL; href?: string; spark?: number[]; children?: ReactNode; foot?: ReactNode;
}) {
  const body = (
    <>
      <span className="label">{label}</span>
      <span className="kfig">
        {children ?? <><span className="numeral">{value}</span>{unit && <span className="unit">{unit}</span>}</>}
      </span>
      {foot ? <span className="caption" style={{ overflow: 'visible' }}>{foot}</span> : <span className="caption">{context}</span>}
      {spark && <Sparkline data={spark} color={RAIL[rail]} />}
    </>
  );
  const style = { ['--rail' as string]: RAIL[rail] };
  return href
    ? <Link href={href} className="tile tile-white kpi" style={style} aria-label={`${label}: ${value ?? ''}${unit ? ` ${unit}` : ''}. ${context ?? ''} Show rows`}>{body}</Link>
    : <div className="tile tile-white kpi" style={style}>{body}</div>;
}
