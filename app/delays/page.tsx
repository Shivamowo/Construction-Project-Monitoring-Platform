'use client';
import { useScoped } from '@/lib/store';
import { ageing, fmtDate } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Bars, C } from '@/components/charts';
import { Register, type Col, type RegFilter, type RegTab } from '@/components/Register';
import { BigStat, Tile } from '@/components/ui';
import type { Delay } from '@/lib/types';

const PEOPLE = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];
const S = [{ key: 'Days', name: 'Days lost', color: C.ink }];

export default function Delays() {
  const { delays, active, filters } = useScoped();
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const open = delays.filter((d) => d.status === 'Open');
  const orgs = [...new Set(delays.map((d) => d.org))];
  const cols: Col<Delay>[] = [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description', editable: true, add: true, required: true },
    { key: 'person', label: 'Responsible person', type: 'select', options: PEOPLE, editable: true, add: true },
    { key: 'org', label: 'Responsible organization', editable: true, add: true, required: true },
    { key: 'openDate', label: 'Open date', type: 'date', editable: true, add: true, render: (d) => fmtDate(d.openDate) },
    { key: 'closeDate', label: 'Close date', type: 'date', editable: true, render: (d) => fmtDate(d.closeDate) },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'], editable: true },
    { key: 'daysLost', label: 'Days lost', type: 'number', editable: true, add: true },
    { key: 'linked', label: 'Linked building, PO or drawing', editable: true, add: true, wide: true },
  ];
  const tabs: RegTab<Delay>[] = [
    { id: 'all', label: 'All', test: () => true }, { id: 'open', label: 'Open', test: (d) => d.status === 'Open' },
    { id: 'closed', label: 'Closed', test: (d) => d.status === 'Closed' }, { id: 'old', label: 'Open 30+ days', test: (d) => d.status === 'Open' && ageing(d.openDate) > 30 },
  ];
  const filters2: RegFilter<Delay>[] = [
    { key: 'state', label: 'Status', options: ['Open', 'Closed'], test: (r, v) => r.status === v },
    { key: 'org', label: 'Organization', options: orgs, test: (r, v) => r.org === v },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile><div className="flex flex-col gap-4"><BigStat label="Open delays" value={open.length} href="/delays?state=Open" /><BigStat label="Days lost on open delays" value={open.reduce((s, d) => s + d.daysLost, 0)} unit="days" tone="bad" /></div></Tile>
        <Tile title="Days lost by organization" className="md:col-span-2"><Bars label="Days lost by organization" xKey="name" height={160} highlight={undefined} series={S}
          data={orgs.map((o) => ({ name: o.length > 14 ? `${o.slice(0, 13)}…` : o, Days: delays.filter((d) => d.org === o).reduce((s, d) => s + d.daysLost, 0) }))} /></Tile>
      </div>
      <Register<Delay> entity="delays" noun="delay" rows={delays} cols={cols} filters={filters2} tabs={tabs} searchKeys={['description', 'person', 'org', 'linked', 'id']} titleKey="description"
        ownerOf={(d) => d.person} ageOf={(d) => (d.status === 'Closed' ? 'closed' : `open ${ageing(d.openDate)} days`)} figureOf={(d) => `${d.daysLost}d`}
        statusOf={(d) => ({ label: d.status, tone: d.status === 'Open' ? 'bad' : 'good' })} closePatch={{ status: 'Closed', closeDate: REPORT_DATE }}
        makeRow={(d) => ({ id: `D-${Date.now().toString().slice(-5)}`, projectId: pid, description: d.description.trim(), person: d.person || PEOPLE[0], org: d.org.trim(), openDate: d.openDate || REPORT_DATE, closeDate: '',
          status: 'Open', daysLost: Number(d.daysLost) || 0, linked: d.linked ?? '', discipline: 'General' })} />
    </div>
  );
}
