'use client';
import { useEffect, useMemo, useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SCURVE } from '@/data/seed';
import { monthInRange, toGranularity } from '@/lib/metrics';
import { useStore } from '@/lib/store';
import { C } from './charts';
import { useReducedMotion } from './ui';

const DRAW_MS = 2400;

export function SCurve() {
  const { filters } = useStore();
  const reduced = useReducedMotion();
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), DRAW_MS + 400); return () => clearTimeout(t); }, []);

  const { rows, reportLabel, cumPlanAt, cumActual } = useMemo(() => {
    const base = SCURVE.filter((r) => monthInRange(r.ym, filters.range));
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
  }, [filters.range, filters.gran]);

  const animate = !reduced && !drawn;
  const anim = { isAnimationActive: animate, animationDuration: DRAW_MS, animationEasing: 'ease-in-out' as const };
  return (
    <div>
      <p className="mb-3 max-w-[60ch] text-sm text-graphite">
        At the report date, actual progress is {cumActual}% against a plan of {cumPlanAt}%. The yellow band shows the gap of {Math.round((cumPlanAt - cumActual) * 10) / 10} points.
      </p>
      <div role="img" aria-label={`S-curve. Cumulative plan ${cumPlanAt} percent, cumulative actual ${cumActual} percent at report date.`} className="h-[340px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 24, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.graphite, fontSize: 12 }} tickLine={false} axisLine={{ stroke: C.line }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis yAxisId="m" tick={{ fill: C.graphite, fontSize: 12 }} tickLine={false} axisLine={false} unit="%" domain={[0, 40]} hide />
            <YAxis yAxisId="c" orientation="right" tick={{ fill: C.graphite, fontSize: 12 }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
            <Tooltip contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: 'none', fontSize: 12 }} formatter={(v, n) => [`${v}%`, n]} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'gapBase' ? '' : v)} payload={[
              { value: 'Monthly plan', type: 'square', color: C.tint }, { value: 'Monthly actual', type: 'square', color: C.graphite },
              { value: 'Cumulative plan', type: 'plainline', color: C.ink }, { value: 'Cumulative actual', type: 'plainline', color: C.ink },
              { value: 'Gap to plan', type: 'square', color: C.yellow },
            ]} />
            <Area yAxisId="c" dataKey="gapBase" stackId="gap" stroke="none" fill="transparent" legendType="none" name="gapBase" {...anim} tooltipType="none" />
            <Area yAxisId="c" dataKey="gapSize" stackId="gap" stroke="none" fill={C.yellow} fillOpacity={0.9} name="Gap to plan" {...anim} tooltipType="none" />
            <Bar yAxisId="m" dataKey="plan" name="Monthly plan" fill={C.tint} isAnimationActive={false} maxBarSize={18} />
            <Bar yAxisId="m" dataKey="actual" name="Monthly actual" fill={C.graphite} isAnimationActive={false} maxBarSize={18} />
            <Line yAxisId="c" type="monotone" dataKey="cumPlan" name="Cumulative plan" stroke={C.ink} strokeWidth={2} strokeDasharray="6 4" dot={false} {...anim} />
            <Line yAxisId="c" type="monotone" dataKey="cumActual" name="Cumulative actual" stroke={C.ink} strokeWidth={3.5} dot={false} connectNulls={false} {...anim} />
            {reportLabel && <ReferenceLine yAxisId="c" x={reportLabel} stroke={C.ink} strokeWidth={1.5} label={{ value: 'Report date', position: 'top', fill: C.ink, fontSize: 12, fontWeight: 600 }} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
