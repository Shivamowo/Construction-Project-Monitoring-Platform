'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useScoped, useStore } from '@/lib/store';
import { daysRemaining, isOverdue, poReleased, varianceDays } from '@/lib/metrics';
import { dateLong, dateShort, num } from '@/lib/format';
import { Donut, Ring } from '@/components/charts';
import { BulletBar } from '@/components/viz';
import { BigStat, DarkPanel, DetailPane, InnerTile, MasterRow, StripeBar, Tile, statusTone, toneFor } from '@/components/ui';
import type { Project, Status } from '@/lib/types';

const GROUPS = ['On track', 'At risk', 'Delay', 'Planned'] as const;
const GCOL: Record<(typeof GROUPS)[number], string> = { 'On track': '#168736', 'At risk': '#E08A1E', Delay: '#B9251C', Planned: '#9AA0AE' };
const groupOf = (p: Project) => (p.phase === 'Planned' ? 'Planned' : p.status);
const TAB_STATUS: Record<string, Status | null> = { all: null, Delay: 'Delay', 'At risk': 'At risk', 'On track': 'On track' };

export default function Portfolio() {
  const sp = useSearchParams();
  const { filters, setFilters } = useStore();
  const { actions, risks, active, projects, procurement, contractors } = useScoped();
  const [attn, setAttn] = useState('po');
  const [tab, setTab] = useState(sp.get('status') && TAB_STATUS[sp.get('status')!] !== undefined ? sp.get('status')! : 'all');
  useEffect(() => { const s = sp.get('status'); if (s && TAB_STATUS[s] !== undefined) setTab(s); }, [sp]);

  const rem = daysRemaining(active.forecastFinish);
  const critical = procurement.rows.filter((p) => p.critical && !poReleased(p) && (filters.projectId === 'all' || p.projectId === filters.projectId));
  const highRisks = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High');
  const overdue = actions.filter(isOverdue);
  const groups = [
    { id: 'po', label: 'Critical POs', href: '/procurement?critical=1', items: critical.map((p) => ({ k: p.id, t: p.pkg, s: `${p.category} package` })) },
    { id: 'risk', label: 'High risks', href: '/risks?status=Not%20closed&rating=High', items: highRisks.map((r) => ({ k: r.id, t: r.title, s: `Owner: ${r.owner}` })) },
    { id: 'act', label: 'Overdue actions', href: '/actions?status=Overdue', items: overdue.map((a) => ({ k: a.id, t: a.title, s: `Due ${dateShort(a.dueDate)}` })) },
  ];
  const list = projects.filter((p) => !TAB_STATUS[tab] || p.status === TAB_STATUS[tab]);
  const sel = list.find((p) => p.id === filters.projectId) ?? list[0];
  const v = sel ? varianceDays(sel.baselineFinish, sel.forecastFinish) : 0;

  return (
    <div className="stack">
      <div className="grid12">
        <Tile surface title="Overall completion" className="c4" action={<span className="caption">{active.name}</span>}>
          <div className="flex flex-wrap items-center gap-6">
            <Ring actual={active.actualPct} plan={active.planPct} />
            <div className="flex flex-col gap-4">
              <BigStat size="title-sm" label="Gap to plan" value={(active.actualPct - active.planPct).toFixed(1)} unit="pts" tone={active.actualPct < active.planPct ? 'bad' : 'good'} />
              <BigStat size="title-sm" label={rem < 0 ? 'Days past forecast' : 'Days remaining'} value={num(Math.abs(rem))} unit="days" tone={rem < 0 ? 'bad' : undefined} href="/scorecard" />
            </div>
          </div>
        </Tile>
        <Tile surface title="Discipline progress" className="c8" action={<span className="caption">Bar: actual. Tick: plan. Shaded: within 10% of plan.</span>}>
          <div className="stack">
            {contractors.quantities.map((d) => (
              <BulletBar key={d.name} label={d.name} actual={(d.cumActual / d.scope) * 100} plan={(d.cumPlan / d.scope) * 100}
                detail={`${num(d.cumActual)} of ${num(d.scope)} ${d.unit}; drawings received for ${num(d.drawingReceived)} ${d.unit}`} />
            ))}
          </div>
        </Tile>
        <Tile surface title="Projects by status" className="c5">
          <Donut dark={false} total={projects.length} data={GROUPS.map((g) => ({ name: g, value: projects.filter((p) => groupOf(p) === g).length, color: GCOL[g] }))} href={(n) => (n === 'Planned' ? '/?portfolio=Planned' : `/portfolio?status=${encodeURIComponent(n)}`)} />
        </Tile>
        <Tile title="Needs attention" className="c7">
          <div className="flex flex-col gap-2">
            {groups.map((g) => {
              const on = attn === g.id;
              return (
                <div key={g.id} className="rounded-2xl" style={{ background: on ? 'var(--yellow)' : 'var(--surface)' }}>
                  <button type="button" onClick={() => setAttn(g.id)} aria-expanded={on} className="qa w-full" style={{ background: 'transparent' }}>
                    {g.label}<span className={clsx('n')} style={on ? undefined : { background: 'var(--tile)', color: 'var(--text)' }}>{g.items.length}</span>
                  </button>
                  {on && (
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      {g.items.length ? (
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">{g.items.slice(0, 3).map((i) => <li key={i.k} className="inner flex flex-col gap-1" style={{ background: 'var(--surface)' }}><p className="small w5">{i.t}</p><p className="caption">{i.s}</p></li>)}</ul>
                      ) : <p className="small">Nothing here. Change the project or discipline filter to see more.</p>}
                      <Link href={g.href} className="btn w-fit" style={{ background: 'var(--text)', color: '#fff' }}>Open register</Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Tile>
      </div>

      <DarkPanel title="Projects" tabs={[{ id: 'all', label: 'All projects', count: projects.length }, ...(['Delay', 'At risk', 'On track'] as Status[]).map((s) => ({ id: s, label: s, count: projects.filter((p) => p.status === s).length }))]} tab={tab} onTab={setTab}>
        <div className="md-grid">
          <ul className="m-0 flex max-h-[640px] list-none flex-col gap-2 overflow-y-auto p-0" aria-label="Projects">
            {list.map((p) => <li key={p.id}><MasterRow selected={p.id === sel?.id} onClick={() => setFilters({ projectId: p.id })} title={p.name} id={p.state} age={`forecast ${dateLong(p.forecastFinish)}`} status={{ label: groupOf(p), tone: p.phase === 'Planned' ? 'info' : statusTone(p.status) }} figure={`${p.actualPct}%`} /></li>)}
            {!list.length && <li className="small muted">No projects have this status. Pick another tab.</li>}
          </ul>
          {sel && (
            <DetailPane title={sel.name} status={{ label: sel.status, tone: statusTone(sel.status) }}
              footer={<><span className="small" style={{ color: 'var(--fog)' }}>Actual {sel.actualPct}% against plan {sel.planPct}%</span><Link href="/scorecard" onClick={() => setFilters({ projectId: sel.id })} className="btn-primary">Open scorecard</Link></>}>
              <div className="grid gap-4 sm:grid-cols-3">
                <BigStat size="title-sm" label="Plan" value={sel.planPct} unit="%" />
                <BigStat size="title-sm" label="Actual" value={sel.actualPct} unit="%" />
                <BigStat size="title-sm" label="Variance" value={v > 0 ? `+${v}` : v} unit="days" tone={v > 0 ? 'bad' : 'good'} />
              </div>
              <StripeBar label="Actual against plan" value={sel.actualPct} plan={sel.planPct} color={toneFor(sel.actualPct, sel.planPct)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <InnerTile label="Start">{dateLong(sel.start)}</InnerTile>
                <InnerTile label="Execution start">{dateLong(sel.execStart)}</InnerTile>
                <InnerTile label="Baseline finish">{dateLong(sel.baselineFinish)}</InnerTile>
                <InnerTile label="Forecast finish">{dateLong(sel.forecastFinish)}</InnerTile>
              </div>
            </DetailPane>
          )}
        </div>
      </DarkPanel>
    </div>
  );
}
