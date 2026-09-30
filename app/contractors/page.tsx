'use client';
import { useState } from 'react';
import { CONTRACTOR_MONTHLY, DISCIPLINE_QTY, MANPOWER, VENDORS } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { fmtNum, monthInRange, productivity, toGranularity } from '@/lib/metrics';
import { Bars, C, Trend } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState, PageHeader, Tile, inputCls } from '@/components/ui';

export default function Contractors() {
  const { filters, hasDetail, active } = useScoped();
  const [vendor, setVendor] = useState(VENDORS[0].name);
  const share = VENDORS.find((v) => v.name === vendor)?.share ?? 1;
  const scale = (n: number) => Math.round(n * share);

  const monthly = toGranularity(CONTRACTOR_MONTHLY.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const men = toGranularity(MANPOWER.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const prod = MANPOWER.filter((m) => monthInRange(m.ym, filters.range)).map((m) => ({ label: m.label, Productivity: m.productivity }));
  const progress = DISCIPLINE_QTY.slice(0, 2).map((d) => ({ name: d.name, Scope: scale(d.scope), 'Cum plan': scale(d.cumPlan), 'Cum actual': scale(d.cumActual) }));

  const cols: Column<(typeof VENDORS)[number]>[] = [
    { key: 'n', label: 'Contractor', sortValue: (v) => v.name, render: (v) => <span className="font-semibold">{v.name}</span> },
    { key: 'p', label: 'Plan qty', num: true, sortValue: (v) => v.plan, render: (v) => fmtNum(v.plan) },
    { key: 'a', label: 'Actual qty', num: true, sortValue: (v) => v.actual, render: (v) => fmtNum(v.actual) },
    { key: 'm', label: 'Man-days', num: true, sortValue: (v) => v.manDays, render: (v) => fmtNum(v.manDays) },
    { key: 'pr', label: 'Qty per man-day', num: true, sortValue: (v) => productivity(v.actual, v.manDays), render: (v) => fmtNum(productivity(v.actual, v.manDays), 2) },
  ];

  return (
    <>
      <PageHeader title="Contractors" lede="Execution progress, manpower and productivity by contractor.">
        <label className="flex items-center gap-2 text-sm font-medium">Contractor
          <select value={vendor} onChange={(e) => setVendor(e.target.value)} className={`${inputCls} w-auto`}>{VENDORS.map((v) => <option key={v.name}>{v.name}</option>)}</select>
        </label>
      </PageHeader>
      {!hasDetail ? <EmptyState title={`No contractor data for ${active.name}`} hint="Select Belgaum expansion in the project list to compare contractors." /> : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Tile title="Execution progress: scope, cumulative plan and actual">
            <Bars label="Scope, cumulative plan and cumulative actual" xKey="name" height={240} data={progress} highlight="none"
              series={[{ key: 'Scope', name: 'Scope', color: C.tint }, { key: 'Cum plan', name: 'Cum plan', color: C.graphite }, { key: 'Cum actual', name: 'Cum actual', color: C.ink }]} />
          </Tile>
          <Tile title={`Month-wise quantity: plan and actual (${filters.gran.toLowerCase()})`}>
            {monthly.length ? <Bars label="Plan and actual quantity" xKey="label" height={240} data={monthly} series={[{ key: 'Plan', name: 'Plan', color: C.tint }, { key: 'Actual', name: 'Actual', color: C.ink }]} /> : <EmptyState title="No months in this date range" hint="Choose All dates or Apr to Aug 2025." />}
          </Tile>
          <Tile title="Manpower: plan and actual">
            {men.length ? <Bars label="Manpower plan and actual" xKey="label" height={240} data={men} series={[{ key: 'Plan', name: 'Plan', color: C.tint }, { key: 'Actual', name: 'Actual', color: C.ink }]} /> : <EmptyState title="No months in this date range" hint="Choose All dates or Apr to Aug 2025." />}
          </Tile>
          <Tile title="Productivity: quantity per man-day">
            {prod.length ? <Trend label="Productivity per man-day" xKey="label" height={240} data={prod} series={[{ key: 'Productivity', name: 'Qty per man-day', color: C.ink }]} /> : <EmptyState title="No months in this date range" hint="Choose All dates or Apr to Aug 2025." />}
          </Tile>
          <section className="lg:col-span-2" aria-label="Vendor comparison">
            <h2 className="mb-3 text-lg font-semibold">Vendor comparison</h2>
            <DataTable cols={cols} rows={VENDORS} rowKey={(v) => v.name} caption="Vendor comparison" maxH="max-h-[360px]" rowClass={(v) => (v.name === vendor ? 'bg-mist' : undefined)} />
          </section>
        </div>
      )}
    </>
  );
}
