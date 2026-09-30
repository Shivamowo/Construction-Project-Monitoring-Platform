'use client';
import { useState } from 'react';
import { DRAWING_TRACKER, DRAWING_TYPES } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { drawingPct, fmtNum } from '@/lib/metrics';
import { DataTable, type Column } from '@/components/DataTable';
import { BigStat, EmptyState, FilterBar, PillSelect, StripeBar, Tile, toneFor } from '@/components/ui';
import type { DrawingRow } from '@/lib/types';

const signed = (n: number) => (n > 0 ? `+${fmtNum(n)}` : fmtNum(n));

export default function Drawings() {
  const { filters, hasDetail, active } = useScoped();
  const [section, setSection] = useState('');
  const [building, setBuilding] = useState('');
  const types = DRAWING_TYPES.filter((d) => filters.discipline === 'All' || d.discipline === filters.discipline);
  const rows = DRAWING_TRACKER.filter((r) => (!section || r.section === section) && (!building || r.building === building) && (filters.discipline === 'All' || r.discipline === filters.discipline));
  const cols: Column<DrawingRow>[] = [
    { key: 's', label: 'Section', sortValue: (r) => r.section, render: (r) => r.section },
    { key: 'b', label: 'Building', sortValue: (r) => r.building, render: (r) => <span className="font-medium">{r.building}</span> },
    { key: 'sc', label: 'Scope', num: true, sortValue: (r) => r.scope, render: (r) => fmtNum(r.scope) },
    { key: 'p', label: 'Plan', num: true, sortValue: (r) => r.plan, render: (r) => fmtNum(r.plan) },
    { key: 'r', label: 'Received', num: true, sortValue: (r) => r.received, render: (r) => fmtNum(r.received) },
    { key: 'v', label: 'Variance', num: true, sortValue: (r) => r.received - r.plan, render: (r) => <span className={r.received < r.plan ? 'text-bad' : 'text-good'}>{signed(r.received - r.plan)}</span> },
    { key: 'pct', label: 'Received against plan', sortValue: (r) => drawingPct(r.received, r.plan), render: (r) => (
      <div className="flex min-w-[160px] items-center gap-3"><StripeBar label={`${r.building} received`} value={drawingPct(r.received, r.scope)} plan={drawingPct(r.plan, r.scope)} color={toneFor(r.received, r.plan)} /><span className="w-10 text-right text-xs">{Math.round(drawingPct(r.received, r.scope))}%</span></div>) },
  ];
  if (!hasDetail) return <EmptyState title={`No drawing data is loaded for ${active.name}. Select Belgaum expansion to see its drawing status.`} />;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {types.map((d) => {
          const p = drawingPct(d.received, d.scope);
          return (
            <Tile key={d.name}>
              <div className="mb-3 text-sm font-medium">{d.name}</div>
              <BigStat label="Received of scope" value={Math.round(p)} unit="%" href="/drawings" />
              <div className="my-4"><StripeBar label={`${d.name} received`} value={p} plan={drawingPct(d.plan, d.scope)} color="yellow" /></div>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-xs">
                {[['Scope', fmtNum(d.scope)], ['Plan', fmtNum(d.plan)], ['Received', fmtNum(d.received)], ['Variance', signed(d.received - d.plan)]].map(([k, v]) => <div key={k} className="contents"><dt className="text-sub">{k}</dt><dd className="text-right">{v}</dd></div>)}
              </dl>
            </Tile>
          );
        })}
        {!types.length && <EmptyState title="No drawing types for this discipline. Set the discipline filter to All disciplines." />}
      </div>
      <FilterBar active={(section ? 1 : 0) + (building ? 1 : 0)}>
        <PillSelect label="Section" value={section} onChange={setSection} options={[{ v: '', l: 'Section: all' }, ...[...new Set(DRAWING_TRACKER.map((r) => r.section))].map((s) => ({ v: s, l: s }))]} />
        <PillSelect label="Building" value={building} onChange={setBuilding} options={[{ v: '', l: 'Building: all' }, ...DRAWING_TRACKER.map((r) => ({ v: r.building, l: r.building }))]} />
      </FilterBar>
      <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} caption="Drawing tracker by section and building" empty={<EmptyState title="No buildings match. Clear the section or building filter." action={{ label: 'Clear filters', onClick: () => { setSection(''); setBuilding(''); } }} />} />
    </div>
  );
}
