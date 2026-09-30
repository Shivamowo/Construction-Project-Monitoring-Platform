'use client';
import { useState } from 'react';
import { useScoped } from '@/lib/store';
import { ageing } from '@/lib/metrics';
import { dateShort } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { Register, type Col, type RegFilter, type RegTab } from '@/components/Register';
import { AgeingCell, KpiCard, KpiRow, OwnerCell, SegmentedControl, Tile } from '@/components/ui';
import { Bars, C } from '@/components/charts';
import { WorkloadBar } from '@/components/viz';
import { AGE_BINS, ageBin } from '@/lib/health';
import type { Delay } from '@/lib/types';

const ROLES = ['Project team', 'Civil team', 'Site team', 'Commercial', 'Client representative', 'Contractor representative'];
const isClient = (d: Delay) => d.person === 'Client representative';
const isContractor = (d: Delay) => d.person === 'Contractor representative';

export default function Delays() {
  const { delays, projects, active, filters, trends } = useScoped();
  const [owner, setOwner] = useState<'All' | 'Client' | 'Contractor'>('All');
  const pid = filters.projectId === 'all' ? active.id : filters.projectId;
  const open = delays.filter((d) => d.status === 'Open');
  const avg = open.length ? Math.round(open.reduce((s, d) => s + ageing(d.openDate), 0) / open.length) : 0;
  const rows = delays.filter((d) => owner === 'All' || (owner === 'Client' ? isClient(d) : isContractor(d)));
  const orgs = [...new Set(delays.map((d) => d.org))];
  const cols: Col<Delay>[] = [
    { key: 'id', label: 'ID' },
    { key: 'description', label: 'Delay or constraint', editable: true, add: true, required: true },
    { key: 'projectId', label: 'Project', render: (d) => projects.find((p) => p.id === d.projectId)?.name ?? d.projectId },
    { key: 'person', label: 'Responsibility', type: 'select', options: ROLES, editable: true, add: true, render: (d) => <OwnerCell role={d.person} /> },
    { key: 'org', label: 'Organization', editable: true, add: true, required: true },
    { key: 'openDate', label: 'Open date', render: (d) => dateShort(d.openDate) },
    { key: 'closeDate', label: 'Close date', type: 'date', editable: true, render: (d) => dateShort(d.closeDate) },
    { key: 'status', label: 'Ageing', render: (d) => (d.status === 'Open' ? <AgeingCell days={ageing(d.openDate)} /> : 'Closed') },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'], editable: true },
    { key: 'daysLost', label: 'Days lost', type: 'number', editable: true, add: true },
    { key: 'linked', label: 'Linked building, PO or drawing', editable: true, add: true, wide: true },
  ];
  const tabs: RegTab<Delay>[] = [
    { id: 'all', label: 'All', test: () => true }, { id: 'open', label: 'Open', test: (d) => d.status === 'Open' },
    { id: 'closed', label: 'Closed', test: (d) => d.status === 'Closed' }, { id: 'old', label: 'Open over 30 days', test: (d) => d.status === 'Open' && ageing(d.openDate) > 30 },
  ];
  const filters2: RegFilter<Delay>[] = [
    { key: 'project', label: 'Project', options: projects.map((p) => p.name), test: (r, v) => projects.find((p) => p.id === r.projectId)?.name === v },
    { key: 'status', label: 'Status', options: ['Open', 'Closed'], test: (r, v) => r.status === v },
    { key: 'org', label: 'Organization', options: orgs, test: (r, v) => r.org === v },
  ];
  return (
    <>
      <KpiRow n={4}>
        <KpiCard label="Open delays" value={open.length} rail="critical" href="/delays?status=Open" spark={trends.delays} context={`${open.reduce((s, d) => s + d.daysLost, 0)} days lost so far`} />
        <KpiCard label="Client actions" value={open.filter(isClient).length} rail="caution" context="Open delays owned by the client" />
        <KpiCard label="Contractor actions" value={open.filter(isContractor).length} rail="caution" context="Open delays owned by contractors" />
        <KpiCard label="Average ageing" value={avg} unit="days" rail="critical" spark={trends.ageing} context="Across open delays" />
      </KpiRow>
      <div className="grid12 section">
        <Tile surface title="Owner workload" className="c6" action={<span className="caption">Open delays only</span>}>
          <WorkloadBar parts={[{ label: 'Client', color: 'var(--text)' }, { label: 'Contractor', color: 'var(--steel)' }, { label: 'Other', color: 'var(--soft)' }]} rows={[
            { label: 'Open delays', unit: 'delays', values: [open.filter(isClient).length, open.filter(isContractor).length, open.filter((d) => !isClient(d) && !isContractor(d)).length] },
            { label: 'Days lost', unit: 'days', values: [open.filter(isClient).reduce((s, d) => s + d.daysLost, 0), open.filter(isContractor).reduce((s, d) => s + d.daysLost, 0), open.filter((d) => !isClient(d) && !isContractor(d)).reduce((s, d) => s + d.daysLost, 0)] },
          ]} />
        </Tile>
        <Tile surface title="Ageing of open delays, in days" className="c6">
          <Bars label={`Open delays by days open: ${AGE_BINS.map((b) => `${b} ${open.filter((d) => ageBin(d.openDate) === b).length}`).join(', ')}`} xKey="name" height={220} labels highlight="Over 60"
            data={AGE_BINS.map((b) => ({ name: b, Delays: open.filter((d) => ageBin(d.openDate) === b).length }))} series={[{ key: 'Delays', name: 'Open delays', color: C.ink }]} />
        </Tile>
      </div>
      <Register<Delay> entity="delays" noun="delay" rows={rows} cols={cols} filters={filters2} tabs={tabs} searchKeys={['description', 'person', 'org', 'linked', 'id']} titleKey="description"
        addLabel="Log delay" addedMsg="Delay logged"
        toolbar={<span className="inline-flex items-center gap-2"><span className="label">Owned by</span><SegmentedControl label="Owned by" options={['All', 'Client', 'Contractor'] as const} value={owner} onChange={setOwner} /></span>}
        ownerOf={(d) => d.person} ageOf={(d) => (d.status === 'Closed' ? 'closed' : `open ${ageing(d.openDate)} days`)} figureOf={(d) => `${d.daysLost}d`}
        statusOf={(d) => ({ label: d.status, tone: d.status === 'Open' ? 'bad' : 'good' })} closePatch={{ status: 'Closed', closeDate: REPORT_DATE }}
        makeRow={(d) => ({ id: `D-${Date.now().toString().slice(-5)}`, projectId: pid, description: d.description.trim(), person: d.person || ROLES[0], org: d.org.trim(), openDate: d.openDate || REPORT_DATE, closeDate: '',
          status: 'Open', daysLost: Number(d.daysLost) || 0, linked: d.linked ?? '', discipline: 'General' })} />
    </>
  );
}
