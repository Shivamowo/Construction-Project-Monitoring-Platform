'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useScoped } from '@/lib/store';
import { diffDays, milestoneLate, poDelayed, poPastDue, poReleased, poReleasedPct, sum } from '@/lib/metrics';
import { dateLong, dateShort, num, pct } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { DarkPanel, DetailPane, EmptyState, FilterBar, InnerTile, KpiCard, MasterRow, PillSelect, StatusChip, StripeBar, Tile } from '@/components/ui';
import type { Milestone, PoRow } from '@/lib/types';

const STAGES = [['eng', 'Engineering inputs'], ['tender', 'Tender'], ['tech', 'Technical evaluation'], ['commercial', 'Sent to commercial'], ['po', 'PO release']] as const;
const lateDays = (m: Milestone) => (milestoneLate(m) ? diffDays(m.actual || REPORT_DATE, m.plan) : 0);
const technical = (p: PoRow) => (p.tech.actual ? 'Approved' : p.eng.actual ? 'Under review' : 'Awaiting inputs');

export default function Procurement() {
  const { filters, hasDetail, procurement } = useScoped();
  const sp = useSearchParams();
  const [tab, setTab] = useState('all');
  const [crit, setCrit] = useState(sp.get('critical') === '1' ? 'only' : '');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const { rows: all, categories, pipeline } = procurement;
  const total = sum(categories.map((c) => c.total)), planned = sum(categories.map((c) => c.planned)), released = sum(categories.map((c) => c.released)), pastDue = sum(categories.map((c) => c.pastDue));
  const toRelease = total - released;
  const criticalOpen = all.filter((p) => p.critical && !poReleased(p)).length;

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
      <div className="kpi-grid c4">
        <KpiCard label="Total POs" value={num(total)} rail="neutral" context={`${categories.length} categories`} />
        <KpiCard label="Planned" value={num(planned)} rail="neutral" context={`${pct(planned / total * 100)} of total`} />
        <KpiCard label="Released" value={num(released)} rail="good" context={`${pct(poReleasedPct(released, total))} of total`} />
        <KpiCard label="Critical POs" value={criticalOpen} rail="critical" href="/procurement?critical=1" context="Critical and not yet released" />
      </div>
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Tile surface title="PO status by package" className="lg:col-span-2">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {categories.map((c) => (
              <li key={c.name} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{c.name}</span><span className="label">Total {num(c.total)}, planned {num(c.planned)}, released {num(c.released)}</span></div>
                <StripeBar label={`${c.name} released`} value={poReleasedPct(c.released, c.total)} plan={poReleasedPct(c.planned, c.total)} color="yellow" />
              </li>
            ))}
          </ul>
        </Tile>
        <Tile title="Release readiness">
          <div className="grid grid-cols-2 gap-4"><div><span className="label">To release</span><div className="numeral">{toRelease}</div></div><div><span className="label">Past due</span><div className="numeral" style={{ color: 'var(--red)' }}>{pastDue}</div></div></div>
          <div className="mt-6 flex flex-col gap-4">
            <div><div className="mb-1 flex justify-between text-sm"><span>To release</span><span>{toRelease} of {total}</span></div><StripeBar label="To release share of total" value={(toRelease / total) * 100} color="ink" /></div>
            <div><div className="mb-1 flex justify-between text-sm"><span>Past due</span><span>{pastDue} of {toRelease}</span></div><StripeBar label="Past due share of balance" value={(pastDue / toRelease) * 100} color="bad" /></div>
          </div>
        </Tile>
      </div>
      <Tile surface title="Balance PO pipeline by stage" className="mb-6">
        <Bars label={`Balance POs by stage, ${sum(pipeline.map((p) => p.value))} in total`} xKey="name" horizontal height={240} highlight="Sent to commercial" labels data={pipeline} series={[{ key: 'value', name: 'POs', color: C.ink }]} />
      </Tile>
      <FilterBar active={(crit ? 1 : 0) + (q ? 1 : 0)} search={{ value: q, onChange: setQ, placeholder: 'Search packages' }}>
        <PillSelect label="Critical" value={crit} onChange={setCrit} options={[{ v: '', l: 'Critical: all' }, { v: 'only', l: 'Critical POs only' }]} />
      </FilterBar>
      <div className="mt-4">
        <DarkPanel tabs={tabs.map((t) => ({ id: t.id, label: t.label, count: base.filter(t.test).length }))} tab={tab} onTab={setTab}>
          {!list.length ? <EmptyState title="No packages match. Clear the filters to see every package." action={{ label: 'Clear filters', onClick: () => { setCrit(''); setQ(''); setTab('all'); } }} /> : (
            <div className="md-grid">
              <ul className="m-0 flex max-h-[680px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1" aria-label="Packages">
                {list.map((p) => (
                  <li key={p.id}><MasterRow selected={p.id === cur?.id} onClick={() => setSel(p.id)} title={p.pkg} id={p.category} age={technical(p)}
                    status={poReleased(p) ? { label: 'Released', tone: 'good' } : poPastDue(p) ? { label: 'Past due', tone: 'bad' } : { label: 'Pending', tone: 'warn' }} figure={p.critical ? 'Critical' : undefined} /></li>
                ))}
              </ul>
              {cur && (
                <DetailPane title={cur.pkg} status={poReleased(cur) ? { label: 'Released', tone: 'good' } : { label: 'Pending', tone: 'warn' }}
                  footer={<><span className="flex flex-wrap items-center gap-2 text-sm">{cur.category} package <StatusChip tone={cur.tech.actual ? 'good' : 'info'}>Technical: {technical(cur)}</StatusChip>{poPastDue(cur) && <StatusChip tone="bad">Past due</StatusChip>}</span>{cur.critical ? <StatusChip tone="bad">Critical PO</StatusChip> : <StatusChip>Not critical</StatusChip>}</>}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {STAGES.map(([k, label]) => {
                      const m = cur[k], late = lateDays(m);
                      return (
                        <InnerTile key={k} label={label}>
                          <div className="text-sm" style={{ color: 'var(--fog)' }}>Planned {dateShort(m.plan)}</div>
                          <div>{m.actual ? dateShort(m.actual) : 'Pending'}</div>
                          <div className="mt-1">{late > 0 ? <StatusChip tone="bad">{late} days late</StatusChip> : <StatusChip tone="good">On plan</StatusChip>}</div>
                        </InnerTile>
                      );
                    })}
                  </div>
                  <p className="m-0 text-xs" style={{ color: 'var(--fog)' }}>Report date {dateLong(REPORT_DATE)}. A package is past due when its planned PO release date has passed and it is not released.</p>
                </DetailPane>
              )}
            </div>
          )}
        </DarkPanel>
      </div>
    </>
  );
}
