'use client';
import Link from 'next/link';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNum } from '@/lib/metrics';

export const C = { ink: '#2E2E38', graphite: '#747480', tint: '#C9C9D1', yellow: '#FFE600', line: '#E1E1E6', good: '#168736', warn: '#FF9831', bad: '#B9251C', info: '#188CE5' };
const tick = { fill: C.graphite, fontSize: 12 };
const tip = { contentStyle: { border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: 'none', fontSize: 12 }, cursor: { fill: '#F6F6FA' } };

export interface Series { key: string; name: string; color: string }

/** Bar chart; `highlight` colours one x category yellow on the first series. */
export function Bars({ data, xKey, series, height = 200, highlight, label, horizontal, unit = '' }: {
  data: Record<string, string | number | null>[]; xKey: string; series: Series[]; height?: number; highlight?: string; label: string; horizontal?: boolean; unit?: string;
}) {
  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: horizontal ? 8 : -8, bottom: 0 }}>
          <CartesianGrid stroke={C.line} vertical={!!horizontal} horizontal={!horizontal} />
          {horizontal ? <><XAxis type="number" tick={tick} tickLine={false} axisLine={false} /><YAxis type="category" dataKey={xKey} tick={tick} tickLine={false} axisLine={false} width={110} /></> :
            <><XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: C.line }} interval={0} /><YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v)} /></>}
          <Tooltip {...tip} formatter={(v) => `${fmtNum(Number(v))}${unit}`} />
          {series.length > 1 && <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s, si) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={36}>
              {highlight && si === 0 && data.map((d, i) => <Cell key={i} fill={d[xKey] === highlight ? C.yellow : s.color} stroke={d[xKey] === highlight ? C.ink : undefined} />)}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Trend({ data, xKey, series, height = 200, label }: { data: Record<string, string | number | null>[]; xKey: string; series: Series[]; height?: number; label: string }) {
  return (
    <div role="img" aria-label={label} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={C.line} vertical={false} />
          <XAxis dataKey={xKey} tick={tick} tickLine={false} axisLine={{ stroke: C.line }} />
          <YAxis tick={tick} tickLine={false} axisLine={false} />
          <Tooltip {...tip} />
          {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, total, href }: { data: { name: string; value: number; color: string }[]; total: number; href?: (name: string) => string }) {
  const r = 52, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label={`Projects by status: ${data.map((d) => `${d.value} ${d.name}`).join(', ')}`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke={C.line} strokeWidth="16" />
        {data.map((d) => {
          const len = total ? (d.value / total) * c : 0;
          const el = d.value ? <circle key={d.name} cx="70" cy="70" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" /> : null;
          off += len;
          return el;
        })}
        <text x="70" y="72" textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 34, fontWeight: 600 }}>{total}</text>
        <text x="70" y="90" textAnchor="middle" fill={C.graphite} style={{ fontSize: 11 }}>projects</text>
      </svg>
      <ul className="w-full text-sm">
        {data.map((d) => {
          const inner = <><span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ background: d.color }} /><span className="flex-1">{d.name}</span><span className="font-semibold">{d.value}</span></>;
          return <li key={d.name}>{href ? <Link href={href(d.name)} className="flex items-center gap-2 rounded px-1 py-1.5 hover:bg-mist">{inner}</Link> : <div className="flex items-center gap-2 py-1.5">{inner}</div>}</li>;
        })}
      </ul>
    </div>
  );
}

export function Gauge({ pct, name, rows }: { pct: number; name: string; rows: [string, string][] }) {
  const p = Math.min(Math.max(pct, 0), 100), r = 50, len = Math.PI * r;
  const color = p >= 60 ? C.good : p >= 30 ? C.warn : p > 0 ? C.bad : C.graphite;
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-sm font-semibold">{name}</h3>
      <svg viewBox="0 0 120 70" className="mx-auto mt-1 w-full max-w-[180px]" role="img" aria-label={`${name} drawings received: ${Math.round(p)} percent`}>
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={C.line} strokeWidth="10" strokeLinecap="butt" />
        {p > 0 && <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${(p / 100) * len} ${len}`} />}
        <text x="60" y="58" textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 26, fontWeight: 600 }}>{Math.round(p)}%</text>
      </svg>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 text-sm">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-graphite">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
      </dl>
    </div>
  );
}
