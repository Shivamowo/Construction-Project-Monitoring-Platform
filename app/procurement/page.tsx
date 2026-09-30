'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useScoped } from '@/lib/store';
import { diffDays, milestoneLate, poDelayed, poPastDue, poReleased, poReleasedPct, sum } from '@/lib/metrics';
import { dateLong, dateShort, num, pct } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { HeatStrip, StagePipeline } from '@/components/viz';
import { DarkPanel, DetailPane, EmptyState, FilterBar, InnerTile, KpiCard, KpiRow, MasterRow, PillSelect, StatusChip, StripeBar, Tile } from '@/components/ui';
import type { Milestone, PoRow } from '@/lib/types';

const STAGES = [['eng', 'Engineering inputs'], ['tender', 'Tender'], ['tech', 'Technical evaluation'], ['commercial', 'Sent to commercial'], ['po', 'PO release']] as const;
const lateDays = (m: Milestone) => (milestoneLate(m) ? diffDays(m.actual || REPORT_DATE, m.plan) : 0);
const technical = (p: PoRow) => (p.tech.actual ? 'Approved' : p.eng.actual ? 'Under review' : 'Awaiting inputs');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Procurement() {
  const { filters, hasDetail, procurement } = useScoped();
  const sp = useSearchParams();
  const [tab, setTab] = useState('all');
  const [crit, setCrit] = useState(sp.get('critical') === '1' ? 'only' : '');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const { rows: all, categories, pipeline, releasePlan } = procurement;
  const total = sum(categories.map((c) => c.total)), planned = sum(categories.map((c) => c.planned)), released = sum(categories.map((c) => c.released)), pastDue = sum(categories.map((c) => c.pastDue));
  const toRelease = total - released;
  const criticalOpen = all.filter((p) => p.critical && !poReleased(p)).length;

  const stage = (n: string) => pipeline.find((p) => p.name === n) ?? { value: 0, pastDue: 0 };
  const notPlanned = stage('Not yet planned');
  const stages = [
    { name: 'Engineering inputs', count: stage('Engineering inputs').value + notPlanned.value, pastDue: stage('Engineering inputs').pastDue + notPlanned.pastDue, note: `${notPlanned.value} not yet planned` },
    { name: 'Tender', count: stage('Tender').value, pastDue: stage('Tender').pastDue },
    { name: 'Technical evaluation', count: stage('Technical evaluation').value, pastDue: stage('Technical evaluation').pastDue },
    { name: 'Commercial', count: stage('Sent to commercial').value, pastDue: stage('Sent to commercial').pastDue },
    { name: 'PO released', count: released, pastDue: 0 },
  ];
  const start = Date.parse(`${REPORT_DATE}T00:00:00Z`);
  const monday = start + ((8 - new Date(start).getUTCDay()) % 7 || 7) * 86400000;
  const weeks = releasePlan.map((count, i) => { const d = new Date(monday + i * 7 * 86400000); return { label: `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`, count }; });

  const base = all.filter((p) => (filters.discipline === 'All' || p.discipline === filters.discipline) && (!crit || (p.critical && !poReleased(p))) && (!q || p.pkg.toLowerCase().includes(q.toLowerCase())));
  const tabs = [
    { id: 'all', label: 'All', test: (_: PoRow) => true }, { id: 'pending', label: 'Pending', test: (p: PoRow) => !poReleased(p) },
    { id: 'released', label: 'Released', test: poReleased }, { id: 'delayed', label: 'Delayed', test: poDelayed },
  ];
  const list = base.filter(tabs.find((t) => t.id === tab)!.test);
  const cur = list.find((p) => p.id === sel) ?? list[0];

  if (!hasDetail) return <EmptyState title="No procurement data is loaded for this project. Select Belgaum expansion to see its packages." />;
  return (
    <>
      <KpiRow n={4}>
        <KpiCard label="Total POs" value={num(total)} rail="neutral" context={`${categories.length} categories`} />
        <KpiCard label="Planned" value={num(planned)} rail="neutral" context={`${pct((planned / total) * 100)} of total`} />
        <KpiCard label="Released" value={num(released)} rail="good" context={`${pct(poReleasedPct(released, total))} of total`} />
        <KpiCard label="Critical POs" value={criticalOpen} rail="critical" href="/procurement?critical=1" context="Critical and not yet released" />
      </KpiRow>
      <div className="stack">
        <Tile surface title="Stage pipeline" action={<span className="caption tabular">{toRelease} to release, {pastDue} past due</span>}>
          <StagePipeline stages={stages} />
        </Tile>
        <div className="grid12">
          <Tile surface title="PO status by category" className="c7">
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {categories.map((c) => (
                <li key={c.name} className="flex flex-col gap-2">
                  <div className="flex flex-wrap justify-between gap-2"><span className="small w5">{c.name}</span><span className="small muted tabular">{num(c.released)} of {num(c.total)} released, {num(c.planned)} planned</span></div>
                  <StripeBar label={`${c.name} released`} value={poReleasedPct(c.released, c.total)} plan={poReleasedPct(c.planned, c.total)} color="yellow" />
                </li>
              ))}
            </ul>
          </Tile>
          <Tile title="Release targets, next 12 weeks" className="c5" action={<span className="caption tabular">{sum(releasePlan)} POs</span>}>
            <HeatStrip weeks={weeks} />
            <p className="caption mt-4">Revised release target for each unreleased PO, grouped by week starting {dateLong(new Date(monday).toISOString().slice(0, 10))}.</p>
          </Tile>
        </div>
        <FilterBar active={(crit ? 1 : 0) + (q ? 1 : 0)} search={{ value: q, onChange: setQ, placeholder: 'Search packages' }}>
          <PillSelect label="Critical" value={crit} onChange={setCrit} options={[{ v: '', l: 'Critical: all' }, { v: 'only', l: 'Critical POs only' }]} />
        </FilterBar>
        <DarkPanel title="Package tracker" action={<span className="caption tabular">{list.length} of {all.length} shown</span>} tabs={tabs.map((t) => ({ id: t.id, label: t.label, count: base.filter(t.test).length }))} tab={tab} onTab={setTab}>
          {!list.length ? <EmptyState title="No packages match. Clear the filters to see every package." action={{ label: 'Clear filters', onClick: () => { setCrit(''); setQ(''); setTab('all'); } }} /> : (
            <div className="md-grid">
              <ul className="m-0 flex max-h-[680px] list-none flex-col gap-2 overflow-y-auto p-0" aria-label="Packages">
                {list.map((p) => (
                  <li key={p.id}><MasterRow selected={p.id === cur?.id} onClick={() => setSel(p.id)} title={p.pkg} id={p.category} age={technical(p)}
                    status={poReleased(p) ? { label: 'Released', tone: 'good' } : poPastDue(p) ? { label: 'Past due', tone: 'bad' } : { label: 'Pending', tone: 'warn' }} figure={p.critical ? 'Critical' : undefined} /></li>
                ))}
              </ul>
              {cur && (
                <DetailPane title={cur.pkg} status={poReleased(cur) ? { label: 'Released', tone: 'good' } : { label: 'Pending', tone: 'warn' }}
                  footer={<><span className="small flex flex-wrap items-center gap-2">{cur.category} package <StatusChip tone={cur.tech.actual ? 'good' : 'info'}>Technical: {technical(cur)}</StatusChip>{poPastDue(cur) && <StatusChip tone="bad">Past due</StatusChip>}</span>{cur.critical ? <StatusChip tone="bad">Critical PO</StatusChip> : <StatusChip>Not critical</StatusChip>}</>}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {STAGES.map(([k, label]) => {
                      const m = cur[k], late = lateDays(m);
                      return (
                        <InnerTile key={k} label={label}>
                          <div className="flex flex-col gap-1">
                            <span className="caption">Planned {dateShort(m.plan)}</span>
                            <span>{m.actual ? dateShort(m.actual) : 'Pending'}</span>
                            <span>{late > 0 ? <StatusChip tone="bad">{late} days late</StatusChip> : <StatusChip tone="good">On plan</StatusChip>}</span>
                          </div>
                        </InnerTile>
                      );
                    })}
                  </div>
                  <p className="caption">Report date {dateLong(REPORT_DATE)}. A package is past due when its planned PO release date has passed and it is not released.</p>
                </DetailPane>
              )}
            </div>
          )}
        </DarkPanel>
      </div>
    </>
  );
}
