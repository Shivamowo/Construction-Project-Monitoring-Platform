'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DISCIPLINE_QTY, PROCUREMENT, PROJECTS } from '@/data/seed';
import { useScoped, useStore } from '@/lib/store';
import { daysRemaining, fmtDate, fmtNum, fmtPct, poReleased, varianceDays } from '@/lib/metrics';
import { Bars, C, Donut } from '@/components/charts';
import { IndiaMap } from '@/components/IndiaMap';
import { DataTable, type Column } from '@/components/DataTable';
import { Chip, EmptyState, Kpi, PageHeader, Tile, statusTone } from '@/components/ui';
import type { Project, Status } from '@/lib/types';

const STATUSES: Status[] = ['On track', 'At risk', 'Delay', 'Not started'];
const SCOL: Record<Status, string> = { 'On track': C.good, 'At risk': C.warn, Delay: C.bad, 'Not started': C.tint };

export default function Portfolio() {
  const router = useRouter();
  const sp = useSearchParams();
  const { filters, setFilters } = useStore();
  const { actions, risks } = useScoped();
  const pid = filters.projectId;
  const statusFilter = sp.get('status');
  const within = sp.get('within') === '1';

  const openActions = actions.filter((a) => a.status !== 'Closed').length;
  const highRisks = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High').length;
  const criticalPOs = PROCUREMENT.filter((p) => p.critical && !poReleased(p) && (pid === 'all' || p.projectId === pid) && (filters.discipline === 'All' || p.discipline === filters.discipline)).length;
  const pool = pid === 'all' ? PROJECTS : PROJECTS.filter((p) => p.id === pid);
  const isWithin = (p: Project) => p.status !== 'Delay' && varianceDays(p.baselineFinish, p.forecastFinish) <= 0;
  const withinCount = PROJECTS.filter(isWithin).length;

  const rows = PROJECTS.filter((p) => (!statusFilter || p.status === statusFilter) && (!within || isWithin(p)));
  const cols: Column<Project>[] = [
    { key: 'name', label: 'Project', sortValue: (p) => p.name, render: (p) => (
      <button type="button" className="text-left font-semibold underline-offset-2 hover:underline" onClick={() => { setFilters({ projectId: p.id }); router.push('/scorecard'); }}>
        {pid === p.id && <span aria-hidden className="mr-2 inline-block h-2.5 w-2.5 bg-brand align-baseline outline outline-1 outline-ink" />}{p.name}
      </button>) },
    { key: 'status', label: 'Status', sortValue: (p) => p.status, render: (p) => <Chip tone={statusTone(p.status)}>{p.status}</Chip> },
    { key: 'plan', label: 'Plan', num: true, sortValue: (p) => p.planPct, render: (p) => fmtPct(p.planPct, 1) },
    { key: 'actual', label: 'Actual', num: true, sortValue: (p) => p.actualPct, render: (p) => fmtPct(p.actualPct, 1) },
    { key: 'start', label: 'Start', sortValue: (p) => p.start, render: (p) => fmtDate(p.start) },
    { key: 'exec', label: 'Execution start', sortValue: (p) => p.execStart, render: (p) => fmtDate(p.execStart) },
    { key: 'base', label: 'Baseline finish', sortValue: (p) => p.baselineFinish, render: (p) => fmtDate(p.baselineFinish) },
    { key: 'fc', label: 'Forecast finish', sortValue: (p) => p.forecastFinish, render: (p) => fmtDate(p.forecastFinish) },
    { key: 'rem', label: 'Days remaining', num: true, sortValue: (p) => daysRemaining(p.forecastFinish), render: (p) => {
      const d = daysRemaining(p.forecastFinish);
      return d < 0 ? <span className="text-bad">{fmtNum(Math.abs(d))} days past forecast</span> : `${fmtNum(d)} days`;
    } },
  ];

  return (
    <>
      <PageHeader title="Portfolio" lede="Status of every project, with the numbers that need attention first." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
        <Tile title="Project locations" className="md:col-span-3 xl:col-span-5">
          <IndiaMap selected={pid} onSelect={(id) => setFilters({ projectId: id })} />
        </Tile>
        <Tile title="Projects by status" className="md:col-span-3 xl:col-span-3">
          <Donut total={PROJECTS.length} data={STATUSES.map((s) => ({ name: s, value: PROJECTS.filter((p) => p.status === s).length, color: SCOL[s] }))} href={(n) => `/?status=${encodeURIComponent(n)}#projects`} />
        </Tile>
        <div className="grid grid-cols-2 gap-4 md:col-span-6 xl:col-span-4">
          <Kpi label="Actions open" value={openActions} href="/actions?state=Active" />
          <Kpi label="Critical POs" value={criticalPOs} href="/procurement?critical=1" tone={criticalPOs ? 'bad' : undefined} />
          <Kpi label="High risks" value={highRisks} href="/risks?state=Active&rating=High" tone={highRisks ? 'bad' : undefined} />
          <Kpi label="Within timeline" value={`${withinCount} of ${PROJECTS.length}`} href="/?within=1#projects" note="Forecast on or before baseline" />
        </div>
        {DISCIPLINE_QTY.map((d) => (
          <Tile key={d.name} title={d.name} className="md:col-span-2 xl:col-span-4">
            <Bars label={`${d.name}: scope, drawing plan, drawing received, cumulative plan, cumulative actual`} xKey="k" highlight="Cum actual" height={190} unit={` ${d.unit}`}
              series={[{ key: 'v', name: d.name, color: C.graphite }]}
              data={[['Scope', d.scope], ['Drawing plan', d.drawingPlan], ['Drawing rec.', d.drawingReceived], ['Cum plan', d.cumPlan], ['Cum actual', d.cumActual]].map(([k, v]) => ({ k, v }))} />
          </Tile>
        ))}
        <section id="projects" className="scroll-mt-20 md:col-span-6 xl:col-span-12" aria-label="Project detail">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Project detail</h2>
            {(statusFilter || within) && (
              <button type="button" onClick={() => router.push('/')} className={clsx('inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold')}>
                {within ? 'Within timeline' : statusFilter}: clear filter
              </button>
            )}
          </div>
          <DataTable cols={cols} rows={rows} rowKey={(p) => p.id} caption="Project detail" maxH="max-h-[420px]" rowClass={(p) => (pool.includes(p) && pid !== 'all' ? 'bg-mist' : undefined)}
            empty={<EmptyState title="No projects match this filter" hint="Clear the filter to see all four projects." />} />
        </section>
      </div>
    </>
  );
}
