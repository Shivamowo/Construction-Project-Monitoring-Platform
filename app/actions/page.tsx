'use client';
import { useState } from 'react';
import { useScoped } from '@/lib/store';
import { AGE_BUCKETS, ageBucket, ageing, fmtDate, isOverdue, needsEscalation } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { Register, type Col, type RegFilter, type RegTab } from '@/components/Register';
import { Button, Chip, Tile, inputCls } from '@/components/ui';
import type { ActionItem } from '@/lib/types';

const PEOPLE = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];
const CATS = ['Design', 'Procurement', 'Construction', 'Commercial', 'Site facilities', 'Planning'];
const STATUS: ActionItem['status'][] = ['Open', 'In progress', 'Closed'];
const DISC = ['Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];
const tally = (keys: string[], f: (a: ActionItem) => string, rows: ActionItem[]) => keys.map((k) => ({ name: k, Actions: rows.filter((r) => f(r) === k).length }));
const S = [{ key: 'Actions', name: 'Actions', color: C.ink }];

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
      <h4 className="mb-2 text-sm font-medium">Comments ({a.comments.length})</h4>
      {a.comments.length ? (
        <ul className="mb-3 flex flex-col gap-2">{a.comments.map((c, i) => <li key={i} className="inner text-sm"><span className="text-xs text-fog">{c.by}, {fmtDate(c.at)}</span><p>{c.text}</p></li>)}</ul>
      ) : <p className="mb-3 text-sm text-fog">No comments yet. Add one to record a decision or update.</p>}
      <div className="flex gap-2">
        <input aria-label="New comment" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment" className={inputCls} />
        <Button variant="dark" onClick={add}>Add comment</Button>
      </div>
    </div>
  );
}

export default function Actions() {
  const { actions, active, filters } = useScoped();
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const cols: Col<ActionItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Action', editable: true, add: true, required: true },
    { key: 'category', label: 'Category', type: 'select', options: CATS, editable: true, add: true },
    { key: 'discipline', label: 'Discipline', type: 'select', options: DISC, editable: true, add: true },
    { key: 'assignee', label: 'Assigned to', type: 'select', options: PEOPLE, editable: true, add: true },
    { key: 'openDate', label: 'Opened', type: 'date', editable: true, add: true, render: (a) => <span className="flex flex-wrap items-center gap-2">{fmtDate(a.openDate)}{needsEscalation(a) && <Chip tone="bad">Escalate</Chip>}</span> },
    { key: 'dueDate', label: 'Due', type: 'date', editable: true, add: true, render: (a) => <span className="flex flex-wrap items-center gap-2">{fmtDate(a.dueDate)}{isOverdue(a) && <Chip tone="bad">Overdue</Chip>}</span> },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, editable: true },
  ];
  const tabs: RegTab<ActionItem>[] = [
    { id: 'all', label: 'All', test: () => true }, { id: 'open', label: 'Open', test: (a) => a.status !== 'Closed' },
    { id: 'closed', label: 'Closed', test: (a) => a.status === 'Closed' }, { id: 'overdue', label: 'Overdue', test: isOverdue },
  ];
  const filters2: RegFilter<ActionItem>[] = [
    { key: 'state', label: 'State', options: ['Active', 'Closed'], test: (r, v) => (v === 'Closed') === (r.status === 'Closed') },
    { key: 'category', label: 'Category', options: CATS, test: (r, v) => r.category === v },
    { key: 'assignee', label: 'Assigned to', options: PEOPLE, test: (r, v) => r.assignee === v },
    { key: 'flag', label: 'Flag', options: ['Overdue', 'Escalated'], test: (r, v) => (v === 'Overdue' ? isOverdue(r) : needsEscalation(r)) },
  ];
  const notClosed = actions.filter((a) => a.status !== 'Closed');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile title="By status"><Bars label="Actions by status" xKey="name" height={160} data={tally(STATUS, (a) => a.status, actions)} series={S} highlight="Open" /></Tile>
        <Tile title="By category"><Bars label="Actions by category" xKey="name" height={160} data={tally(CATS, (a) => a.category, actions)} series={S} /></Tile>
        <Tile title="By ageing (not closed)"><Bars label="Open actions by ageing bucket" xKey="name" height={160} data={tally(AGE_BUCKETS, (a) => ageBucket(ageing(a.openDate)), notClosed)} series={S} highlight="Over 30 days" /></Tile>
      </div>
      <Register<ActionItem> entity="actions" noun="action" rows={actions} cols={cols} filters={filters2} tabs={tabs} searchKeys={['title', 'assignee', 'id', 'category']} titleKey="title"
        ownerOf={(a) => a.assignee} ageOf={(a) => (a.status === 'Closed' ? 'closed' : `open ${ageing(a.openDate)} days`)} figureOf={(a) => (a.status === 'Closed' ? null : `${ageing(a.openDate)}d`)}
        statusOf={(a) => (isOverdue(a) ? { label: 'Overdue', tone: 'bad' } : { label: a.status, tone: a.status === 'Closed' ? 'good' : a.status === 'Open' ? 'info' : 'warn' })}
        closePatch={{ status: 'Closed' }} extra={(a) => <Comments a={a} />}
        makeRow={(d) => ({ id: `A-${Date.now().toString().slice(-5)}`, projectId: pid, title: d.title.trim(), category: d.category || CATS[0], discipline: d.discipline || 'General', assignee: d.assignee || PEOPLE[0],
          openDate: d.openDate || REPORT_DATE, dueDate: d.dueDate || REPORT_DATE, status: 'Open', comments: [] })} />
    </div>
  );
}
