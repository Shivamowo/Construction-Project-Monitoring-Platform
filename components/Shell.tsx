'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Bell, Building2, ChevronLeft, ClipboardList, DraftingCompass, Gauge, HardHat, History, LayoutDashboard, ListChecks, PackageCheck, Settings, ShieldAlert, Timer } from 'lucide-react';
import { StoreProvider, useScoped, useStore, DISCIPLINES } from '@/lib/store';
import { RANGES, daysRemaining, isOverdue, shortfall, varianceDays } from '@/lib/metrics';
import { dateLong } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { downloadCsv } from '@/lib/csv';
import { Logo } from './Logo';
import { Palette } from './Palette';
import { Avatar, Button, Drawer, FilterCluster, Gate, SegmentedControl, Toasts, useReducedMotion } from './ui';

const MAIN = [
  { href: '/', label: 'Project center', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portfolio', icon: Building2 },
  { href: '/scorecard', label: 'Scorecard', icon: Gauge },
  { href: '/procurement', label: 'Procurement', icon: PackageCheck },
  { href: '/drawings', label: 'Drawings', icon: DraftingCompass },
];
const CIRCLES = [
  { href: '/dpr', label: 'Daily progress', icon: ClipboardList },
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/actions', label: 'Actions', icon: ListChecks },
  { href: '/risks', label: 'Risks', icon: ShieldAlert },
  { href: '/delays', label: 'Delays', icon: Timer },
];
const META: Record<string, [string, string]> = {
  '/': ['Project center', 'All projects at a glance'],
  '/portfolio': ['Portfolio', 'Which projects need attention this week'],
  '/scorecard': ['Project scorecard', 'Is this project on schedule, and what drives the gap'],
  '/procurement': ['Procurement', 'Which packages are late and what is still to release'],
  '/drawings': ['Drawings', 'Which drawings are behind plan and by how much'],
  '/dpr': ['Daily progress', 'What was achieved against plan, and why not when behind'],
  '/contractors': ['Contractors', 'How each contractor performs on quantity, manpower and productivity'],
  '/actions': ['Actions', 'Which actions are open, for how long, and who owns them'],
  '/risks': ['Risks', 'Which risks are open and who owns them'],
  '/delays': ['Delays', 'What is holding the work up and who is responsible'],
};
const PRIMARY: Record<string, string> = { '/actions': 'Add action', '/risks': 'Add risk', '/delays': 'Log delay', '/dpr': 'Log progress' };

function AuditDrawer() {
  const { audit, auditOpen, setAuditOpen } = useStore();
  return (
    <Drawer open={auditOpen} onClose={() => setAuditOpen(false)} title="Audit trail">
      {!audit.length ? (
        <p className="max-w-[60ch] text-sm" style={{ color: 'var(--muted)' }}>No changes yet. Edit a field in any register and the change appears here.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {audit.map((a) => (
            <li key={a.id} className="rounded-lg p-3 text-sm" style={{ background: 'var(--tile)' }}>
              <p className="m-0 font-medium">{a.rowId} <span className="font-normal" style={{ color: 'var(--muted)' }}>in {a.entity}</span></p>
              <p className="m-0">{a.kind === 'created' ? 'Created' : <>Changed {a.field} from “{a.from || 'empty'}” to “{a.to || 'empty'}”</>}</p>
              <p className="m-0 text-xs" style={{ color: 'var(--muted)' }}>{new Date(a.at).toLocaleString('en-GB')}</p>
            </li>
          ))}
        </ol>
      )}
    </Drawer>
  );
}

function Capsule({ path }: { path: string }) {
  const reduced = useReducedMotion();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const [ready, setReady] = useState(false);
  const idx = MAIN.findIndex((m) => (m.href === '/' ? path === '/' : path.startsWith(m.href)));
  useLayoutEffect(() => {
    const el = refs.current[idx];
    setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, [idx]);
  return (
    <nav aria-label="Main" className="capsule slide shrink-0">
      {pill && <span aria-hidden className="slider" style={{ left: pill.left, width: pill.width, transition: ready && !reduced ? 'left 150ms ease, width 150ms ease' : 'none' }} />}
      {MAIN.map(({ href, label, icon: Icon }, i) => {
        const on = i === idx;
        return (
          <Link key={href} href={href} ref={(el) => { refs.current[i] = el; }} aria-current={on ? 'page' : undefined} style={on ? { color: 'var(--text)' } : undefined}>
            <Icon size={18} aria-hidden fill={on ? 'currentColor' : 'none'} />{label}
          </Link>
        );
      })}
    </nav>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { filters, setFilters, setAuditOpen, toast, fireCmd, showFilters, setShowFilters, projects, ready, dpr: allDpr } = useStore();
  const { actions, risks, delays, active } = useScoped();
  const [pal, setPal] = useState(false);
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPal((v) => !v); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const badge: Record<string, number> = {
    '/actions': actions.filter((a) => a.status !== 'Closed').length,
    '/risks': risks.filter((r) => r.status !== 'Closed').length,
    '/delays': delays.filter((d) => d.status === 'Open').length,
    '/dpr': allDpr.filter((r) => shortfall(r.ftmPlan, r.ftmAct) > 0).length,
  };
  const overdue = actions.filter(isOverdue).length;
  const [title, sub] = META[path] ?? ['Sitewise', ''];
  const primary = PRIMARY[path];
  const projLabel = ready ? (filters.projectId === 'all' ? 'All projects' : active?.name ?? '') : '';

  const exportProjects = () => {
    downloadCsv('projects', ['Project', 'State', 'Status', 'Phase', 'Plan %', 'Actual %', 'Start', 'Execution start', 'Baseline finish', 'Forecast finish', 'Variance days', 'Days remaining'],
      projects.map((p) => [p.name, p.state, p.status, p.phase, p.planPct, p.actualPct, p.start, p.execStart, p.baselineFinish, p.forecastFinish, varianceDays(p.baselineFinish, p.forecastFinish), daysRemaining(p.forecastFinish)]));
    toast('Report exported');
  };

  return (
    <div className="page">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" aria-label="Sitewise home" className="px-1"><Logo /></Link>
        <div className="order-3 -mx-1 flex w-full items-center gap-3 overflow-x-auto p-1 md:order-2 md:w-auto md:overflow-visible md:p-0">
          <Capsule path={path} />
          <div className="flex shrink-0 gap-2">
            {CIRCLES.map(({ href, label, icon: Icon }) => {
              const on = path.startsWith(href), n = badge[href];
              return (
                <div key={href} className="group relative">
                  <Link href={href} aria-label={n ? `${label}, ${n}` : label} aria-current={on ? 'page' : undefined} className={clsx('icon-btn', on && 'on')}>
                    <Icon size={18} aria-hidden fill={on ? 'currentColor' : 'none'} />
                    {!!n && <span aria-hidden className="badge">{n}</span>}
                  </Link>
                  <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs group-focus-within:block group-hover:block" style={{ background: 'var(--panel)', color: '#fff' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          <button type="button" onClick={() => setPal(true)} className="chip chip-none hidden sm:inline-flex" style={{ height: 32 }} aria-label="Open command palette">{mac ? '⌘ K' : 'Ctrl K'}</button>
          <Link href="/actions" aria-label={overdue ? `${overdue} overdue actions` : 'No overdue actions'} className="icon-btn">
            <Bell size={18} aria-hidden />{overdue > 0 && <span aria-hidden className="badge">{overdue}</span>}
          </Link>
          <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-label="Settings and global filters" className={clsx('icon-btn', showFilters && 'on')}><Settings size={18} /></button>
          <Avatar name="Project Owner" size={44} />
        </div>
      </div>

      <header className="mb-6 mt-8">
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link href="/portfolio">Portfolio</Link><span aria-hidden>/</span><Link href="/scorecard">{projLabel || 'Projects'}</Link>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {path !== '/' && <button type="button" onClick={() => router.push('/')} aria-label="Back to project center" className="icon-btn mt-1"><ChevronLeft size={20} /></button>}
            <div className="min-w-0"><h1 className="title">{title}</h1><p className="subtitle">{sub}</p></div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div id="header-slot" className="flex flex-wrap items-center gap-2" />
            <Button variant="primary" onClick={primary ? fireCmd : exportProjects}>{primary ?? 'Export report'}</Button>
          </div>
        </div>
      </header>
      {showFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterCluster onClear={() => setFilters({ projectId: 'p1', discipline: 'All', range: 'all' })} filters={[
            { key: 'project', label: 'Project', value: filters.projectId, def: 'p1', onChange: (v) => setFilters({ projectId: v }), options: [{ v: 'all', l: 'All projects' }, ...projects.map((p) => ({ v: p.id, l: p.name }))] },
            { key: 'discipline', label: 'Discipline', value: filters.discipline, def: 'All', onChange: (v) => setFilters({ discipline: v }), options: DISCIPLINES.map((d) => ({ v: d, l: d === 'All' ? 'All disciplines' : d })) },
            { key: 'range', label: 'Period', value: filters.range, def: 'all', onChange: (v) => setFilters({ range: v }), options: RANGES.map((r) => ({ v: r.id, l: r.label })) },
          ]} />
          <SegmentedControl label="Chart period" options={['Weekly', 'Monthly'] as const} value={filters.gran} onChange={(g) => setFilters({ gran: g })} />
          <Button onClick={() => setAuditOpen(true)}><History size={16} aria-hidden />Audit trail</Button>
        </div>
      )}
      <main><Suspense fallback={null}><Gate>{children}</Gate></Suspense></main>
      <p className="foot-note">Data as of {dateLong(REPORT_DATE)}. Values are representative until connected to live sources.</p>
      <Palette open={pal} onClose={() => setPal(false)} />
      <AuditDrawer />
      <Toasts />
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <StoreProvider><Frame>{children}</Frame></StoreProvider>;
}
