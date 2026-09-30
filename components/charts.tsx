'use client';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNum } from '@/lib/metrics';
import { ChartLegend } from './ChartLegend';

export const C = { ink: '#2E2E38', muted: '#9AA0AE', steel: '#4F5D70', yellow: '#FFE600', line: '#D5D9E2', tint: '#9AA0AE', good: '#168736', warn: '#E08A1E', bad: '#B9251C', info: '#188CE5' };
export const MARGIN = { top: 8, right: 0, bottom: 0, left: 0 };
const tick = { fill: '#5F5F6C' };
const tip = { wrapperClassName: 'tabular', cursor: { fill: 'rgba(46,46,56,0.06)' } };

export interface Series { key: string; name: string; color: string }

/** Bar chart; `highlight` colours one x category yellow on the first series. */
export function Bars({ data, xKey, series, height = 200, highlight, label, unit = '', labels }: {
  data: Record<string, string | number | null>[]; xKey: string; series: Series[]; height?: number; highlight?: string; label: string; unit?: string; labels?: boolean;
}) {
  return (
    <div>
      {series.length > 1 && <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />}
      <div role="img" aria-label={label} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ ...MARGIN, top: labels ? 20 : 8 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} interval={0} />
            <YAxis width={44} tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} allowDecimals={false} />
            <Tooltip {...tip} formatter={(v) => `${fmtNum(Number(v))}${unit}`} />
            {series.map((s, si) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={40}>
                {highlight && si === 0 && data.map((d, i) => <Cell key={i} fill={d[xKey] === highlight ? C.yellow : s.color} />)}
                {labels && <LabelList dataKey={s.key} position="top" formatter={(v: unknown) => fmtNum(Number(v))} />}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Trend({ data, xKey, series, height = 200, label, labels }: { data: Record<string, string | number | null>[]; xKey: string; series: Series[]; height?: number; label: string; labels?: boolean }) {
  return (
    <div>
      {series.length > 1 && <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color, line: true }))} />}
      <div role="img" aria-label={label} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ ...MARGIN, top: labels ? 20 : 8, right: 16 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} />
            <YAxis width={44} tick={tick} tickLine={false} axisLine={false} />
            <Tooltip {...tip} />
            {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 4, fill: s.color, strokeWidth: 0 }} isAnimationActive={false}>{labels && <LabelList dataKey={s.key} position="top" />}</Line>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Donut with its total set in HTML over the centre, so type stays on the scale. */
export function Donut({ data, total, href, dark = true, unit = 'projects' }: { data: { name: string; value: number; color: string }[]; total: number; href?: (name: string) => string; dark?: boolean; unit?: string }) {
  const r = 70, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={`${total} ${unit}: ${data.map((d) => `${d.value} ${d.name}`).join(', ')}`}>
          <circle cx="90" cy="90" r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.12)' : C.line} strokeWidth="20" />
          {data.map((d) => {
            const len = total ? (d.value / total) * c : 0;
            const el = d.value ? <circle key={d.name} cx="90" cy="90" r={r} fill="none" stroke={d.color} strokeWidth="20" strokeDasharray={`${Math.max(len - 3, 0)} ${c}`} strokeDashoffset={-off} transform="rotate(-90 90 90)" /> : null;
            off += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" aria-hidden>
          <span className="numeral-sm">{total}</span><span className="caption">{unit}</span>
        </div>
      </div>
      <ul className="small m-0 w-full list-none p-0">
        {data.map((d) => {
          const inner = <><span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} /><span className="flex-1">{d.name}</span><span className="w5 tabular">{d.value}</span></>;
          return <li key={d.name}>{href ? <Link href={href(d.name)} className="flex h-9 items-center gap-2 rounded-full px-2 hover:underline">{inner}</Link> : <div className="flex h-9 items-center gap-2 px-2">{inner}</div>}</li>;
        })}
      </ul>
    </div>
  );
}

/** Completion ring: actual arc with a plan tick; figures sit in HTML at the centre. */
export function Ring({ actual, plan, size = 180 }: { actual: number; plan: number; size?: number }) {
  const s = 14, r = size / 2 - s, c = 2 * Math.PI * r, mid = size / 2;
  const a = (plan / 100) * 2 * Math.PI - Math.PI / 2;
  const tick = [[mid + (r - s) * Math.cos(a), mid + (r - s) * Math.sin(a)], [mid + (r + s) * Math.cos(a), mid + (r + s) * Math.sin(a)]];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Overall completion ${actual}% against a plan of ${plan}%`}>
        <circle cx={mid} cy={mid} r={r} fill="none" stroke={C.line} strokeWidth={s} />
        <circle cx={mid} cy={mid} r={r} fill="none" stroke={C.ink} strokeWidth={s} strokeLinecap="round" strokeDasharray={`${(actual / 100) * c} ${c}`} transform={`rotate(-90 ${mid} ${mid})`} />
        <line x1={tick[0][0]} y1={tick[0][1]} x2={tick[1][0]} y2={tick[1][1]} stroke={C.yellow} strokeWidth="4" strokeLinecap="round" />
        <line x1={tick[0][0]} y1={tick[0][1]} x2={tick[1][0]} y2={tick[1][1]} stroke={C.ink} strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" aria-hidden>
        <span className="fig"><span className="numeral-sm">{actual}</span><span className="unit">%</span></span>
        <span className="caption">plan {plan}%</span>
      </div>
    </div>
  );
}
