'use client';
import { DRAWING_TYPES, PO_TOTALS } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { daysRemaining, drawingPct, fmtDate, fmtNum, fmtPct, poReleasedPct, varianceDays } from '@/lib/metrics';
import { SCurve } from '@/components/SCurve';
import { Chip, EmptyState, Kpi, PageHeader, Tile, statusTone } from '@/components/ui';

export default function Scorecard() {
  const { active, hasDetail, actions, risks } = useScoped();
  const v = varianceDays(active.baselineFinish, active.forecastFinish);
  const rem = daysRemaining(active.forecastFinish);
  const openActions = actions.filter((a) => a.status !== 'Closed').length;
  const high = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High').length;
  const rel = poReleasedPct(PO_TOTALS.released, PO_TOTALS.total);
  const detail = (what: string) => <EmptyState title={`No ${what} loaded for ${active.name}`} hint="Select Belgaum expansion in the project list to see the full scorecard." />;
  return (
    <>
      <PageHeader title="Project scorecard" lede={`${active.name}, ${active.state}. Baseline, forecast and delivery status in one view.`}>
        <Chip tone={statusTone(active.status)}>{active.status}</Chip>
      </PageHeader>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Baseline finish" value={fmtDate(active.baselineFinish)} />
        <Kpi label="Forecast finish" value={fmtDate(active.forecastFinish)} />
        <Kpi label="Variance days" value={v > 0 ? `+${v}` : v} tone={v > 0 ? 'bad' : 'good'} note={v > 0 ? 'Forecast is later than baseline' : 'Forecast is on or before baseline'} />
        <Kpi label="Days remaining" value={fmtNum(Math.abs(rem))} tone={rem < 0 ? 'bad' : undefined} note={rem < 0 ? 'days past forecast' : 'to forecast finish'} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
        <Tile title="PO status" className="md:col-span-3 xl:col-span-4">
          {hasDetail ? (
            <>
              <p className="font-display text-2xl font-semibold">{fmtPct(rel)}</p>
              <p className="text-sm text-graphite">of POs released</p>
              <div className="my-3 h-2 rounded-full bg-line" role="img" aria-label={`${Math.round(rel)} percent released`}><div className="h-2 rounded-full bg-ink" style={{ width: `${rel}%` }} /></div>
              <dl className="grid grid-cols-3 text-sm">
                {[['Total', PO_TOTALS.total], ['Planned', PO_TOTALS.planned], ['Released', PO_TOTALS.released]].map(([k, n]) => <div key={k}><dt className="text-graphite">{k}</dt><dd className="text-lg font-semibold">{n}</dd></div>)}
              </dl>
            </>
          ) : detail('PO data')}
        </Tile>
        <Tile title="Drawing status by discipline" className="md:col-span-3 xl:col-span-5">
          {hasDetail ? (
            <ul className="flex flex-col gap-2">
              {DRAWING_TYPES.map((d) => {
                const p = drawingPct(d.received, d.scope);
                return (
                  <li key={d.name} className="grid grid-cols-[110px_1fr_44px] items-center gap-3 text-sm">
                    <span>{d.name}</span>
                    <span className="h-2 rounded-full bg-line" role="img" aria-label={`${Math.round(p)} percent received`}><span className="block h-2 rounded-full bg-ink" style={{ width: `${p}%` }} /></span>
                    <span className="text-right font-medium">{Math.round(p)}%</span>
                  </li>
                );
              })}
            </ul>
          ) : detail('drawing data')}
        </Tile>
        <div className="grid grid-cols-2 gap-4 md:col-span-6 xl:col-span-3 xl:grid-cols-1">
          <Kpi label="Open actions" value={openActions} href="/actions?state=Active" />
          <Kpi label="High risks" value={high} href="/risks?state=Active&rating=High" tone={high ? 'bad' : undefined} />
        </div>
        <Tile title="S-curve: plan and actual progress" className="md:col-span-6 xl:col-span-12">
          {hasDetail ? <SCurve /> : detail('schedule data')}
        </Tile>
      </div>
    </>
  );
}
