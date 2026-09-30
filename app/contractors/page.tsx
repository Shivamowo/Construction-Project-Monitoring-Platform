'use client';
import { useState } from 'react';
import { CONTRACTOR_MONTHLY, DISCIPLINE_QTY, MANPOWER, VENDORS } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { fmtNum, monthInRange, productivity, toGranularity } from '@/lib/metrics';
import { Bars, C, Trend } from '@/components/charts';
import { EmptyState, FilterBar, PillSelect, StripeBar, Tile, toneFor } from '@/components/ui';

export default function Contractors() {
  const { filters, hasDetail, active } = useScoped();
  const [vendor, setVendor] = useState(VENDORS[0].name);
  const share = VENDORS.find((v) => v.name === vendor)?.share ?? 1;
  const scale = (n: number) => Math.round(n * share);

  const monthly = toGranularity(CONTRACTOR_MONTHLY.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const men = toGranularity(MANPOWER.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const prod = MANPOWER.filter((m) => monthInRange(m.ym, filters.range)).map((m) => ({ label: m.label, Productivity: m.productivity }));
  const progress = DISCIPLINE_QTY.slice(0, 2).map((d) => ({ name: d.name, Scope: scale(d.scope), 'Cum plan': scale(d.cumPlan), 'Cum actual': scale(d.cumActual) }));
  const none = <EmptyState title="No months fall in this date range. Choose All dates in the filters." />;
  const PA = [{ key: 'Plan', name: 'Plan', color: C.tint }, { key: 'Actual', name: 'Actual', color: C.ink }];

  if (!hasDetail) return <EmptyState title={`No contractor data is loaded for ${active.name}. Select Belgaum expansion to compare contractors.`} />;
  return (
    <div className="flex flex-col gap-4">
      <FilterBar active={vendor !== VENDORS[0].name ? 1 : 0}>
        <PillSelect label="Contractor or sub-contractor" value={vendor} onChange={setVendor} options={VENDORS.map((v) => ({ v: v.name, l: v.name }))} />
      </FilterBar>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tile surface title="Execution progress: scope, cumulative plan and actual">
          <Bars label="Scope, cumulative plan and cumulative actual" xKey="name" height={240} data={progress} series={[{ key: 'Scope', name: 'Scope', color: C.tint }, { key: 'Cum plan', name: 'Cum plan', color: C.steel }, { key: 'Cum actual', name: 'Cum actual', color: C.ink }]} />
        </Tile>
        <Tile surface title={`Month-wise quantity: plan and actual (${filters.gran.toLowerCase()})`}>
          {monthly.length ? <Bars label="Plan and actual quantity" xKey="label" height={240} data={monthly} series={PA} highlight={undefined} /> : none}
        </Tile>
        <Tile surface title="Manpower: plan and actual">
          {men.length ? <Bars label="Manpower plan and actual" xKey="label" height={240} data={men} series={PA} /> : none}
        </Tile>
        <Tile surface title="Productivity: quantity per man-day">
          {prod.length ? <Trend label="Productivity per man-day" xKey="label" height={240} data={prod} series={[{ key: 'Productivity', name: 'Qty per man-day', color: C.ink }]} /> : none}
        </Tile>
      </div>
      <Tile title="Vendor comparison">
        <ul className="flex flex-col gap-2">
          {VENDORS.map((v) => (
            <li key={v.name} className="grid items-center gap-3 rounded-lg bg-surface p-4 md:grid-cols-[minmax(0,2fr)_3fr_auto]">
              <span className="text-sm font-medium">{v.name}</span>
              <span><StripeBar label={`${v.name} actual against plan`} value={(v.actual / v.plan) * 100} plan={100} color={toneFor(v.actual, v.plan * 0.85)} /></span>
              <span className="text-sm text-sub">{fmtNum(v.actual)} of {fmtNum(v.plan)} planned, {fmtNum(productivity(v.actual, v.manDays), 2)} per man-day</span>
            </li>
          ))}
        </ul>
      </Tile>
    </div>
  );
}
