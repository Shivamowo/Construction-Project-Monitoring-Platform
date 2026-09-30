'use client';
import { useEffect, useMemo, useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { monthInRange, toGranularity } from '@/lib/metrics';
import { useStore } from '@/lib/store';
import { ChartLegend } from './ChartLegend';
import { useReducedMotion } from './ui';

const DRAW_MS = 900;
const YEL = '#FFE600';

export function SCurve() {
  const { filters, schedule } = useStore();
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), DRAW_MS + 300); return () => clearTimeout(t); }, []);

  const { rows, reportLabel, cumPlanAt, cumActual } = useMemo(() => {
    const base = schedule.filter((r) => monthInRange(r.ym, filters.range));
    const all = toGranularity(base, filters.gran, ['plan', 'actual']);
    let cp = 0, ca = 0, last = '';
    const rows = all.map((r) => {
      cp += r.plan;
      const hasA = r.actual !== null;
      if (hasA) { ca += r.actual as number; last = r.label; }
      const cA = hasA ? Math.round(ca * 10) / 10 : null, cP = Math.round(cp * 10) / 10;
      return { label: r.label, plan: r.plan, actual: r.actual, cumPlan: cP, cumActual: cA, gapBase: cA === null ? null : Math.min(cP, cA), gapSize: cA === null ? null : Math.abs(cP - cA) };
    });
    const at = [...rows].reverse().find((r) => r.cumActual !== null);
    return { rows, reportLabel: last, cumPlanAt: at?.cumPlan ?? 0, cumActual: at?.cumActual ?? 0 };
  }, [filters.range, filters.gran, schedule]);

  const anim = { isAnimationActive: !reduced && !drawn, animationDuration: DRAW_MS, animationEasing: 'ease-out' as const };
  const tick = { fill: '#C9CDD8' };
  return (
    <div>
      <p className="small muted mb-4">
        At the report date, actual progress is {cumActual}% against a plan of {cumPlanAt}%. The yellow band is the gap of {Math.round((cumPlanAt - cumActual) * 10) / 10} points.
      </p>
      <ChartLegend items={[
        { label: 'Monthly plan', color: '#4B4B5A' }, { label: 'Monthly actual', color: '#747480' },
        { label: 'Cumulative plan', color: '#FFFFFF', line: true, dashed: true }, { label: 'Cumulative actual', color: YEL, line: true }, { label: 'Gap to plan', color: 'rgba(255,230,0,0.2)' },
      ]} />
      <div role="img" aria-label={`S-curve. Cumulative plan ${cumPlanAt} percent, cumulative actual ${cumActual} percent at report date.`} className="h-[340px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 32, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
            <YAxis yAxisId="m" hide domain={[0, 40]} />
            <YAxis yAxisId="c" orientation="right" width={44} tick={tick} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
            <Tooltip wrapperClassName="tabular" formatter={(v, n) => [`${v}%`, n]} />
            <Area yAxisId="c" dataKey="gapBase" stackId="gap" stroke="none" fill="transparent" name="Base" tooltipType="none" {...anim} />
            <Area yAxisId="c" dataKey="gapSize" stackId="gap" stroke="none" fill={YEL} fillOpacity={0.2} name="Gap to plan" tooltipType="none" {...anim} />
            <Bar yAxisId="m" dataKey="plan" name="Monthly plan" fill="#4B4B5A" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={18} />
            <Bar yAxisId="m" dataKey="actual" name="Monthly actual" fill="#747480" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={18} />
            <Line yAxisId="c" type="monotone" dataKey="cumPlan" name="Cumulative plan" stroke="#FFFFFF" strokeWidth={2} strokeDasharray="6 4" dot={false} {...anim} />
            <Line yAxisId="c" type="monotone" dataKey="cumActual" name="Cumulative actual" stroke={YEL} strokeWidth={4} dot={false} connectNulls={false} {...anim} />
            {reportLabel && <ReferenceLine yAxisId="c" x={reportLabel} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} label={({ viewBox }: { viewBox: { x: number; y: number } }) => (
              <g transform={`translate(${viewBox.x - 44},${viewBox.y - 26})`}><rect width="88" height="22" rx="11" fill={YEL} /><text x="44" y="15" textAnchor="middle" fill="#2E2E38" className="chart-chip">Report date</text></g>
            )} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
