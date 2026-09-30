'use client';
import { useState } from 'react';
import { useScoped } from '@/lib/store';
import { drawingPct } from '@/lib/metrics';
import { num, pct } from '@/lib/format';
import { DataTable, type Column } from '@/components/DataTable';
import { DivergingBars } from '@/components/viz';
import { BigStat, EmptyState, FilterBar, KpiCard, KpiRow, PillSelect, StripeBar, Tile, VarianceChip, toneFor } from '@/components/ui';
import type { DrawingRow } from '@/lib/types';

export default function Drawings() {
  const { filters, hasDetail, active, drawings } = useScoped();
  const [section, setSection] = useState('');
  const [building, setBuilding] = useState('');
  const { types: allTypes, tracker } = drawings;
  const types = allTypes.filter((d) => filters.discipline === 'All' || d.discipline === filters.discipline);
  const rows = tracker.filter((r) => (!section || r.section === section) && (!building || r.building === building) && (filters.discipline === 'All' || r.discipline === filters.discipline));
  const behind = rows.filter((r) => r.plan - r.received > 0).length, ahead = rows.filter((r) => r.plan - r.received < 0).length;
  const scope = rows.reduce((s, r) => s + r.scope, 0), rec = rows.reduce((s, r) => s + r.received, 0);
  const cols: Column<DrawingRow>[] = [
    { key: 's', label: 'Section', w: '14%', sortValue: (r) => r.section, render: (r) => r.section },
    { key: 'b', label: 'Building', w: '22%', sortValue: (r) => r.building, render: (r) => <span className="w5">{r.building}</span> },
    { key: 'sc', label: 'Scope', w: '10%', num: true, sortValue: (r) => r.scope, render: (r) => num(r.scope) },
    { key: 'p', label: 'Plan', w: '10%', num: true, sortValue: (r) => r.plan, render: (r) => num(r.plan) },
    { key: 'r', label: 'Received', w: '10%', num: true, sortValue: (r) => r.received, render: (r) => num(r.received) },
    { key: 'v', label: 'Variance', w: '14%', sortValue: (r) => r.plan - r.received, render: (r) => <VarianceChip plan={r.plan} received={r.received} /> },
    { key: 'pct', label: 'Received against plan', w: '20%', sortValue: (r) => drawingPct(r.received, r.plan), render: (r) => (
      <div className="flex items-center gap-3"><StripeBar label={`${r.building} received`} value={drawingPct(r.received, r.scope)} plan={drawingPct(r.plan, r.scope)} color={toneFor(r.received, r.plan)} /><span className="caption ink tabular" style={{ minWidth: 36, textAlign: 'right' }}>{Math.round(drawingPct(r.received, r.scope))}%</span></div>) },
  ];
  if (!hasDetail) return <EmptyState title={`No drawing data is loaded for ${active.name}. Select Belgaum expansion to see its drawing status.`} />;
  return (
    <>
      <KpiRow n={4}>
        <KpiCard label="Buildings tracked" value={rows.length} rail="neutral" context={`${new Set(rows.map((r) => r.section)).size} sections`} />
        <KpiCard label="Received of scope" value={pct(drawingPct(rec, scope))} rail="neutral" context={`${num(rec)} of ${num(scope)}`} />
        <KpiCard label="Behind plan" value={behind} rail={behind ? 'caution' : 'good'} context="Fewer received than planned" />
        <KpiCard label="Ahead of plan" value={ahead} rail="good" context="More received than planned" />
      </KpiRow>
      <div className="stack">
        <Tile surface title="Variance by building" action={<span className="caption">Plan minus received, most behind first</span>}>
          {rows.length ? <DivergingBars rows={rows.map((r) => ({ label: r.building, plan: r.plan, received: r.received }))} /> : <EmptyState title="No buildings match. Clear the section or building filter." />}
        </Tile>
        <div className="grid12">
          {types.map((d) => {
            const p = drawingPct(d.received, d.scope);
            return (
              <Tile key={d.name} surface title={d.name} className="c4">
                <div className="flex flex-col gap-4">
                  <BigStat label="Received of scope" value={Math.round(p)} unit="%" />
                  <StripeBar label={`${d.name} received`} value={p} plan={drawingPct(d.plan, d.scope)} color="yellow" />
                  <dl className="small m-0 grid grid-cols-[1fr_auto] items-center gap-y-2">
                    {[['Scope', num(d.scope)], ['Plan', num(d.plan)], ['Received', num(d.received)]].map(([k, v]) => <div key={k} className="contents"><dt className="muted">{k}</dt><dd className="m-0 text-right tabular">{v}</dd></div>)}
                    <dt className="muted">Variance</dt><dd className="m-0 text-right"><VarianceChip plan={d.plan} received={d.received} /></dd>
                  </dl>
                </div>
              </Tile>
            );
          })}
        </div>
        {!types.length && <EmptyState title="No drawing types for this discipline. Set the discipline filter to All disciplines." />}
        <FilterBar active={(section ? 1 : 0) + (building ? 1 : 0)}>
          <PillSelect label="Section" value={section} onChange={setSection} options={[{ v: '', l: 'Section: all' }, ...[...new Set(tracker.map((r) => r.section))].map((s) => ({ v: s, l: s }))]} />
          <PillSelect label="Building" value={building} onChange={setBuilding} options={[{ v: '', l: 'Building: all' }, ...tracker.map((r) => ({ v: r.building, l: r.building }))]} />
        </FilterBar>
        <DataTable title="Drawing tracker" cols={cols} rows={rows} rowKey={(r) => r.id} caption="Drawing tracker by section and building" empty={<EmptyState title="No buildings match. Clear the section or building filter." action={{ label: 'Clear filters', onClick: () => { setSection(''); setBuilding(''); } }} />} />
      </div>
    </>
  );
}
