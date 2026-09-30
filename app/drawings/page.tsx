'use client';
import { useState } from 'react';
import { DRAWING_TRACKER, DRAWING_TYPES } from '@/data/seed';
import { useScoped } from '@/lib/store';
import { drawingPct, fmtNum, fmtPct } from '@/lib/metrics';
import { Gauge } from '@/components/charts';
import { DataTable, type Column } from '@/components/DataTable';
import { EmptyState, PageHeader, inputCls } from '@/components/ui';
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
    { key: 'b', label: 'Building', sortValue: (r) => r.building, render: (r) => <span className="font-semibold">{r.building}</span> },
    { key: 'sc', label: 'Scope', num: true, sortValue: (r) => r.scope, render: (r) => fmtNum(r.scope) },
    { key: 'p', label: 'Plan', num: true, sortValue: (r) => r.plan, render: (r) => fmtNum(r.plan) },
    { key: 'r', label: 'Received', num: true, sortValue: (r) => r.received, render: (r) => fmtNum(r.received) },
    { key: 'v', label: 'Variance', num: true, sortValue: (r) => r.received - r.plan, render: (r) => <span className={r.received < r.plan ? 'font-semibold text-bad' : 'text-good'}>{signed(r.received - r.plan)}</span> },
    { key: 'pct', label: 'Received of scope', num: true, sortValue: (r) => drawingPct(r.received, r.scope), render: (r) => fmtPct(drawingPct(r.received, r.scope)) },
  ];
  return (
    <>
      <PageHeader title="Drawings" lede="Drawings received against plan, by type and by building." />
      {!hasDetail ? <EmptyState title={`No drawing data for ${active.name}`} hint="Select Belgaum expansion in the project list to see its drawing status." /> : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {types.map((d) => (
              <Gauge key={d.name} name={d.name} pct={drawingPct(d.received, d.scope)} rows={[['Scope', fmtNum(d.scope)], ['Plan', fmtNum(d.plan)], ['Received', fmtNum(d.received)], ['Variance', signed(d.received - d.plan)]]} />
            ))}
            {!types.length && <EmptyState title="No drawing types for this discipline" hint="Set the discipline filter to All disciplines." />}
          </div>
          <h2 className="mb-3 mt-6 text-lg font-semibold">Tracker by section and building</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <select aria-label="Section" value={section} onChange={(e) => setSection(e.target.value)} className={`${inputCls} w-auto`}>
              <option value="">Section: all</option>{[...new Set(DRAWING_TRACKER.map((r) => r.section))].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select aria-label="Building" value={building} onChange={(e) => setBuilding(e.target.value)} className={`${inputCls} w-auto`}>
              <option value="">Building: all</option>{DRAWING_TRACKER.map((r) => <option key={r.id}>{r.building}</option>)}
            </select>
          </div>
          <DataTable cols={cols} rows={rows} rowKey={(r) => r.id} caption="Drawing tracker" empty={<EmptyState title="No buildings match" hint="Clear the section or building filter." />} />
        </>
      )}
    </>
  );
}
