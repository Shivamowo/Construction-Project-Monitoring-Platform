'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useScoped, useStore } from '@/lib/store';
import { daysRemaining, isOverdue, poReleased, shortfall, varianceDays } from '@/lib/metrics';
import { dateLong, num, pct } from '@/lib/format';
import { IndiaMap } from '@/components/IndiaMap';
import { BigStat, DarkPanel, DetailPane, EmptyState, FilterCluster, HeaderFilters, InnerTile, KpiCard, MasterRow, StripeBar, Tile, statusTone, toneFor, useUrlParams } from '@/components/ui';

const TABS = [['all', 'All'], ['track', 'On track'], ['risk', 'At risk'], ['delay', 'Delayed'], ['planned', 'Planned']] as const;

export default function ProjectCenter() {
  const { projects, actions, risks, delays, procurement, drawings, dpr, trends, filters, setFilters } = useScoped();
  const { actions: allActions } = useStore();
  const url = useUrlParams({ portfolio: '' });
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('all');
  void allActions;

  const pool = projects.filter((p) => !url.values.portfolio || p.phase === url.values.portfolio);
  const on = pool.filter((p) => p.status === 'On track'), risk = pool.filter((p) => p.status === 'At risk'), late = pool.filter((p) => p.status === 'Delay');
  const share = pool.length ? Math.round((on.length / pool.length) * 100) : 0;
  const list = pool.filter((p) => (tab === 'all' ? true : tab === 'track' ? p.status === 'On track' : tab === 'risk' ? p.status === 'At risk' : tab === 'delay' ? p.status === 'Delay' : p.phase === 'Planned'));
  const tabCount = (id: string) => pool.filter((p) => (id === 'all' ? true : id === 'track' ? p.status === 'On track' : id === 'risk' ? p.status === 'At risk' : id === 'delay' ? p.status === 'Delay' : p.phase === 'Planned')).length;
  const sel = list.find((p) => p.id === filters.projectId) ?? list[0];

  const criticalPOs = procurement.rows.filter((p) => p.critical && !poReleased(p)).length;
  const quick = [
    { href: '/actions?status=Not%20closed', label: 'Actions', n: actions.filter((a) => a.status !== 'Closed').length, hint: 'open' },
    { href: '/risks?status=Not%20closed&rating=High', label: 'Risks', n: risks.filter((r) => r.status !== 'Closed' && r.rating === 'High').length, hint: 'high' },
    { href: '/delays?status=Open', label: 'Delays', n: delays.filter((d) => d.status === 'Open').length, hint: 'open' },
    { href: '/procurement?critical=1', label: 'Procurement', n: criticalPOs, hint: 'critical POs' },
    { href: '/drawings', label: 'Drawings', n: drawings.tracker.filter((r) => r.plan > r.received).length, hint: 'behind' },
    { href: '/dpr', label: 'Daily progress', n: dpr.filter((r) => shortfall(r.ftmPlan, r.ftmAct) > 0).length, hint: 'behind' },
    { href: '/contractors', label: 'Contractors', n: 0, hint: '' },
    { href: '/scorecard', label: 'Scorecard', n: 0, hint: '' },
  ];
  void isOverdue;

  return (
    <>
      <HeaderFilters>
        <FilterCluster onClear={url.clear} filters={[{ key: 'portfolio', label: 'Portfolio', value: url.values.portfolio, def: '', onChange: (v) => url.set('portfolio', v), options: [{ v: '', l: 'All projects' }, { v: 'Active', l: 'Active projects' }, { v: 'Planned', l: 'Planned projects' }] }]} />
      </HeaderFilters>
      <div className="kpi-grid c4">
        <KpiCard label="Projects" value={pool.length} rail="neutral" href="/portfolio" context={`${pool.filter((p) => p.phase === 'Active').length} active, ${pool.filter((p) => p.phase === 'Planned').length} planned`} />
        <KpiCard label="On track" value={on.length} rail="good" href="/portfolio?status=On%20track" spark={trends.onTrack} context={`${share}% of portfolio`} />
        <KpiCard label="At risk" value={risk.length} rail="caution" href="/portfolio?status=At%20risk" context="Needs attention" />
        <KpiCard label="Delayed" value={late.length} rail="critical" href="/portfolio?status=Delay" context="Recovery plan due" />
      </div>
      <div className="split mb-6">
        <Tile surface title="Project map"><IndiaMap selected={filters.projectId} onSelect={(id) => setFilters({ projectId: id })} /></Tile>
        <Tile title="Quick access">
          <nav aria-label="Quick access" className="flex flex-col gap-2">
            {quick.map((q, i) => (
              <Link key={q.href} href={q.href} className={i === 0 ? 'qa first' : 'qa'} aria-label={q.n ? `${q.label}, ${q.n} ${q.hint}` : q.label}>
                <span>{q.label}</span>
                <span className="flex items-center gap-2">{q.n > 0 && <span className="n" aria-hidden>{q.n}</span>}<ChevronRight size={16} aria-hidden /></span>
              </Link>
            ))}
          </nav>
        </Tile>
      </div>
      <DarkPanel tabs={TABS.map(([id, label]) => ({ id, label, count: tabCount(id) }))} tab={tab} onTab={(id) => setTab(id as typeof tab)}>
        <h2 className="mb-4 mt-0 text-lg font-medium">Projects</h2>
        {!list.length ? <EmptyState title="No projects in this view. Pick another tab or clear the portfolio filter." action={{ label: 'Clear filters', onClick: () => { url.clear(); setTab('all'); } }} /> : (
          <div className="md-grid">
            <ul className="m-0 flex max-h-[640px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1" aria-label="Projects">
              {list.map((p) => <li key={p.id}><MasterRow selected={p.id === sel?.id} onClick={() => setFilters({ projectId: p.id })} title={p.name} id={p.state} age={`forecast ${dateLong(p.forecastFinish)}`} status={{ label: p.phase === 'Planned' ? 'Planned' : p.status, tone: p.phase === 'Planned' ? 'info' : statusTone(p.status) }} figure={`${p.actualPct}%`} /></li>)}
            </ul>
            {sel && (
              <DetailPane title={sel.name} status={{ label: sel.status, tone: statusTone(sel.status) }}
                footer={<><span className="text-sm" style={{ color: 'var(--fog)' }}>{sel.state}, {sel.phase.toLowerCase()} project</span><Link href="/scorecard" onClick={() => setFilters({ projectId: sel.id })} className="btn-primary">Open scorecard</Link></>}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <BigStat size="title-sm" label="Plan" value={sel.planPct} unit="%" />
                  <BigStat size="title-sm" label="Actual" value={sel.actualPct} unit="%" />
                  <BigStat size="title-sm" label="Variance" value={varianceDays(sel.baselineFinish, sel.forecastFinish) > 0 ? `+${varianceDays(sel.baselineFinish, sel.forecastFinish)}` : varianceDays(sel.baselineFinish, sel.forecastFinish)} unit="days" tone={varianceDays(sel.baselineFinish, sel.forecastFinish) > 0 ? 'bad' : 'good'} />
                </div>
                <StripeBar label="Actual against plan" value={sel.actualPct} plan={sel.planPct} color={toneFor(sel.actualPct, sel.planPct)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <InnerTile label="Baseline finish">{dateLong(sel.baselineFinish)}</InnerTile>
                  <InnerTile label="Forecast finish">{dateLong(sel.forecastFinish)}</InnerTile>
                  <InnerTile label="Execution start">{dateLong(sel.execStart)}</InnerTile>
                  <InnerTile label={daysRemaining(sel.forecastFinish) < 0 ? 'Days past forecast' : 'Days remaining'}>{num(Math.abs(daysRemaining(sel.forecastFinish)))} days</InnerTile>
                </div>
              </DetailPane>
            )}
          </div>
        )}
      </DarkPanel>
    </>
  );
}
