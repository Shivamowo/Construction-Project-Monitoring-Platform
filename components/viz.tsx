'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { REPORT_DATE } from '@/lib/brand';
import { varianceDays } from '@/lib/metrics';
import { dateLong, num } from '@/lib/format';
import { HEALTH_COLS, type HealthCell } from '@/lib/health';
import type { Project } from '@/lib/types';
import { ChartLegend } from './ChartLegend';
import { VarianceChip } from './ui';

const t = (d: string) => Date.parse(`${d}T00:00:00Z`);
const pct = (v: number, max: number) => (max ? (v / max) * 100 : 0);

/** Gantt-style portfolio timeline: baseline outline, forecast extension, report date. Reveals once on load. */
export function PortfolioTimeline({ projects, selected, onSelect }: { projects: Project[]; selected: string; onSelect: (id: string) => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const id = setTimeout(() => setShown(true), 40); return () => clearTimeout(id); }, []);
  const rows = [...projects].sort((a, b) => varianceDays(b.baselineFinish, b.forecastFinish) - varianceDays(a.baselineFinish, a.forecastFinish));
  const min = Math.min(...rows.map((p) => t(p.start)));
  const max = Math.max(...rows.map((p) => Math.max(t(p.forecastFinish), t(p.baselineFinish))));
  const x = (d: string) => ((t(d) - min) / (max - min)) * 100;
  const years: number[] = [];
  for (let y = new Date(min).getUTCFullYear() + 1; Date.UTC(y, 0, 1) < max; y++) years.push(y);
  const late = rows.filter((p) => varianceDays(p.baselineFinish, p.forecastFinish) > 0);
  const summary = `${late.length} of ${rows.length} projects forecast to finish after baseline.${late[0] ? ` Largest slip: ${late[0].name}, ${varianceDays(late[0].baselineFinish, late[0].forecastFinish)} days.` : ''}`;
  return (
    <div className={clsx('tl', !shown && 'tl-hidden')} role="group" aria-label={`Portfolio timeline. ${summary}`}>
      <ChartLegend items={[{ label: 'Start to baseline finish', color: 'rgba(255,255,255,.4)' }, { label: 'Forecast later than baseline', color: 'var(--yellow)' }, { label: 'Forecast earlier than baseline', color: 'var(--green-d)' }]} />
      <div className="tl-axis caption" aria-hidden>
        <span>Project</span>
        <div className="tl-ticks">
          {years.map((y) => <span key={y} className="tabular" style={{ left: `${x(`${y}-01-01`)}%` }}>{y}</span>)}
        </div>
        <span className="text-right">Variance</span>
      </div>
      <div className="tl-axis" aria-hidden style={{ height: 24 }}>
        <span />
        <div className="tl-track"><span className="tl-now" style={{ left: `${x(REPORT_DATE)}%`, top: 2 }}><span className="caption w5" style={{ color: 'var(--text)' }}>Report date</span></span></div>
        <span />
      </div>
      {rows.map((p) => {
        const v = varianceDays(p.baselineFinish, p.forecastFinish);
        const late = t(p.forecastFinish) > t(p.baselineFinish);
        return (
          <div key={p.id} className="tl-row">
            <button type="button" onClick={() => onSelect(p.id)} aria-pressed={p.id === selected} className={clsx('tl-name small text-left', p.id === selected && 'w6')} title={p.name}>{p.name}</button>
            <div className="tl-track">
              <span className="tl-now" style={{ left: `${x(REPORT_DATE)}%` }} aria-hidden />
              <div className="tl-bars" aria-hidden>
                <span className="tl-base" style={{ left: `${x(p.start)}%`, width: `${x(p.baselineFinish) - x(p.start)}%` }} />
                {v !== 0 && (
                  <span className="tl-ext" style={{ left: `${x(late ? p.baselineFinish : p.forecastFinish)}%`, width: `max(10px, ${Math.abs(x(p.forecastFinish) - x(p.baselineFinish))}%)`, background: late ? 'var(--yellow)' : 'var(--green-d)' }} />
                )}
              </div>
            </div>
            <span className={clsx('small tabular text-right', v > 0 ? 't-bad' : v < 0 ? 't-good' : 'muted')} aria-label={`${p.name}: ${v > 0 ? `${v} days late` : v < 0 ? `${-v} days early` : 'on baseline'}`}>{v > 0 ? `+${v}` : v} d</span>
          </div>
        );
      })}
    </div>
  );
}

/** Projects by six health dimensions, one tonal square per cell with the value on hover or focus. */
export function HealthMatrix({ rows, onSelect }: { rows: { project: Project; cells: HealthCell[] }[]; onSelect: (id: string) => void }) {
  const bad = rows.filter((r) => r.cells.filter((c) => c.tone === 'bad').length >= 3);
  return (
    <div>
      <ChartLegend items={[{ label: 'On target', color: 'rgba(22,135,54,.35)' }, { label: 'Watch', color: 'rgba(224,138,30,.4)' }, { label: 'Off target', color: 'rgba(185,37,28,.35)' }, { label: 'Not started', color: 'var(--tile)' }]} />
      <div className="table-wrap">
        <div className="hm" role="table" aria-label={`Health matrix. ${bad.length} projects are off target on three or more dimensions.`}>
          <div role="row" className="contents">
            <span role="columnheader" className="caption">Project</span>
            {HEALTH_COLS.map((c) => <span key={c} role="columnheader" className="caption">{c}</span>)}
          </div>
          {rows.map(({ project: p, cells }) => (
            <div key={p.id} role="row" className="contents">
              <span role="rowheader" className="min-w-0"><Link href="/scorecard" onClick={() => onSelect(p.id)} className="small block truncate hover:underline">{p.name}</Link></span>
              {cells.map((c) => (
                <span key={c.key} role="cell">
                  <span tabIndex={0} className={clsx('hm-cell has-tip block', `hm-${c.tone}`)} aria-label={`${p.name}, ${c.label}: ${c.value}`}>
                    <span className="tip" role="tooltip">{c.value}</span>
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Bullet bar: actual fill, plan tick, target zone within 10% of plan. */
export function BulletBar({ label, actual, plan, detail }: { label: string; actual: number; plan: number; detail: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="small w5">{label}</span>
        <span className="small tabular">{plan ? `${actual.toFixed(1)}% of scope, plan ${plan.toFixed(1)}%` : 'Not started'}</span>
      </div>
      <div className="bullet" role="img" aria-label={`${label}: actual ${actual.toFixed(1)} percent of scope against plan ${plan.toFixed(1)} percent`}>
        {plan > 0 && <span className="zone" style={{ left: `${plan * 0.9}%`, width: `${plan * 0.1}%` }} />}
        <span className="fill" style={{ width: `${Math.min(actual, 100)}%` }} />
        {plan > 0 && <span className="tick" style={{ left: `calc(${plan}% - 1px)` }} />}
      </div>
      <span className="caption">{detail}</span>
    </div>
  );
}

/** Waterfall from baseline finish through each cause to forecast finish. */
export function DelayBridge({ baseline, forecast, causes }: { baseline: string; forecast: string; causes: { label: string; days: number; id: string }[] }) {
  const total = causes.reduce((s, c) => s + c.days, 0);
  const variance = varianceDays(baseline, forecast);
  const max = Math.max(total, variance, 1) * 1.15;
  let cum = 0;
  const cols = [
    { key: 'b', label: `Baseline ${dateLong(baseline)}`, bottom: 0, h: 0, val: '0', color: 'var(--text)' },
    ...causes.map((c) => { const col = { key: c.id, label: c.label, bottom: cum, h: c.days, val: `+${c.days}`, color: 'var(--amber-mark)' }; cum += c.days; return col; }),
    { key: 'f', label: `Forecast ${dateLong(forecast)}`, bottom: 0, h: total, val: `${total}`, color: 'var(--text)' },
  ];
  return (
    <div>
      <ChartLegend items={[{ label: 'Days added by cause', color: 'var(--amber-mark)' }, { label: 'Baseline and forecast', color: 'var(--text)' }]} />
      <div className="table-wrap">
        <div className="wf" style={{ minWidth: 520 }} role="img" aria-label={`Delay bridge: ${causes.map((c) => `${c.label} ${c.days} days`).join(', ')}. Total ${total} days from baseline ${dateLong(baseline)} to forecast ${dateLong(forecast)}.`}>
          {cols.map((c) => (
            <div key={c.key} className="wf-col">
              <div className="relative flex-1">
                <span className="wf-bar" style={{ bottom: `${pct(c.bottom, max)}%`, height: c.h ? `${pct(c.h, max)}%` : 2, background: c.color }} />
                <span className="wf-val small w5 tabular" style={{ bottom: `calc(${pct(c.bottom + c.h, max)}% + 4px)` }}>{c.val}</span>
              </div>
              <span className="wf-lab caption">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
      {total !== variance && <p className="caption mt-2">Causes add up to {total} days; the schedule shows {variance}. Tag the remaining delays in the register.</p>}
    </div>
  );
}

/** Connected stage segments with a count and a red past-due portion. */
export function StagePipeline({ stages }: { stages: { name: string; count: number; pastDue: number; note?: string }[] }) {
  return (
    <div>
      <ChartLegend items={[{ label: 'Past due', color: 'var(--red)' }, { label: 'On time', color: 'var(--steel)' }]} />
      <ol className="pipe m-0 list-none p-0" aria-label={`PO pipeline: ${stages.map((s) => `${s.name} ${s.count}, ${s.pastDue} past due`).join('; ')}`}>
        {stages.map((s) => (
          <li key={s.name} className="pipe-seg">
            <span className="label">{s.name}</span>
            <span className="numeral-sm">{num(s.count)}</span>
            <div className="pipe-bar" aria-hidden>
              <span style={{ width: `${pct(s.pastDue, s.count)}%`, background: 'var(--red)' }} />
              <span style={{ width: `${pct(s.count - s.pastDue, s.count)}%`, background: 'var(--steel)' }} />
            </div>
            <span className={clsx('caption', s.pastDue > 0 && 't-bad')}>{s.pastDue ? `${s.pastDue} past due` : 'None past due'}{s.note ? `, ${s.note}` : ''}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Weekly heat strip of upcoming counts. */
export function HeatStrip({ weeks }: { weeks: { label: string; count: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.count), 1);
  return (
    <div className="heat" role="img" aria-label={`Release targets by week: ${weeks.map((w) => `${w.label} ${w.count}`).join(', ')}`}>
      {weeks.map((w) => {
        const k = w.count / max;
        return (
          <div key={w.label} className="flex min-w-0 flex-col gap-1">
            <span className="heat-cell" style={{ background: w.count ? `rgba(79,93,112,${0.14 + 0.86 * k})` : 'var(--canvas)', color: k > 0.45 ? '#fff' : 'var(--text)' }}>{w.count}</span>
            <span className="caption truncate tabular">{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Diverging bars: behind plan extends left in amber, ahead extends right in green. */
export function DivergingBars({ rows }: { rows: { label: string; plan: number; received: number }[] }) {
  const sorted = [...rows].sort((a, b) => (b.plan - b.received) - (a.plan - a.received));
  const max = Math.max(...sorted.map((r) => Math.abs(r.plan - r.received)), 1);
  return (
    <div>
      <div className="div-row caption" aria-hidden style={{ height: 24 }}><span /><span className="flex justify-between"><span>Behind plan</span><span>Ahead of plan</span></span><span /></div>
      <div role="img" aria-label={`Drawing variance by building: ${sorted.map((r) => `${r.label} ${r.plan - r.received > 0 ? `${num(r.plan - r.received)} behind` : `${num(r.received - r.plan)} ahead`}`).join(', ')}`}>
        {sorted.map((r) => {
          const v = r.plan - r.received, w = (Math.abs(v) / max) * 50;
          return (
            <div key={r.label} className="div-row">
              <span className="small truncate" title={r.label}>{r.label}</span>
              <span className="div-track" aria-hidden>
                <span className="div-bar" style={v > 0 ? { right: '50%', width: `${w}%`, background: 'var(--amber-mark)', borderRadius: '6px 0 0 6px' } : { left: '50%', width: `${w}%`, background: 'var(--green)', borderRadius: '0 6px 6px 0' }} />
              </span>
              <span className="flex justify-end"><VarianceChip plan={r.plan} received={r.received} /></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Month calendar, each day shaded by total shortfall. */
export function ShortfallCalendar({ days, unit }: { days: { date: string; day: number; weekday: number; total: number }[]; unit: string }) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const lead = days[0]?.weekday ?? 0;
  const worst = [...days].sort((a, b) => b.total - a.total)[0];
  return (
    <div>
      <ChartLegend items={[{ label: 'Low shortfall', color: 'rgba(224,138,30,.15)' }, { label: 'High shortfall', color: 'rgba(224,138,30,.9)' }]} />
      <div className="cal" role="img" aria-label={`Shortfall calendar for the month. Worst day ${worst ? `${dateLong(worst.date)} with ${num(worst.total)} ${unit}` : 'none'}.`}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className="caption">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={`l${i}`} />)}
        {days.map((d) => {
          const k = d.total / max;
          return (
            <span key={d.date} className="cal-cell" title={`${dateLong(d.date)}: ${num(d.total)} ${unit} short`} style={{ background: d.total ? `rgba(224,138,30,${0.12 + 0.78 * k})` : 'var(--canvas)' }}>
              <span className="caption ink">{d.day}</span>
              <span className="caption ink text-right tabular">{d.total ? num(d.total) : ''}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Count grid, rows by rating and columns by category. */
export function HeatGrid({ rows, cols, count, tone, href }: { rows: string[]; cols: string[]; count: (r: string, c: string) => number; tone: (r: string) => string; href: (r: string, c: string) => string }) {
  const max = Math.max(...rows.flatMap((r) => cols.map((c) => count(r, c))), 1);
  return (
    <div className="table-wrap">
      <div className="grid3" style={{ minWidth: 360 }} role="table" aria-label={`Open risks by rating and category: ${rows.map((r) => `${r} ${cols.map((c) => `${c} ${count(r, c)}`).join(', ')}`).join('; ')}`}>
        <span role="columnheader" />
        {cols.map((c) => <span key={c} role="columnheader" className="caption truncate" title={c}>{c}</span>)}
        <span role="columnheader" className="caption text-right">Total</span>
        {rows.map((r) => (
          <div key={r} role="row" className="contents">
            <span role="rowheader" className="small w5">{r}</span>
            {cols.map((c) => {
              const n = count(r, c), k = n / max;
              return (
                <Link key={c} role="cell" href={href(r, c)} className="g" aria-label={`${r}, ${c}: ${n}`}
                  style={{ background: n ? `color-mix(in srgb, ${tone(r)} ${Math.round(14 + 60 * k)}%, white)` : 'var(--canvas)', color: k > 0.6 ? '#fff' : 'var(--text)' }}>{n}</Link>
              );
            })}
            <span className="small w5 tabular text-right">{cols.reduce((s, c) => s + count(r, c), 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked horizontal bars comparing owners. */
export function WorkloadBar({ rows, parts }: { rows: { label: string; values: number[]; unit: string }[]; parts: { label: string; color: string }[] }) {
  return (
    <div>
      <ChartLegend items={parts.map((p) => ({ label: p.label, color: p.color }))} />
      <div className="stack">
        {rows.map((r) => {
          const total = r.values.reduce((a, b) => a + b, 0);
          return (
            <div key={r.label} className="flex flex-col gap-2">
              <div className="flex justify-between"><span className="small w5">{r.label}</span><span className="small tabular">{num(total)} {r.unit}</span></div>
              <div className="stackbar" role="img" aria-label={`${r.label}: ${parts.map((p, i) => `${p.label} ${r.values[i]}`).join(', ')}`}>
                {r.values.map((v, i) => v > 0 && <span key={i} className="tabular" style={{ width: `${pct(v, total)}%`, background: parts[i].color, color: i === 2 ? 'var(--text)' : '#fff' }}>{v}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
