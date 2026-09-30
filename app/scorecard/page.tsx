'use client';
import Link from 'next/link';
import { useScoped, useStore } from '@/lib/store';
import { daysRemaining, drawingPct, poReleasedPct, varianceDays } from '@/lib/metrics';
import { dateLong, num } from '@/lib/format';
import { SCurve } from '@/components/SCurve';
import { DelayBridge } from '@/components/viz';
import { DarkPanel, EmptyState, KpiCard, KpiRow, StripeBar, Tile, toneFor } from '@/components/ui';

export default function Scorecard() {
  const { active, hasDetail, actions, risks, procurement, drawings } = useScoped();
  const { delays: allDelays } = useStore();
  const v = varianceDays(active.baselineFinish, active.forecastFinish);
  const rem = daysRemaining(active.forecastFinish);
  const openActions = actions.filter((a) => a.status !== 'Closed').length;
  const openRisks = risks.filter((r) => r.status !== 'Closed');
  const high = openRisks.filter((r) => r.rating === 'High').length;
  const total = procurement.categories.reduce((a, c) => a + c.total, 0), released = procurement.categories.reduce((a, c) => a + c.released, 0);
  const rel = poReleasedPct(released, total);
  const critical = procurement.rows.filter((r) => r.critical && !r.po.actual).length;
  const civil = drawings.types.filter((d) => d.unit === 'm³');
  const dRec = drawingPct(civil.reduce((s, d) => s + d.received, 0), civil.reduce((s, d) => s + d.scope, 0));
  const causes = allDelays.filter((d) => d.projectId === active.id && d.cause && d.criticalDays).map((d) => ({ id: d.id, label: d.cause!, days: d.criticalDays! })).sort((a, b) => b.days - a.days);
  const none = (what: string) => <EmptyState title={`No ${what} is loaded for ${active.name}. Select Belgaum expansion to see the full scorecard.`} />;

  return (
    <>
      <KpiRow n={3}>
        <KpiCard label="Baseline finish" value={dateLong(active.baselineFinish)} rail="neutral" context={`${active.name}, ${active.state}`} />
        <KpiCard label="Forecast finish" value={dateLong(active.forecastFinish)} rail={v > 0 ? 'critical' : 'good'} context={rem < 0 ? `${num(-rem)} days past forecast` : `${num(rem)} days remaining`} />
        <KpiCard label="Variance" value={v > 0 ? `+${v}` : v} unit="days" rail={v > 0 ? 'critical' : 'good'} href="/delays" context={v > 0 ? 'Forecast is later than baseline' : 'Forecast is on or before baseline'} />
      </KpiRow>
      <KpiRow n={4}>
        <KpiCard label="PO released" value={hasDetail ? Math.round(rel) : 0} unit="%" rail="neutral" href="/procurement" foot={<StripeBar label="PO released" value={rel} color={toneFor(rel, 75)} />} />
        <KpiCard label="Drawings received (civil)" value={hasDetail ? Math.round(dRec) : 0} unit="%" rail="neutral" href="/drawings" foot={<StripeBar label="Drawings received" value={dRec} color="yellow" />} />
        <KpiCard label="Open actions" value={openActions} rail="caution" href="/actions?status=Not%20closed" foot={<StripeBar label="Open actions share of all actions" value={actions.length ? (openActions / actions.length) * 100 : 0} color="ink" />} />
        <KpiCard label="High risks" value={high} rail="critical" href="/risks?status=Not%20closed&rating=High" foot={<StripeBar label="High risks share of open risks" value={openRisks.length ? (high / openRisks.length) * 100 : 0} color="bad" />} />
      </KpiRow>
      <div className="stack">
        <DarkPanel title="S-curve: plan and actual progress" action={<Link href="/delays" className="btn-dark">See delays behind the gap</Link>}>
          {hasDetail ? <SCurve /> : none('schedule data')}
        </DarkPanel>
        <div className="grid12">
          <Tile surface title="Delay bridge" className="c8" action={<span className="caption">Days each cause added to the finish date</span>}>
            {causes.length ? <DelayBridge baseline={active.baselineFinish} forecast={active.forecastFinish} causes={causes} /> : none('delay cause data')}
          </Tile>
          <Tile title="Priority signals" className="c4">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              <li><Link href="/risks?status=Not%20closed&rating=High" className="qa"><span>High risks</span><span className="chip chip-bad tabular">{high}</span></Link></li>
              <li><Link href="/actions?status=Not%20closed" className="qa"><span>Open actions</span><span className="chip chip-warn tabular">{openActions}</span></Link></li>
              <li><Link href="/procurement?critical=1" className="qa"><span>Critical POs</span><span className="chip chip-bad tabular">{critical}</span></Link></li>
            </ul>
          </Tile>
        </div>
      </div>
    </>
  );
}
