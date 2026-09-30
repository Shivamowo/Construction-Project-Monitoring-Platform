'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useScoped } from '@/lib/store';
import { ageing, isOverdue } from '@/lib/metrics';
import { dateShort } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { Register, type Col, type RegFilter, type RegTab } from '@/components/Register';
import { AgeingCell, Button, KpiCard, KpiRow, OwnerCell, Tile, inputCls } from '@/components/ui';
import { Bars, C } from '@/components/charts';
import { AGE_BINS, ageBin } from '@/lib/health';
import { WorkloadBar } from '@/components/viz';
import type { ActionItem } from '@/lib/types';

const ROLES = ['Project team', 'Civil team', 'Site team', 'Commercial', 'Client representative', 'Contractor representative'];
const CATS = ['Construction', 'Procurement', 'Engineering'];
const STATUS: ActionItem['status'][] = ['Open', 'In progress', 'Closed'];
const DISC = ['Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];

function Comments({ a }: { a: ActionItem }) {
  const { updateRow, toast } = useScoped();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return toast('Write a comment before adding it.', 'error');
    updateRow('actions', a.id, { comments: [...a.comments, { by: 'You', at: REPORT_DATE, text: text.trim() }] });
    setText(''); toast('Comment added');
  };
  return (
    <div>
      <h4 className="label mb-2">Comments ({a.comments.length})</h4>
      {a.comments.length ? (
        <ul className="mb-3 mt-0 flex list-none flex-col gap-2 p-0">{a.comments.map((c, i) => <li key={i} className="inner small"><span className="caption tabular">{c.by}, {dateShort(c.at)}</span><p>{c.text}</p></li>)}</ul>
      ) : <p className="small mb-3" style={{ color: 'var(--fog)' }}>No comments yet. Add one to record a decision or update.</p>}
      <div className="flex gap-2">
        <input aria-label="New comment" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment" className={inputCls} />
        <Button variant="dark" onClick={add}>Add comment</Button>
      </div>
    </div>
  );
}

export default function Actions() {
  const { actions, projects, active, filters, trends } = useScoped();
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const open = actions.filter((a) => a.status !== 'Closed');
  const month = REPORT_DATE.slice(0, 7);
  const cols: Col<ActionItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Action', editable: true, add: true, required: true },
    { key: 'projectId', label: 'Project', render: (a) => projects.find((p) => p.id === a.projectId)?.name ?? a.projectId },
    { key: 'category', label: 'Category', type: 'select', options: CATS, editable: true, add: true },
    { key: 'discipline', label: 'Discipline', type: 'select', options: DISC, editable: true, add: true },
    { key: 'assignee', label: 'Responsibility', type: 'select', options: ROLES, editable: true, add: true, render: (a) => <OwnerCell role={a.assignee} /> },
    { key: 'openDate', label: 'Ageing', render: (a) => (a.status === 'Closed' ? 'Closed' : <AgeingCell days={ageing(a.openDate)} />) },
    { key: 'dueDate', label: 'Due or close date', type: 'date', editable: true, add: true, render: (a) => (a.status === 'Closed' ? `Closed ${dateShort(a.closedDate)}` : `Due ${dateShort(a.dueDate)}`) },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, editable: true },
  ];
  const tabs: RegTab<ActionItem>[] = [
    { id: 'all', label: 'All', test: () => true }, { id: 'open', label: 'Open', test: (a) => a.status !== 'Closed' },
    { id: 'closed', label: 'Closed', test: (a) => a.status === 'Closed' }, { id: 'overdue', label: 'Overdue', test: isOverdue },
  ];
  const filters2: RegFilter<ActionItem>[] = [
    { key: 'owner', label: 'Responsibility', options: ROLES, test: (r, v) => r.assignee === v },
    { key: 'category', label: 'Category', options: CATS, test: (r, v) => r.category === v },
    { key: 'status', label: 'Status', options: ['Not closed', ...STATUS, 'Overdue'], test: (r, v) => (v === 'Not closed' ? r.status !== 'Closed' : v === 'Overdue' ? isOverdue(r) : r.status === v) },
  ];
  return (
    <>
      <KpiRow n={4}>
        <KpiCard label="Open actions" value={open.length} rail="neutral" href="/actions?status=Not%20closed" spark={trends.actions} context={`${actions.length} actions in total`} />
        <KpiCard label="Overdue over 30 days" value={actions.filter(isOverdue).length} rail="critical" href="/actions?status=Overdue" context="Open more than 30 days" />
        <KpiCard label="Closed this month" value={actions.filter((a) => a.status === 'Closed' && a.closedDate.slice(0, 7) === month).length} rail="good" href="/actions?status=Closed" context="Closed in September 2026" />
        <KpiCard label="Open by category" rail="neutral" context="Select a category to filter">
          <span className="flex flex-wrap gap-2">{CATS.map((c) => <Link key={c} href={`/actions?category=${c}`} className="chip chip-info tabular">{c} {open.filter((a) => a.category === c).length}</Link>)}</span>
        </KpiCard>
      </KpiRow>
      <div className="grid12 section">
        <Tile surface title="Ageing of open actions, in days" className="c7" action={<span className="caption">Over 30 days counts as overdue</span>}>
          <Bars label={`Open actions by days open: ${AGE_BINS.map((b) => `${b} ${open.filter((a) => ageBin(a.openDate) === b).length}`).join(', ')}`} xKey="name" height={220} labels highlight="Over 60"
            data={AGE_BINS.map((b) => ({ name: b, Actions: open.filter((a) => ageBin(a.openDate) === b).length }))} series={[{ key: 'Actions', name: 'Open actions', color: C.ink }]} />
        </Tile>
        <Tile surface title="Open actions by owner" className="c5">
          <WorkloadBar parts={[{ label: 'Open 30 days or less', color: 'var(--steel)' }, { label: 'Open over 30 days', color: 'var(--red)' }]}
            rows={ROLES.map((r) => ({ label: r, unit: 'open', values: [open.filter((a) => a.assignee === r && !isOverdue(a)).length, open.filter((a) => a.assignee === r && isOverdue(a)).length] })).filter((r) => r.values[0] + r.values[1] > 0)} />
        </Tile>
      </div>
      <Register<ActionItem> entity="actions" noun="action" rows={actions} cols={cols} filters={filters2} tabs={tabs} searchKeys={['title', 'assignee', 'id', 'category']} titleKey="title"
        ownerOf={(a) => a.assignee} ageOf={(a) => (a.status === 'Closed' ? 'closed' : `open ${ageing(a.openDate)} days`)} figureOf={(a) => (a.status === 'Closed' ? null : `${ageing(a.openDate)}d`)}
        statusOf={(a) => (isOverdue(a) ? { label: 'Overdue', tone: 'bad' } : { label: a.status, tone: a.status === 'Closed' ? 'good' : a.status === 'Open' ? 'info' : 'warn' })}
        closePatch={{ status: 'Closed', closedDate: REPORT_DATE }} extra={(a) => <Comments a={a} />}
        makeRow={(d) => ({ id: `A-${Date.now().toString().slice(-5)}`, projectId: pid, title: d.title.trim(), category: d.category || CATS[0], discipline: d.discipline || 'General', assignee: d.assignee || ROLES[0],
          openDate: REPORT_DATE, dueDate: d.dueDate || REPORT_DATE, status: 'Open', closedDate: '', comments: [] })} />
    </>
  );
}
