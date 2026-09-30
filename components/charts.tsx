'use client';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNum } from '@/lib/metrics';
import { ChartLegend } from './ChartLegend';

export const C = { ink: '#2E2E38', muted: '#747480', steel: '#4F5D70', yellow: '#FFE600', line: '#D5D9E2', tint: '#9AA0AE', good: '#168736', warn: '#B86200', bad: '#B9251C', info: '#188CE5' };
const tick = { fill: '#565664', fontSize: 12 };
const tip = { contentStyle: { border: 'none', borderRadius: 12, boxShadow: 'none', fontSize: 12, background: '#2E2E38', color: '#fff' }, itemStyle: { color: '#fff' }, labelStyle: { color: '#C9CDD8' }, cursor: { fill: 'rgba(46,46,56,0.06)' } };

export interface Series { key: string; name: string; color: string }

/** Bar chart; `highlight` colours one x category yellow on the first series. */
export function Bars({ data, xKey, series, height = 200, highlight, label, horizontal, unit = '', labels }: {
  data: Record<string, string | number | null>[]; xKey: string; series: Series[]; height?: number; highlight?: string; label: string; horizontal?: boolean; unit?: string; labels?: boolean;
}) {
  return (
    <div>
      {series.length > 1 && <ChartLegend items={series.map((s) => ({ label: s.name, color: s.color }))} />}
      <div role="img" aria-label={label} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -12, bottom: 0 }}>
            {!horizontal && <CartesianGrid stroke={C.line} vertical={false} />}
            {horizontal && <XAxis type="number" tick={tick} tickLine={false} axisLine={false} />}
            {horizontal && <YAxis type="category" dataKey={xKey} tick={tick} tickLine={false} axisLine={false} width={120} />}
            {!horizontal && <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} interval={0} angle={data.length > 4 ? -30 : 0} textAnchor={data.length > 4 ? 'end' : 'middle'} height={data.length > 4 ? 52 : 30} />}
            {!horizontal && <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} />}
            <Tooltip {...tip} formatter={(v) => `${fmtNum(Number(v))}${unit}`} />
            {series.map((s, si) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} isAnimationActive={false} maxBarSize={32}>
                {highlight && si === 0 && data.map((d, i) => <Cell key={i} fill={d[xKey] === highlight ? C.yellow : s.color} />)}
                {labels && <LabelList dataKey={s.key} position={horizontal ? 'right' : 'top'} formatter={(v: unknown) => fmtNum(Number(v))} fill="#565664" fontSize={12} />}
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
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={false} />
            <YAxis tick={tick} tickLine={false} axisLine={false} />
            <Tooltip {...tip} />
            {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={{ r: 4, fill: s.color, strokeWidth: 0 }} isAnimationActive={false}>{labels && <LabelList dataKey={s.key} position="top" fill="#565664" fontSize={12} />}</Line>)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Donut({ data, total, href, dark = true, unit = 'projects' }: { data: { name: string; value: number; color: string }[]; total: number; href?: (name: string) => string; dark?: boolean; unit?: string }) {
  const r = 52, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 140 140" className="shrink-0" style={{ height: 220, width: 220 }} role="img" aria-label={`Projects by status: ${data.map((d) => `${d.value} ${d.name}`).join(', ')}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.12)' : '#D5D9E2'} strokeWidth="16" />
        {data.map((d) => {
          const len = total ? (d.value / total) * c : 0;
          const el = d.value ? <circle key={d.name} cx="70" cy="70" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 3, 0)} ${c}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" /> : null;
          off += len;
          return el;
        })}
        <text x="70" y="74" textAnchor="middle" fill={dark ? '#fff' : '#2E2E38'} className="font-display" style={{ fontSize: 40, fontWeight: 300 }}>{total}</text>
        <text x="70" y="92" textAnchor="middle" fill={dark ? '#C9CDD8' : '#5F5F6C'} style={{ fontSize: 11 }}>{unit}</text>
      </svg>
      <ul className="w-full text-sm">
        {data.map((d) => {
          const inner = <><span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} /><span className="flex-1">{d.name}</span><span className="font-medium">{d.value}</span></>;
          return <li key={d.name}>{href ? <Link href={href(d.name)} className="flex items-center gap-2 rounded-full px-2 py-1.5">{inner}</Link> : <div className="flex items-center gap-2 px-2 py-1.5">{inner}</div>}</li>;
        })}
      </ul>
    </div>
  );
}
