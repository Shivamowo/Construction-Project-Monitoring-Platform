'use client';
import { useScoped } from '@/lib/store';
import { RANGES, monthInRange, productivity, toGranularity } from '@/lib/metrics';
import { num } from '@/lib/format';
import { Bars, C, Trend } from '@/components/charts';
import { ChartLegend } from '@/components/ChartLegend';
import { EmptyState, FilterCluster, HeaderFilters, KpiCard, KpiRow, Sparkline, StripeBar, Tile, TileHeader, toneFor, useUrlParams } from '@/components/ui';

export default function Contractors() {
  const { filters, setFilters, hasDetail, active, contractors } = useScoped();
  const { monthly, manpower, vendors, quantities } = contractors;
  const url = useUrlParams({ contractor: vendors[0]?.name ?? '' });
  const vendor = vendors.find((v) => v.name === url.values.contractor) ?? vendors[0];
  const share = vendor?.share ?? 1;
  const scale = (n: number) => Math.round(n * share);
  const men = manpower.filter((m) => monthInRange(m.ym, filters.range));

  const months = toGranularity(monthly.filter((m) => monthInRange(m.ym, filters.range)), filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const manRows = toGranularity(men, filters.gran, ['plan', 'actual']).map((m) => ({ label: m.label, Plan: scale(m.plan), Actual: scale(m.actual) }));
  const prod = men.map((m) => ({ label: m.label, Productivity: m.productivity }));
  const progress = quantities.slice(0, 2).map((d) => ({ name: d.name, Scope: scale(d.scope), 'Cum plan': scale(d.cumPlan), 'Cum actual': scale(d.cumActual) }));
  const overallProd = productivity(vendors[0].actual, vendors[0].manDays);
  const none = <EmptyState title="No months fall in this period. Choose All dates in the Period filter." action={{ label: 'Show all dates', onClick: () => setFilters({ range: 'all' }) }} />;
  const PA = [{ key: 'Plan', name: 'Plan', color: C.muted }, { key: 'Actual', name: 'Actual', color: C.ink }];

  if (!hasDetail) return <EmptyState title={`No contractor data is loaded for ${active.name}. Select Belgaum expansion to compare contractors.`} />;
  return (
    <>
      <HeaderFilters>
        <FilterCluster onClear={() => { url.clear(); setFilters({ range: 'all' }); }} filters={[
          { key: 'contractor', label: 'Contractor', value: vendor.name, def: vendors[0].name, onChange: (v) => url.set('contractor', v), options: vendors.map((v) => ({ v: v.name, l: v.name })) },
          { key: 'period', label: 'Period', value: filters.range, def: 'all', onChange: (v) => setFilters({ range: v }), options: RANGES.map((r) => ({ v: r.id, l: r.label })) },
        ]} />
      </HeaderFilters>
      <KpiRow n={4}>
        <KpiCard label="Actual quantity" value={num(vendor.actual)} rail="neutral" context={`${Math.round((vendor.actual / vendor.plan) * 100)}% of plan`} />
        <KpiCard label="Plan quantity" value={num(vendor.plan)} rail="neutral" context={vendor.name} />
        <KpiCard label="Man-days" value={num(vendor.manDays)} rail="neutral" context="Actual man-days booked" />
        <KpiCard label="Productivity" value={num(productivity(vendor.actual, vendor.manDays), 2)} unit="per man-day" rail="caution" context="Quantity divided by man-days" />
      </KpiRow>
      <div className="stack">
        <section aria-labelledby="vendors-h">
          <TileHeader title="Vendors side by side" id="vendors-h"><span className="caption">Same scale in every card</span></TileHeader>
          <div className="grid12">
            {vendors.slice(1).map((v) => {
              const vp = productivity(v.actual, v.manDays), ach = (v.actual / v.plan) * 100;
              const vm = men.map((m) => ({ plan: Math.round(m.plan * v.share), actual: Math.round(m.actual * v.share) }));
              const maxM = Math.max(...manpower.map((m) => m.plan * vendors[1].share), 1);
              const trend = men.map((m) => +(m.productivity * (vp / overallProd)).toFixed(2));
              return (
                <Tile key={v.name} surface className="c3" title={<span className="block truncate" title={v.name}>{v.name.replace(' (sub-contractor)', '')}</span>}>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-col gap-1"><span className="label">Achieved</span><span className="fig"><span className="numeral-sm">{Math.round(ach)}</span><span className="unit">% of plan</span></span></div>
                      {v.name.includes('sub-contractor') && <span className="chip chip-none">Sub-contractor</span>}
                    </div>
                    <StripeBar label={`${v.name} achieved`} value={ach} color={toneFor(v.actual, v.plan * 0.85)} />
                    <div className="flex flex-col gap-2">
                      <span className="caption">Manpower by month, plan and actual</span>
                      <div className="mini-bars" role="img" aria-label={`${v.name} manpower: ${vm.map((m, i) => `${men[i].label} plan ${m.plan} actual ${m.actual}`).join(', ')}`}>
                        {vm.map((m, i) => (
                          <div key={i} title={`${men[i].label}: plan ${m.plan}, actual ${m.actual}`}>
                            <i style={{ height: `${(m.plan / maxM) * 100}%`, background: C.muted }} />
                            <i style={{ height: `${(m.actual / maxM) * 100}%`, background: C.ink }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between">{men.map((m) => <span key={m.label} className="caption tabular">{m.label.slice(0, 3)}</span>)}</div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex flex-col gap-1"><span className="caption">Productivity</span><span className="small w5 tabular">{num(vp, 2)} per man-day</span></span>
                      <Sparkline data={trend} color={vp >= overallProd ? C.good : C.warn} w={96} h={32} />
                    </div>
                  </div>
                </Tile>
              );
            })}
          </div>
          <div className="mt-3"><ChartLegend items={[{ label: 'Manpower plan', color: C.muted }, { label: 'Manpower actual', color: C.ink }]} /></div>
        </section>
        <div className="grid12">
          <Tile surface title="Execution progress" className="c6">
            <Bars label="Scope, cumulative plan and cumulative actual" xKey="name" height={240} labels data={progress} series={[{ key: 'Scope', name: 'Scope', color: C.muted }, { key: 'Cum plan', name: 'Cum plan', color: C.steel }, { key: 'Cum actual', name: 'Cum actual', color: C.ink }]} />
          </Tile>
          <Tile surface title={`Quantity by ${filters.gran === 'Weekly' ? 'week' : 'month'}`} className="c6">
            {months.length ? <Bars label="Plan and actual quantity by month" xKey="label" height={240} labels data={months} series={PA} /> : none}
          </Tile>
          <Tile surface title="Manpower" className="c6">
            {manRows.length ? <Bars label="Manpower plan and actual by month" xKey="label" height={240} labels data={manRows} series={PA} /> : none}
          </Tile>
          <Tile surface title="Productivity per man-day" className="c6">
            {prod.length ? <Trend label="Productivity per man-day by month" xKey="label" height={240} labels data={prod} series={[{ key: 'Productivity', name: 'Qty per man-day', color: C.ink }]} /> : none}
          </Tile>
        </div>
      </div>
    </>
  );
}
