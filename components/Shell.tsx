'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ClipboardList, Download, DraftingCompass, Gauge, HardHat, History, LayoutGrid, ListChecks, MoreHorizontal, PackageCheck, PanelLeftClose, PanelLeftOpen, ShieldAlert, Timer } from 'lucide-react';
import { StoreProvider, useStore, DISCIPLINES } from '@/lib/store';
import { PROJECTS } from '@/data/seed';
import { RANGES, daysRemaining, fmtDate, varianceDays } from '@/lib/metrics';
import { downloadCsv } from '@/lib/csv';
import { REPORT_DATE } from '@/lib/brand';
import { Logo } from './Logo';
import { Button, Drawer, SegmentedControl, Toasts, inputCls } from './ui';

const NAV = [
  { href: '/', label: 'Portfolio', icon: LayoutGrid },
  { href: '/scorecard', label: 'Scorecard', icon: Gauge },
  { href: '/procurement', label: 'Procurement', icon: PackageCheck },
  { href: '/drawings', label: 'Drawings', icon: DraftingCompass },
  { href: '/dpr', label: 'Daily progress', icon: ClipboardList },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/actions', label: 'Actions', icon: ListChecks },
  { href: '/risks', label: 'Risks', icon: ShieldAlert },
  { href: '/delays', label: 'Delays', icon: Timer },
];
const TABS = ['/', '/scorecard', '/dpr', '/actions', '/procurement'];

function AuditDrawer() {
  const { audit, auditOpen, setAuditOpen } = useStore();
  return (
    <Drawer open={auditOpen} onClose={() => setAuditOpen(false)} title="Audit trail">
      {!audit.length ? (
        <p className="max-w-[60ch] text-sm text-graphite">No changes yet. Edit a cell in any register and the change appears here.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line">
          {audit.map((a) => (
            <li key={a.id} className="py-3 text-sm">
              <p className="font-semibold">{a.rowId} <span className="font-normal text-graphite">in {a.entity}</span></p>
              <p>{a.kind === 'created' ? 'Created' : <>Changed {a.field} from “{a.from || 'empty'}” to “{a.to || 'empty'}”</>}</p>
              <p className="text-xs text-graphite">{new Date(a.at).toLocaleString('en-GB')}</p>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { filters, setFilters, setAuditOpen, toast } = useStore();
  const [expanded, setExpanded] = useState(false);
  const [more, setMore] = useState(false);
  useEffect(() => { try { setExpanded(localStorage.getItem('sitewise:rail') === '1'); } catch { /* ignore */ } }, []);
  const toggle = () => { setExpanded((e) => { try { localStorage.setItem('sitewise:rail', e ? '0' : '1'); } catch { /* ignore */ } return !e; }); };
  const on = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));

  const exportProjects = () => {
    downloadCsv('projects', ['Project', 'State', 'Status', 'Plan %', 'Actual %', 'Start', 'Execution start', 'Baseline finish', 'Forecast finish', 'Variance days', 'Days remaining'],
      PROJECTS.map((p) => [p.name, p.state, p.status, p.planPct, p.actualPct, p.start, p.execStart, p.baselineFinish, p.forecastFinish, varianceDays(p.baselineFinish, p.forecastFinish), daysRemaining(p.forecastFinish)]));
    toast('Report exported');
  };

  return (
    <div className="min-h-screen">
      <nav aria-label="Main" className={clsx('fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-white py-3 transition-[width] duration-200 md:flex', expanded ? 'w-56' : 'w-16')}>
        <div className={clsx('mb-4 flex h-9 items-center', expanded ? 'px-5' : 'justify-center')}><Logo compact={!expanded} /></div>
        <ul className="flex flex-1 flex-col gap-1 px-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <li key={href} className="group relative">
              <Link href={href} aria-current={on(href) ? 'page' : undefined} aria-label={label}
                className={clsx('flex h-10 items-center gap-3 rounded px-3 text-sm font-medium', on(href) ? 'bg-brand text-ink' : 'text-graphite hover:bg-mist hover:text-ink')}>
                <Icon size={20} aria-hidden className="shrink-0" />
                {expanded && <span>{label}</span>}
              </Link>
              {!expanded && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-focus-within:block group-hover:block">{label}</span>}
            </li>
          ))}
        </ul>
        <div className="px-2">
          <button type="button" onClick={toggle} aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'} className="flex h-10 w-full items-center gap-3 rounded px-3 text-sm text-graphite hover:bg-mist hover:text-ink">
            {expanded ? <PanelLeftClose size={20} aria-hidden /> : <PanelLeftOpen size={20} aria-hidden />}
            {expanded && <span>Collapse</span>}
          </button>
        </div>
      </nav>

      <div className={clsx('transition-[margin] duration-200', expanded ? 'md:ml-56' : 'md:ml-16')}>
        <header className="sticky top-0 z-30 border-b border-line bg-white">
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
            <span className="mr-1 shrink-0 md:hidden"><Logo /></span>
            <select aria-label="Project" value={filters.projectId} onChange={(e) => setFilters({ projectId: e.target.value })} className={clsx(inputCls, 'w-auto shrink-0 font-medium')}>
              <option value="all">All projects</option>
              {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select aria-label="Discipline" value={filters.discipline} onChange={(e) => setFilters({ discipline: e.target.value })} className={clsx(inputCls, 'w-auto shrink-0')}>
              {DISCIPLINES.map((d) => <option key={d} value={d}>{d === 'All' ? 'All disciplines' : d}</option>)}
            </select>
            <select aria-label="Date range" value={filters.range} onChange={(e) => setFilters({ range: e.target.value })} className="h-9 shrink-0 rounded-full border border-line bg-white px-3 text-sm font-medium">
              {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <SegmentedControl label="Chart period" options={['Weekly', 'Monthly'] as const} value={filters.gran} onChange={(g) => setFilters({ gran: g })} />
            <span className="ml-auto hidden shrink-0 text-xs text-graphite lg:block">Report date {fmtDate(REPORT_DATE)}</span>
            <Button onClick={() => setAuditOpen(true)} aria-label="Open audit trail"><History size={16} aria-hidden /><span className="hidden sm:inline">Audit trail</span></Button>
            <Button variant="primary" onClick={exportProjects}><Download size={16} aria-hidden />Export report</Button>
          </div>
        </header>
        <main className="px-4 pb-24 pt-5 sm:px-6 md:pb-10">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-white md:hidden">
        {[...TABS.map((h) => NAV.find((n) => n.href === h)!)].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={on(href) ? 'page' : undefined} className={clsx('flex flex-col items-center gap-0.5 py-2 text-xs', on(href) ? 'font-semibold text-ink' : 'text-graphite')}>
            <span className={clsx('flex h-7 w-10 items-center justify-center rounded-full', on(href) && 'bg-brand')}><Icon size={18} aria-hidden /></span>
            <span className="max-w-full truncate px-0.5">{label === 'Daily progress' ? 'DPR' : label}</span>
          </Link>
        ))}
        <button type="button" onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-2 text-xs text-graphite">
          <span className="flex h-7 w-10 items-center justify-center"><MoreHorizontal size={18} aria-hidden /></span>More
        </button>
      </nav>
      <Drawer open={more} onClose={() => setMore(false)} title="More views" side="bottom">
        <ul className="grid grid-cols-2 gap-2">
          {NAV.filter((n) => !TABS.includes(n.href)).map(({ href, label, icon: Icon }) => (
            <li key={href}><Link href={href} onClick={() => setMore(false)} className="flex h-12 items-center gap-3 rounded border border-line px-3 text-sm font-medium"><Icon size={18} aria-hidden />{label}</Link></li>
          ))}
        </ul>
      </Drawer>
      <AuditDrawer />
      <Toasts />
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <StoreProvider><Frame>{children}</Frame></StoreProvider>;
}
