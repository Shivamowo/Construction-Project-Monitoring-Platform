'use client';
import { useState } from 'react';
import { useScoped } from '@/lib/store';
import { ageing } from '@/lib/metrics';
import { dateShort } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { HeatGrid } from '@/components/viz';
import { AGE_BINS, ageBin } from '@/lib/health';
import { Register, type Col, type RegFilter, type RegTab } from '@/components/Register';
import { Button, KpiCard, KpiRow, OwnerCell, StatusChip, Tile, inputCls, type Tone } from '@/components/ui';
import type { Risk } from '@/lib/types';

const RATING: Risk['rating'][] = ['High', 'Medium', 'Low'];
const STATUS: Risk['status'][] = ['Open', 'Mitigating', 'Closed'];
const CATS = ['Construction', 'Procurement', 'Commercial'];
const ROLES = ['Project team', 'Civil team', 'Site team', 'Commercial', 'Client representative', 'Contractor representative'];
const tone = (r: string): Tone => (r === 'High' ? 'bad' : r === 'Medium' ? 'warn' : 'good');

function Mitigation({ r }: { r: Risk }) {
  const { updateRow, toast } = useScoped();
  const [text, setText] = useState(r.mitigation);
  return (
    <div>
      <h4 className="label mb-2">Mitigation plan</h4>
      <textarea aria-label="Mitigation plan" rows={3} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} />
      <div className="mt-2"><Button variant="dark" onClick={() => { updateRow('risks', r.id, { mitigation: text.trim() }); toast('Mitigation saved'); }}>Save mitigation</Button></div>
    </div>
  );
}

export default function Risks() {
  const { risks, projects, active, filters, actions, delays, trends } = useScoped();
  const links = ['', ...actions.map((a) => `Action ${a.id}`), ...delays.map((d) => `Delay ${d.id}`)];
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const open = risks.filter((r) => r.status !== 'Closed');
  const high = open.filter((r) => r.rating === 'High').length, med = open.filter((r) => r.rating === 'Medium').length;
  const cols: Col<Risk>[] = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Description', editable: true, add: true, required: true },
    { key: 'projectId', label: 'Project', render: (r) => projects.find((p) => p.id === r.projectId)?.name ?? r.projectId },
    { key: 'category', label: 'Category', type: 'select', options: CATS, editable: true, add: true },
    { key: 'rating', label: 'Rating', type: 'select', options: RATING, editable: true, add: true, render: (r) => <StatusChip tone={tone(r.rating)}>{r.rating}</StatusChip> },
    { key: 'status', label: 'Status', type: 'select', options: STATUS, editable: true },
    { key: 'openDate', label: 'Open date', render: (r) => dateShort(r.openDate) },
    { key: 'owner', label: 'Owner', type: 'select', options: ROLES, editable: true, add: true, render: (r) => <OwnerCell role={r.owner} /> },
    { key: 'link', label: 'Linked action or delay', type: 'select', options: links, editable: true, add: true },
    { key: 'mitigation', label: 'Mitigation', add: true, hideInDetail: true },
  ];
  const tabs: RegTab<Risk>[] = [
    { id: 'all', label: 'All', test: () => true }, { id: 'open', label: 'Open', test: (r) => r.status !== 'Closed' },
    { id: 'closed', label: 'Closed', test: (r) => r.status === 'Closed' }, { id: 'high', label: 'High rating', test: (r) => r.rating === 'High' && r.status !== 'Closed' },
  ];
  const filters2: RegFilter<Risk>[] = [
    { key: 'status', label: 'Status', options: ['Not closed', ...STATUS], test: (r, v) => (v === 'Not closed' ? r.status !== 'Closed' : r.status === v) },
    { key: 'category', label: 'Category', options: CATS, test: (r, v) => r.category === v },
    { key: 'rating', label: 'Rating', options: RATING, test: (r, v) => r.rating === v },
  ];
  return (
    <>
      <KpiRow n={3}>
        <KpiCard label="Open risks" value={open.length} rail="neutral" href="/risks?status=Not%20closed" spark={trends.risks} context={`${risks.length} risks logged`} />
        <KpiCard label="High" value={high} rail="critical" href="/risks?status=Not%20closed&rating=High" context="Needs a mitigation owner" />
        <KpiCard label="Medium" value={med} rail="caution" href="/risks?status=Not%20closed&rating=Medium" context="Monitor weekly" />
      </KpiRow>
      <div className="grid12 section">
        <Tile surface title="Open risks by rating and category" className="c7" action={<span className="caption">Select a square to filter the register</span>}>
          <HeatGrid rows={RATING} cols={CATS} count={(r, c) => open.filter((x) => x.rating === r && x.category === c).length} tone={(r) => (r === 'High' ? '#B9251C' : r === 'Medium' ? '#E08A1E' : '#168736')}
            href={(r, c) => `/risks?status=Not%20closed&rating=${r}&category=${c}`} />
          <p className="caption mt-4">{high} of {open.length} open risks are rated High. The oldest open risk has been open {open.length ? Math.max(...open.map((r) => ageing(r.openDate))) : 0} days.</p>
        </Tile>
        <Tile surface title="Ageing of open risks, in days" className="c5">
          <Bars label={`Open risks by days open: ${AGE_BINS.map((b) => `${b} ${open.filter((r) => ageBin(r.openDate) === b).length}`).join(', ')}`} xKey="name" height={220} labels highlight="Over 60"
            data={AGE_BINS.map((b) => ({ name: b, Risks: open.filter((r) => ageBin(r.openDate) === b).length }))} series={[{ key: 'Risks', name: 'Open risks', color: C.ink }]} />
        </Tile>
      </div>
      <Register<Risk> entity="risks" noun="risk" rows={risks} cols={cols} filters={filters2} tabs={tabs} searchKeys={['title', 'owner', 'mitigation', 'id', 'link']} titleKey="title"
        ownerOf={(r) => r.owner} ageOf={(r) => (r.status === 'Closed' ? 'closed' : `open ${ageing(r.openDate)} days`)} figureOf={(r) => r.rating}
        statusOf={(r) => ({ label: r.status === 'Closed' ? 'Closed' : `${r.rating}, ${r.status.toLowerCase()}`, tone: r.status === 'Closed' ? 'good' : tone(r.rating) })} closePatch={{ status: 'Closed' }}
        extra={(r) => <Mitigation key={r.id + r.mitigation} r={r} />}
        makeRow={(d) => ({ id: `R-${Date.now().toString().slice(-5)}`, projectId: pid, title: d.title.trim(), category: d.category || CATS[0], discipline: 'General', rating: (d.rating as Risk['rating']) || 'High',
          status: 'Open', owner: d.owner || ROLES[0], mitigation: d.mitigation ?? '', link: d.link ?? '', openDate: REPORT_DATE })} />
    </>
  );
}
