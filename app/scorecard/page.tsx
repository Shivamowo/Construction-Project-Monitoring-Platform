'use client';
import Link from 'next/link';
import { useScoped } from '@/lib/store';
import { daysRemaining, drawingPct, poReleasedPct, varianceDays } from '@/lib/metrics';
import { dateLong as fmtDate, num as fmtNum } from '@/lib/format';
import { SCurve } from '@/components/SCurve';
import { BigStat, DarkPanel, EmptyState, StripeBar, Tile, toneFor } from '@/components/ui';

export default function Scorecard() {
  const { active, hasDetail, actions, risks, procurement, drawings } = useScoped();
  const DRAWING_TYPES = drawings.types;
  const PO_TOTALS = { total: procurement.categories.reduce((a, c) => a + c.total, 0), released: procurement.categories.reduce((a, c) => a + c.released, 0) };
  const critical = procurement.rows.filter((r) => r.critical && !r.po.actual).length;
  const v = varianceDays(active.baselineFinish, active.forecastFinish);
  const rem = daysRemaining(active.forecastFinish);
  const openActions = actions.filter((a) => a.status !== 'Closed').length;
  const high = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High').length;
  const rel = poReleasedPct(PO_TOTALS.released, PO_TOTALS.total);
  const dRec = drawingPct(DRAWING_TYPES.filter((d) => d.unit === 'm³').reduce((s, d) => s + d.received, 0), DRAWING_TYPES.filter((d) => d.unit === 'm³').reduce((s, d) => s + d.scope, 0));
  const detail = <EmptyState title={`No schedule data is loaded for ${active.name}. Select Belgaum expansion to see the full scorecard.`} />;
  return (
    <div className="flex flex-col gap-4">
      <Tile>
        <p className="mb-4 text-base font-medium">{active.name}, {active.state}</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <BigStat label="Baseline finish" value={fmtDate(active.baselineFinish)} size="title-sm" />
          <BigStat label="Forecast finish" value={fmtDate(active.forecastFinish)} size="title-sm" />
          <BigStat label="Variance" value={v > 0 ? `+${v}` : v} unit="days" tone={v > 0 ? 'bad' : 'good'} delta={rem < 0 ? `${fmtNum(Math.abs(rem))} days past forecast` : `${fmtNum(rem)} days remaining`} deltaTone={rem < 0 ? 'bad' : 'good'} />
        </div>
      </Tile>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile>
          <BigStat label="PO released" value={hasDetail ? Math.round(rel) : 0} unit="%" href="/procurement" />
          <div className="mt-4"><StripeBar label="PO released" value={rel} color={toneFor(rel, 75)} /></div>
        </Tile>
        <Tile>
          <BigStat label="Drawings received (civil)" value={hasDetail ? Math.round(dRec) : 0} unit="%" href="/drawings" />
          <div className="mt-4"><StripeBar label="Drawings received" value={dRec} color="yellow" /></div>
        </Tile>
        <Tile>
          <BigStat label="Open actions" value={openActions} href="/actions?status=Not%20closed" />
          <div className="mt-4"><StripeBar label="Open actions share of all actions" value={actions.length ? (openActions / actions.length) * 100 : 0} color="ink" /></div>
        </Tile>
        <Tile>
          <BigStat label="High risks" value={high} href="/risks?status=Not%20closed&rating=High" tone={high ? 'bad' : undefined} />
          <div className="mt-4"><StripeBar label="High risks share of open risks" value={risks.filter((r) => r.status !== 'Closed').length ? (high / risks.filter((r) => r.status !== 'Closed').length) * 100 : 0} color="bad" /></div>
        </Tile>
      </div>
      <Tile surface title="Priority signals">
        <div className="flex flex-wrap gap-2">
          <Link href="/risks?status=Not%20closed&rating=High" className="chip chip-bad">{high} high risks</Link>
          <Link href="/actions?status=Not%20closed" className="chip chip-warn">{openActions} open actions</Link>
          <Link href="/procurement?critical=1" className="chip chip-bad">{critical} critical POs</Link>
        </div>
      </Tile>
      <DarkPanel>
        <h2 className="mb-2 text-lg font-medium">S-curve: plan and actual progress</h2>
        {hasDetail ? <SCurve /> : detail}
        <Link href="/delays" className="mt-4 inline-flex h-10 items-center rounded-full bg-white/15 px-5 text-sm font-medium text-white">See delays behind the gap</Link>
      </DarkPanel>
    </div>
  );
}
