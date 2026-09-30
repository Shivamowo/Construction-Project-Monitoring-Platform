'use client';
import { useScoped, useStore } from '@/lib/store';
import { fmtDate } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { Register, type Col, type RegFilter } from '@/components/Register';
import { Chip, PageHeader, Tile } from '@/components/ui';
import type { Risk } from '@/lib/types';

const RATING: Risk['rating'][] = ['High', 'Medium', 'Low'];
const STATUS: Risk['status'][] = ['Open', 'Mitigating', 'Closed'];
const CATS = ['Construction', 'Procurement', 'Design', 'Commercial'];
const DISC = ['Civil', 'Structural', 'Mechanical', 'Electrical', 'Instrumentation', 'General'];
const PEOPLE = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];
const tally = (keys: string[], f: (r: Risk) => string, rows: Risk[]) => keys.map((k) => ({ name: k, Risks: rows.filter((r) => f(r) === k).length }));
const tone = (r: string) => (r === 'High' ? 'bad' : r === 'Medium' ? 'warn' : 'good');

export default function Risks() {
  const { risks, active, filters } = useScoped();
  const { actions, delays } = useStore();
  const links = ['', ...actions.map((a) => `Action ${a.id}`), ...delays.map((d) => `Delay ${d.id}`)];
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const cols: Col<Risk>[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Risk', editable: true, add: true, required: true },
    { key: 'category', label: 'Category', type: 'select', options: CATS, editable: true, add: true },
    { key: 'rating', label: 'Rating', type: 'select', options: RATING, editable: true, add: true, sortValue: (r) => RATING.indexOf(r.rating), render: (r) => <Chip tone={tone(r.rating)}>{r.rating}</Chip> },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, editable: true },
    { key: 'owner', label: 'Owner', type: 'select', options: PEOPLE, editable: true, add: true },
    { key: 'mitigation', label: 'Mitigation plan', editable: true, add: true },
    { key: 'link', label: 'Linked to', type: 'select', options: links, editable: true, add: true },
    { key: 'openDate', label: 'Opened', type: 'date', render: (r) => fmtDate(r.openDate) },
  ];
  const filters2: RegFilter<Risk>[] = [
    { key: 'state', label: 'State', options: ['Active', 'Closed'], test: (r, v) => (v === 'Closed') === (r.status === 'Closed') },
    { key: 'rating', label: 'Rating', options: RATING, test: (r, v) => r.rating === v },
    { key: 'category', label: 'Category', options: CATS, test: (r, v) => r.category === v },
  ];
  return (
    <>
      <PageHeader title="Risks" lede="Rated risks with an owner, a mitigation plan and a link to the action or delay it drives." />
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile title="By status"><Bars label="Risks by status" xKey="name" height={170} data={tally(STATUS, (r) => r.status, risks)} series={[{ key: 'Risks', name: 'Risks', color: C.graphite }]} /></Tile>
        <Tile title="By category"><Bars label="Risks by category" xKey="name" height={170} data={tally(CATS, (r) => r.category, risks)} series={[{ key: 'Risks', name: 'Risks', color: C.graphite }]} highlight="Construction" /></Tile>
        <Tile title="By rating (not closed)"><Bars label="Open risks by rating" xKey="name" height={170} data={tally(RATING, (r) => r.rating, risks.filter((r) => r.status !== 'Closed'))} series={[{ key: 'Risks', name: 'Risks', color: C.graphite }]} highlight="High" /></Tile>
      </div>
      <Register<Risk> entity="risks" noun="risk" rows={risks} cols={cols} filters={filters2} searchKeys={['title', 'owner', 'mitigation', 'id', 'link']}
        makeRow={(d) => ({ id: `R-${Date.now().toString().slice(-5)}`, projectId: pid, title: d.title.trim(), category: d.category || CATS[0], discipline: 'General', rating: (d.rating as Risk['rating']) || 'High',
          status: 'Open', owner: d.owner || PEOPLE[0], mitigation: d.mitigation ?? '', link: d.link ?? '', openDate: REPORT_DATE })} />
    </>
  );
}
