'use client';
import { useScoped } from '@/lib/store';
import { fmtDate } from '@/lib/metrics';
import { REPORT_DATE } from '@/lib/brand';
import { Register, type Col, type RegFilter } from '@/components/Register';
import { Chip, Kpi, PageHeader } from '@/components/ui';
import type { Delay } from '@/lib/types';

const PEOPLE = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];

export default function Delays() {
  const { delays, active, filters } = useScoped();
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const open = delays.filter((d) => d.status === 'Open');
  const cols: Col<Delay>[] = [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Description', editable: true, add: true, required: true },
    { key: 'person', label: 'Responsible person', type: 'select', options: PEOPLE, editable: true, add: true },
    { key: 'org', label: 'Responsible organization', editable: true, add: true, required: true },
    { key: 'openDate', label: 'Open date', type: 'date', editable: true, add: true, render: (d) => fmtDate(d.openDate) },
    { key: 'closeDate', label: 'Close date', type: 'date', editable: true, render: (d) => fmtDate(d.closeDate) },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'], editable: true, render: (d) => <Chip tone={d.status === 'Open' ? 'bad' : 'good'}>{d.status}</Chip> },
    { key: 'daysLost', label: 'Days lost', type: 'number', num: true, editable: true, add: true },
    { key: 'linked', label: 'Linked building, PO or drawing', editable: true, add: true },
  ];
  const filters2: RegFilter<Delay>[] = [
    { key: 'state', label: 'Status', options: ['Open', 'Closed'], test: (r, v) => r.status === v },
    { key: 'org', label: 'Organization', options: [...new Set(delays.map((d) => d.org))], test: (r, v) => r.org === v },
  ];
  return (
    <>
      <PageHeader title="Delays" lede="Every delay with who is responsible, how many days it cost and what it affects." />
      <div className="mb-4 grid grid-cols-2 gap-4 md:max-w-lg">
        <Kpi label="Open delays" value={open.length} href="/delays?state=Open" />
        <Kpi label="Days lost on open delays" value={open.reduce((s, d) => s + d.daysLost, 0)} tone="bad" />
      </div>
      <Register<Delay> entity="delays" noun="delay" rows={delays} cols={cols} filters={filters2} searchKeys={['description', 'person', 'org', 'linked', 'id']}
        makeRow={(d) => ({ id: `D-${Date.now().toString().slice(-5)}`, projectId: pid, description: d.description.trim(), person: d.person || PEOPLE[0], org: d.org.trim(), openDate: d.openDate || REPORT_DATE, closeDate: '',
          status: 'Open', daysLost: Number(d.daysLost) || 0, linked: d.linked ?? '', discipline: 'General' })} />
    </>
  );
}
