'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PO_CATEGORIES, PO_PIPELINE, PO_TOTALS, PROCUREMENT } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { diffDays, fmtDate, fmtPct, milestoneLate, poDelayed, poReleased, poReleasedPct } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { BigStat, Chip, DarkPanel, DetailPane, EmptyState, FilterBar, InnerTile, MasterRow, PillSelect, StripeBar, Tile } from '@/components/ui';
import type { Milestone } from '@/lib/types';

const STAGES = [['eng', 'Engineering inputs'], ['tender', 'Tender'], ['tech', 'Technical evaluation'], ['commercial', 'Commercial'], ['po', 'PO release']] as const;
const lateDays = (m: Milestone) => (milestoneLate(m) ? diffDays(m.actual || REPORT_DATE, m.plan) : 0);

export default function Procurement() {
  const { filters, hasDetail } = useScoped();
  const sp = useSearchParams();
  const [tab, setTab] = useState('all');
  const [crit, setCrit] = useState(sp.get('critical') === '1' ? 'only' : '');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const base = PROCUREMENT.filter((p) => (filters.discipline === 'All' || p.discipline === filters.discipline) && (!crit || (p.critical && !poReleased(p))) && (!q || p.pkg.toLowerCase().includes(q.toLowerCase())));
  const tabs = [
    { id: 'all', label: 'All', test: () => true }, { id: 'pending', label: 'Pending', test: (p: (typeof base)[number]) => !poReleased(p) },
    { id: 'released', label: 'Released', test: poReleased }, { id: 'delayed', label: 'Delayed', test: poDelayed },
  ];
  const list = base.filter(tabs.find((t) => t.id === tab)!.test);
  const cur = list.find((p) => p.id === sel) ?? list[0];
  const rel = poReleasedPct(PO_TOTALS.released, PO_TOTALS.total);

  if (!hasDetail) return <EmptyState title="No procurement data is loaded for this project. Select Belgaum expansion to see its packages." />;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tile className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <BigStat label="Total POs" value={PO_TOTALS.total} />
            <BigStat label="Planned" value={PO_TOTALS.planned} />
            <BigStat label="Released" value={PO_TOTALS.released} unit={fmtPct(rel)} />
          </div>
          <ul className="mt-6 flex flex-col gap-3">
            {PO_CATEGORIES.map((c) => (
              <li key={c.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-medium">{c.released} of {c.total} released</span></div>
                <StripeBar label={`${c.name} released`} value={poReleasedPct(c.released, c.total)} plan={poReleasedPct(c.planned, c.total)} color="yellow" />
              </li>
            ))}
          </ul>
        </Tile>
        <Tile title="Balance PO pipeline by stage">
          <Bars label="Balance POs by stage" xKey="name" horizontal height={280} highlight="Sent to commercial" data={PO_PIPELINE} series={[{ key: 'value', name: 'POs', color: C.ink }]} />
        </Tile>
      </div>
      <FilterBar active={(crit ? 1 : 0) + (q ? 1 : 0)} search={{ value: q, onChange: setQ, placeholder: 'Search packages' }}>
        <PillSelect label="Critical" value={crit} onChange={setCrit} options={[{ v: '', l: 'Critical: all' }, { v: 'only', l: 'Critical POs only' }]} />
      </FilterBar>
      <DarkPanel tabs={tabs.map((t) => ({ id: t.id, label: t.label, count: base.filter(t.test).length }))} tab={tab} onTab={setTab}>
        {!list.length ? <EmptyState title="No packages match. Clear the filters to see every package." action={{ label: 'Clear filters', onClick: () => { setCrit(''); setQ(''); setTab('all'); } }} /> : (
          <div className="md-grid">
            <ul className="flex max-h-[640px] flex-col gap-2 overflow-y-auto pr-1" aria-label="Packages">
              {list.map((p) => <li key={p.id}><MasterRow selected={p.id === cur?.id} onClick={() => setSel(p.id)} title={p.pkg} id={p.category}
                status={poReleased(p) ? { label: 'Released', tone: 'good' } : poDelayed(p) ? { label: 'Delayed', tone: 'bad' } : { label: 'Pending', tone: 'warn' }} figure={p.critical ? 'Critical' : undefined} /></li>)}
            </ul>
            {cur && (
              <DetailPane title={cur.pkg} status={poReleased(cur) ? { label: 'Released', tone: 'good' } : { label: 'Pending', tone: 'warn' }}
                footer={<><span className="text-sm text-fog">{cur.category} package</span>{cur.critical ? <Chip tone="bad">Critical PO</Chip> : <Chip>Not critical</Chip>}</>}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {STAGES.map(([k, label]) => {
                    const m = cur[k], late = lateDays(m);
                    return (
                      <InnerTile key={k} label={label}>
                        <div className="text-sm text-fog">Planned {fmtDate(m.plan)}</div>
                        <div>{m.actual ? fmtDate(m.actual) : 'Pending'}</div>
                        <div className="mt-1">{late > 0 ? <Chip tone="bad">{late} days late</Chip> : <Chip tone="good">On plan</Chip>}</div>
                      </InnerTile>
                    );
                  })}
                </div>
              </DetailPane>
            )}
          </div>
        )}
      </DarkPanel>
    </div>
  );
}
