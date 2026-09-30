'use client';
import { useScoped } from '@/lib/store';
import { monthInRange, productivity, toGranularity } from '@/lib/metrics';
import { num } from '@/lib/format';
import { RANGES } from '@/lib/metrics';
import { Bars, C, Trend } from '@/components/charts';
import { EmptyState, FilterCluster, HeaderFilters, KpiCard, StripeBar, Tile, toneFor, useUrlParams } from '@/components/ui';

export default function Contractors() {
  const { filters, setFilters, hasDetail, active, contractors } = useScoped();
  const { monthly, manpower, vendors, quantities } = contractors;
  const url = useUrlParams({ contractor: vendors[0]?.name ?? '' });
  const vendor = vendors.find((v) => v.name === url.values.contractor) ?? vendors[0];
  const share = vendor?.share ?? 1;
  const scale = (n: number) => Math.round(n * share);

  const months = toGranularity(monthly.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const men = toGranularity(manpower.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const prod = manpower.filter((m) => monthInRange(m.ym, filters.range)).map((m) => ({ label: m.label, Productivity: m.productivity }));
  const progress = quantities.slice(0, 2).map((d) => ({ name: d.name, Scope: scale(d.scope), 'Cum plan': scale(d.cumPlan), 'Cum actual': scale(d.cumActual) }));
  const subs = vendors.slice(1);
  const manTotals = { plan: manpower.reduce((s, m) => s + m.plan, 0), actual: manpower.reduce((s, m) => s + m.actual, 0) };
  const none = <EmptyState title="No months fall in this period. Choose All dates in the Period filter." action={{ label: 'Show all dates', onClick: () => setFilters({ range: 'all' }) }} />;
  const PA = [{ key: 'Plan', name: 'Plan', color: C.tint }, { key: 'Actual', name: 'Actual', color: C.ink }];

  if (!hasDetail) return <EmptyState title={`No contractor data is loaded for ${active.name}. Select Belgaum expansion to compare contractors.`} />;
  return (
    <>
      <HeaderFilters>
        <FilterCluster onClear={() => { url.clear(); setFilters({ range: 'all' }); }} filters={[
          { key: 'contractor', label: 'Contractor', value: vendor.name, def: vendors[0].name, onChange: (v) => url.set('contractor', v), options: vendors.map((v) => ({ v: v.name, l: v.name })) },
          { key: 'period', label: 'Period', value: filters.range, def: 'all', onChange: (v) => setFilters({ range: v }), options: RANGES.map((r) => ({ v: r.id, l: r.label })) },
        ]} />
      </HeaderFilters>
      <div className="kpi-grid c4">
        <KpiCard label="Actual quantity" value={num(vendor.actual)} rail="neutral" context={`${Math.round((vendor.actual / vendor.plan) * 100)}% of plan`} />
        <KpiCard label="Plan quantity" value={num(vendor.plan)} rail="neutral" context={vendor.name} />
        <KpiCard label="Man-days" value={num(vendor.manDays)} rail="neutral" context="Actual man-days booked" />
        <KpiCard label="Productivity" value={num(productivity(vendor.actual, vendor.manDays), 2)} unit="per man-day" rail="caution" context="Quantity divided by man-days" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tile surface title="Execution progress: scope, cumulative plan and actual">
          <Bars label="Scope, cumulative plan and cumulative actual" xKey="name" height={260} labels data={progress} series={[{ key: 'Scope', name: 'Scope', color: C.tint }, { key: 'Cum plan', name: 'Cum plan', color: C.steel }, { key: 'Cum actual', name: 'Cum actual', color: C.ink }]} />
        </Tile>
        <Tile surface title={`Month-wise quantity: plan and actual (${filters.gran.toLowerCase()})`}>
          {months.length ? <Bars label="Plan and actual quantity by month" xKey="label" height={260} labels data={months} series={PA} /> : none}
        </Tile>
        <Tile surface title="Manpower: plan and actual">
          {men.length ? <Bars label="Manpower plan and actual by month" xKey="label" height={260} labels data={men} series={PA} /> : none}
        </Tile>
        <Tile surface title="Productivity: quantity per man-day">
          {prod.length ? <Trend label="Productivity per man-day by month" xKey="label" height={260} labels data={prod} series={[{ key: 'Productivity', name: 'Qty per man-day', color: C.ink }]} /> : none}
        </Tile>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Tile surface title="Vendor comparison: quantity">
          <Bars label="Plan and actual quantity by vendor" xKey="name" horizontal height={300} labels data={subs.map((v) => ({ name: v.name.replace(' (sub-contractor)', ' (sub)'), Plan: v.plan, Actual: v.actual }))} series={PA} />
        </Tile>
        <Tile surface title="Vendor comparison: manpower">
          <Bars label="Plan and actual manpower by vendor" xKey="name" horizontal height={300} labels data={subs.map((v) => ({ name: v.name.replace(' (sub-contractor)', ' (sub)'), Plan: Math.round(manTotals.plan * v.share), Actual: Math.round(manTotals.actual * v.share) }))} series={PA} />
        </Tile>
      </div>
      <Tile title="Vendor progress against plan">
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {vendors.map((v) => (
            <li key={v.name} className="tile-white grid items-center gap-3 !p-4 md:grid-cols-[minmax(0,2fr)_3fr_auto]">
              <span className="text-sm font-medium">{v.name}</span>
              <StripeBar label={`${v.name} actual against plan`} value={(v.actual / v.plan) * 100} plan={100} color={toneFor(v.actual, v.plan * 0.85)} />
              <span className="text-sm label">{num(v.actual)} of {num(v.plan)} planned, {num(productivity(v.actual, v.manDays), 2)} per man-day</span>
            </li>
          ))}
        </ul>
      </Tile>
    </>
  );
}
