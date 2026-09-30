'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { PO_CATEGORIES, PO_PIPELINE, PO_TOTALS, PROCUREMENT } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { fmtDate, milestoneLate, poDelayed, poReleased, poReleasedPct, fmtPct } from '@/lib/metrics';
import { Bars, C } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { Chip, EmptyState, Kpi, PageHeader, Tile } from '@/components/ui';
import type { Milestone, PoRow } from '@/lib/types';

const ms = (m: Milestone) => (
  <div className="whitespace-nowrap">
    <div className="text-xs text-graphite">Plan {fmtDate(m.plan)}</div>
    <div className={clsx(milestoneLate(m) && 'font-semibold text-bad')}>{m.actual ? fmtDate(m.actual) : 'Pending'}</div>
  </div>
);

export default function Procurement() {
  const { filters, hasDetail } = useScoped();
  const sp = useSearchParams();
  const [critical, setCritical] = useState(sp.get('critical') === '1');
  const rows = PROCUREMENT.filter((p) => (filters.discipline === 'All' || p.discipline === filters.discipline) && (!critical || (p.critical && !poReleased(p))));
  const cols: Column<PoRow>[] = [
    { key: 'pkg', label: 'Package', sortValue: (p) => p.pkg, render: (p) => <span className="font-semibold">{p.pkg}</span> },
    { key: 'cat', label: 'Category', sortValue: (p) => p.category, render: (p) => p.category },
    { key: 'eng', label: 'Engineering inputs', render: (p) => ms(p.eng) },
    { key: 'tender', label: 'Tender', render: (p) => ms(p.tender) },
    { key: 'tech', label: 'Technical evaluation', render: (p) => ms(p.tech) },
    { key: 'comm', label: 'Sent to commercial', render: (p) => ms(p.commercial) },
    { key: 'po', label: 'PO release', render: (p) => ms(p.po) },
    { key: 'flags', label: 'Flags', sortValue: (p) => Number(poDelayed(p)) + Number(p.critical), render: (p) => (
      <div className="flex flex-col items-start gap-1">
        {poDelayed(p) && <Chip tone="bad">Delayed</Chip>}
        {p.critical && <Chip tone="warn">Critical PO</Chip>}
        {!poDelayed(p) && !p.critical && <Chip tone="good">On plan</Chip>}
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Procurement" lede="PO totals, the balance pipeline and every package against its planned dates." />
      {!hasDetail ? <EmptyState title="No procurement data for this project" hint="Select Belgaum expansion in the project list to see its packages." /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-4 md:col-span-6 xl:col-span-12 xl:grid-cols-4">
            <Kpi label="Total POs" value={PO_TOTALS.total} />
            <Kpi label="Planned" value={PO_TOTALS.planned} />
            <Kpi label="Released" value={PO_TOTALS.released} note={`${fmtPct(poReleasedPct(PO_TOTALS.released, PO_TOTALS.total))} of total`} />
            <Kpi label="Critical POs" value={PROCUREMENT.filter((p) => p.critical && !poReleased(p)).length} tone="bad" href="/procurement?critical=1" />
          </div>
          <Tile title="POs by category" className="md:col-span-6 xl:col-span-7">
            <Bars label="Total, planned and released POs by category" xKey="name" height={260} data={PO_CATEGORIES}
              series={[{ key: 'total', name: 'Total', color: C.tint }, { key: 'planned', name: 'Planned', color: C.graphite }, { key: 'released', name: 'Released', color: C.ink }]} />
          </Tile>
          <Tile title="Balance PO pipeline by stage" className="md:col-span-6 xl:col-span-5">
            <Bars label="Balance POs by stage" xKey="name" horizontal height={260} highlight="Sent to commercial" data={PO_PIPELINE} series={[{ key: 'value', name: 'POs', color: C.graphite }]} />
          </Tile>
          <section className="md:col-span-6 xl:col-span-12" aria-label="Package tracker">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Package tracker</h2>
              <button type="button" aria-pressed={critical} onClick={() => setCritical(!critical)} className={clsx('h-8 rounded-full border px-3 text-sm font-medium', critical ? 'border-ink bg-brand' : 'border-line bg-white')}>Critical POs only</button>
            </div>
            <DataTable cols={cols} rows={rows} rowKey={(p) => p.id} caption="Package tracker with planned and actual dates" empty={<EmptyState title="No packages match" hint="Turn off the critical filter or change the discipline." />} />
          </section>
        </div>
      )}
    </>
  );
}
