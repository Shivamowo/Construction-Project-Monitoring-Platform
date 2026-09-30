'use client';
import { useState } from 'react';
import { useScoped, useStore } from '@/lib/store';
import { AGE_BUCKETS, ageBucket, ageing, fmtDate, isOverdue, needsEscalation } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { Register, type Col, type RegFilter } from '@/components/Register';
import { Button, Chip, Drawer, EmptyState, PageHeader, Tile, inputCls } from '@/components/ui';
import type { ActionItem } from '@/lib/types';

const PEOPLE = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];
const CATS = ['Design', 'Procurement', 'Construction', 'Commercial', 'Site facilities', 'Planning'];
const STATUS: ActionItem['status'][] = ['Open', 'In progress', 'Closed'];
const DISC = ['Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];
const tally = (keys: string[], f: (a: ActionItem) => string, rows: ActionItem[]) => keys.map((k) => ({ name: k, Actions: rows.filter((r) => f(r) === k).length }));

export default function Actions() {
  const { actions, active, filters, updateRow, toast } = useScoped();
  const { actions: all } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const current = all.find((a) => a.id === openId);
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;

  const cols: Col<ActionItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Action', editable: true, add: true, required: true },
    { key: 'category', label: 'Category', type: 'select', options: CATS, editable: true, add: true },
    { key: 'discipline', label: 'Discipline', type: 'select', options: DISC, editable: true, add: true },
    { key: 'assignee', label: 'Assigned to', type: 'select', options: PEOPLE, editable: true, add: true },
    { key: 'openDate', label: 'Opened', type: 'date', editable: true, add: true, render: (a) => (
      <span className="flex flex-wrap items-center gap-2">{fmtDate(a.openDate)}<span className="text-xs text-graphite">{ageing(a.openDate)} days</span>{needsEscalation(a) && <Chip tone="bad">Escalate</Chip>}</span>) },
    { key: 'dueDate', label: 'Due', type: 'date', editable: true, add: true, render: (a) => (
      <span className="flex flex-wrap items-center gap-2">{fmtDate(a.dueDate)}{isOverdue(a) && <Chip tone="bad">Overdue</Chip>}</span>) },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, editable: true },
  ];
  const filters2: RegFilter<ActionItem>[] = [
    { key: 'state', label: 'State', options: ['Active', 'Closed'], test: (r, v) => (v === 'Closed') === (r.status === 'Closed') },
    { key: 'category', label: 'Category', options: CATS, test: (r, v) => r.category === v },
    { key: 'assignee', label: 'Assigned to', options: PEOPLE, test: (r, v) => r.assignee === v },
    { key: 'flag', label: 'Flag', options: ['Overdue', 'Escalated'], test: (r, v) => (v === 'Overdue' ? isOverdue(r) : needsEscalation(r)) },
  ];
  const addComment = () => {
    if (!current) return;
    if (!text.trim()) return toast('Write a comment before adding it.', 'error');
    updateRow('actions', current.id, { comments: [...current.comments, { by: 'You', at: REPORT_DATE, text: text.trim() }] });
    setText(''); toast('Comment added');
  };

  return (
    <>
      <PageHeader title="Actions" lede="Every open action with its owner and age. Actions open for more than 14 days show an escalation badge." />
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile title="By status"><Bars label="Actions by status" xKey="name" height={170} data={tally(STATUS, (a) => a.status, actions)} series={[{ key: 'Actions', name: 'Actions', color: C.graphite }]} highlight="Open" /></Tile>
        <Tile title="By category"><Bars label="Actions by category" xKey="name" height={170} data={tally(CATS, (a) => a.category, actions)} series={[{ key: 'Actions', name: 'Actions', color: C.graphite }]} /></Tile>
        <Tile title="By ageing (not closed)"><Bars label="Open actions by ageing bucket" xKey="name" height={170} data={tally(AGE_BUCKETS, (a) => ageBucket(ageing(a.openDate)), actions.filter((a) => a.status !== 'Closed'))} series={[{ key: 'Actions', name: 'Actions', color: C.graphite }]} highlight="Over 30 days" /></Tile>
      </div>
      <Register<ActionItem> entity="actions" noun="action" rows={actions} cols={cols} filters={filters2} searchKeys={['title', 'assignee', 'id', 'category']}
        makeRow={(d) => ({ id: `A-${Date.now().toString().slice(-5)}`, projectId: pid, title: d.title.trim(), category: d.category || CATS[0], discipline: d.discipline || 'General', assignee: d.assignee || PEOPLE[0],
          openDate: d.openDate || REPORT_DATE, dueDate: d.dueDate || REPORT_DATE, status: 'Open', comments: [] })}
        rowActions={(a) => (
          <>
            <Button onClick={() => setOpenId(a.id)} aria-label={`Comments on ${a.id}, ${a.comments.length}`}>Comments ({a.comments.length})</Button>
            {a.status !== 'Closed' && <Button onClick={() => { updateRow('actions', a.id, { status: 'Closed' }); toast('Action closed'); }} aria-label={`Close action ${a.id}`}>Close action</Button>}
          </>
        )} />
      <Drawer open={!!current} onClose={() => setOpenId(null)} title={current ? `${current.id}: comments` : 'Comments'}>
        {current && (
          <div className="flex flex-col gap-4">
            <p className="text-sm">{current.title}</p>
            {current.comments.length ? (
              <ul className="flex flex-col divide-y divide-line">{current.comments.map((c, i) => <li key={i} className="py-2 text-sm"><p className="text-xs text-graphite">{c.by}, {fmtDate(c.at)}</p><p>{c.text}</p></li>)}</ul>
            ) : <EmptyState title="No comments yet" hint="Add the first comment to record a decision or update." />}
            <textarea aria-label="New comment" value={text} onChange={(e) => setText(e.target.value)} rows={3} className={`${inputCls} h-auto py-2`} placeholder="Write a comment" />
            <Button variant="primary" onClick={addComment}>Add comment</Button>
          </div>
        )}
      </Drawer>
    </>
  );
}
