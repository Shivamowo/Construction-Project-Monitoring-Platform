'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { DISCIPLINE_QTY, PROCUREMENT, PROJECTS } from '@/data/seed';
import { useScoped, useStore } from '@/lib/store';
import { daysRemaining, fmtDate, fmtNum, isOverdue, poReleased, varianceDays } from '@/lib/metrics';
import { C, Donut } from '@/components/charts';
import { IndiaMap } from '@/components/IndiaMap';
import { BigStat, DarkPanel, DetailPane, InnerTile, MasterRow, StripeBar, Tile, statusTone, toneFor } from '@/components/ui';
import type { Status } from '@/lib/types';

const SCOL: Record<Status, string> = { 'On track': '#7FD99A', 'At risk': '#FFB866', Delay: '#FF9A92', 'Not started': '#747480' };
const STATUSES: Status[] = ['On track', 'At risk', 'Delay', 'Not started'];
const TAB_STATUS: Record<string, Status | null> = { all: null, Delay: 'Delay', 'At risk': 'At risk', 'On track': 'On track' };

export default function Portfolio() {
  const sp = useSearchParams();
  const { filters, setFilters } = useStore();
  const { actions, risks, active } = useScoped();
  const [attn, setAttn] = useState('po');
  const [tab, setTab] = useState(sp.get('status') && TAB_STATUS[sp.get('status')!] !== undefined ? sp.get('status')! : 'all');
  useEffect(() => { const s = sp.get('status'); if (s && TAB_STATUS[s] !== undefined) setTab(s); }, [sp]);

  const rem = daysRemaining(active.forecastFinish);
  const critical = PROCUREMENT.filter((p) => p.critical && !poReleased(p) && (filters.projectId === 'all' || p.projectId === filters.projectId));
  const highRisks = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High');
  const overdue = actions.filter(isOverdue);
  const groups = [
    { id: 'po', label: 'Critical POs', href: '/procurement?critical=1', items: critical.map((p) => ({ k: p.id, t: p.pkg, s: `${p.category} package` })) },
    { id: 'risk', label: 'High risks', href: '/risks?state=Active&rating=High', items: highRisks.map((r) => ({ k: r.id, t: r.title, s: `Owner ${r.owner}` })) },
    { id: 'act', label: 'Overdue actions', href: '/actions?flag=Overdue', items: overdue.map((a) => ({ k: a.id, t: a.title, s: `Due ${fmtDate(a.dueDate)}` })) },
  ];

  const list = PROJECTS.filter((p) => !TAB_STATUS[tab] || p.status === TAB_STATUS[tab]);
  const sel = list.find((p) => p.id === filters.projectId) ?? list[0];
  const v = sel ? varianceDays(sel.baselineFinish, sel.forecastFinish) : 0;
  const r = sel ? daysRemaining(sel.forecastFinish) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Tile className="lg:col-span-2">
          <p className="mb-4 text-base font-medium">{active.name}</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <BigStat label="Plan" value={active.planPct} unit="%" href="/scorecard" />
            <BigStat label="Actual" value={active.actualPct} unit="%" href="/scorecard" delta={`${(active.actualPct - active.planPct).toFixed(1)} pts`} deltaTone={active.actualPct < active.planPct ? 'bad' : 'good'} />
            <BigStat label={rem < 0 ? 'Days past forecast' : 'Days remaining'} value={fmtNum(Math.abs(rem))} unit="days" tone={rem < 0 ? 'bad' : undefined} href="/scorecard" />
          </div>
          <div className="mt-5"><StripeBar label="Actual progress against plan" value={active.actualPct} plan={active.planPct} color={toneFor(active.actualPct, active.planPct)} /></div>
          <div className="mt-6 flex flex-col gap-4">
            {DISCIPLINE_QTY.map((d) => {
              const a = (d.cumActual / d.scope) * 100, p = (d.cumPlan / d.scope) * 100;
              return (
                <div key={d.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between text-sm"><span>{d.name}</span><span className="font-medium">{a.toFixed(1)}% of scope</span></div>
                  <StripeBar label={`${d.name} actual`} value={a} plan={p || undefined} color="yellow" />
                </div>
              );
            })}
          </div>
        </Tile>
        <Tile title="Needs attention">
          <div className="flex flex-col gap-2">
            {groups.map((g) => {
              const on = attn === g.id;
              return (
                <div key={g.id} className={clsx('rounded-lg', on ? 'bg-brand' : 'bg-surface')}>
                  <button type="button" onClick={() => setAttn(g.id)} aria-expanded={on} className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium">
                    {g.label}<span className={clsx('flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs', on ? 'bg-ink text-white' : 'bg-tile')}>{g.items.length}</span>
                  </button>
                  {on && (
                    <div className="px-4 pb-4">
                      {g.items.length ? (
                        <ul className="flex flex-col gap-2">{g.items.slice(0, 3).map((i) => <li key={i.k} className="rounded-lg bg-surface p-3 text-sm"><p className="font-medium">{i.t}</p><p className="text-xs text-sub">{i.s}</p></li>)}</ul>
                      ) : <p className="text-sm">Nothing here. Change the project or discipline filter to see more.</p>}
                      <Link href={g.href} className="mt-3 inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-medium text-white">Open register</Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Tile>
      </div>

      <DarkPanel tabs={[{ id: 'all', label: 'All projects', count: PROJECTS.length }, ...(['Delay', 'At risk', 'On track'] as Status[]).map((s) => ({ id: s, label: s, count: PROJECTS.filter((p) => p.status === s).length }))]} tab={tab} onTab={setTab}>
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <ul className="flex flex-col gap-2" aria-label="Projects">
            {list.map((p) => <li key={p.id}><MasterRow selected={p.id === sel?.id} onClick={() => setFilters({ projectId: p.id })} title={p.name} id={p.state} age={`forecast ${fmtDate(p.forecastFinish)}`} status={{ label: p.status, tone: statusTone(p.status) }} figure={`${p.actualPct}%`} />
            </li>)}
            {!list.length && <li className="text-sm text-fog">No projects have this status. Pick another tab.</li>}
          </ul>
          {sel && (
            <DetailPane title={sel.name} status={{ label: sel.status, tone: statusTone(sel.status) }}
              footer={<><span className="text-sm text-fog">Actual {sel.actualPct}% against plan {sel.planPct}%</span><Link href="/scorecard" onClick={() => setFilters({ projectId: sel.id })} className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-medium text-ink">Open scorecard</Link></>}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-white/10 p-3">
                  <Donut total={PROJECTS.length} data={STATUSES.map((s) => ({ name: s, value: PROJECTS.filter((p) => p.status === s).length, color: SCOL[s] }))} href={(n) => `/?status=${encodeURIComponent(n)}`} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-lg bg-white/10 p-3">
                  <BigStat size="title-sm" label="Plan" value={sel.planPct} unit="%" />
                  <BigStat size="title-sm" label="Actual" value={sel.actualPct} unit="%" />
                  <BigStat size="title-sm" label="Variance" value={v > 0 ? `+${v}` : v} unit="days" tone={v > 0 ? 'bad' : 'good'} />
                  <BigStat size="title-sm" label={r < 0 ? 'Past forecast' : 'Remaining'} value={fmtNum(Math.abs(r))} unit="days" tone={r < 0 ? 'bad' : undefined} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <InnerTile label="Baseline finish">{fmtDate(sel.baselineFinish)}</InnerTile>
                <InnerTile label="Forecast finish">{fmtDate(sel.forecastFinish)}</InnerTile>
                <div className="row-span-2 rounded-lg bg-surface p-2 sm:row-span-1"><div className="w-[150px] max-w-full"><IndiaMap selected={sel.id} onSelect={(id) => setFilters({ projectId: id })} /></div></div>
                <InnerTile label="Start">{fmtDate(sel.start)}</InnerTile>
                <InnerTile label="Execution start">{fmtDate(sel.execStart)}</InnerTile>
              </div>
            </DetailPane>
          )}
        </div>
      </DarkPanel>
    </div>
  );
}
