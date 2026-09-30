'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Bell, ChevronLeft, ClipboardList, DraftingCompass, Gauge, HardHat, History, LayoutGrid, ListChecks, PackageCheck, ShieldAlert, SlidersHorizontal, Timer } from 'lucide-react';
import { StoreProvider, useScoped, useStore, DISCIPLINES } from '@/lib/store';
import { PROJECTS } from '@/data/seed';
import { RANGES, daysRemaining, isOverdue, varianceDays } from '@/lib/metrics';
import { downloadCsv } from '@/lib/csv';
import { Logo } from './Logo';
import { Avatar, Button, Drawer, FilterBar, PillSelect, SegmentedControl, Toasts, useReducedMotion } from './ui';

const MAIN = [
  { href: '/', label: 'Portfolio', icon: LayoutGrid },
  { href: '/scorecard', label: 'Scorecard', icon: Gauge },
  { href: '/procurement', label: 'Procurement', icon: PackageCheck },
  { href: '/drawings', label: 'Drawings', icon: DraftingCompass },
  { href: '/dpr', label: 'DPR', icon: ClipboardList },
];
const CIRCLES = [
  { href: '/contractors', label: 'Contractors', icon: HardHat },
  { href: '/actions', label: 'Actions', icon: ListChecks },
  { href: '/risks', label: 'Risks', icon: ShieldAlert },
  { href: '/delays', label: 'Delays', icon: Timer },
];
const TITLES: Record<string, string> = { '/': 'Portfolio', '/scorecard': 'Project scorecard', '/procurement': 'Procurement', '/drawings': 'Drawings', '/dpr': 'Daily progress', '/contractors': 'Contractors', '/actions': 'Actions', '/risks': 'Risks', '/delays': 'Delays' };
const PRIMARY: Record<string, string> = { '/actions': 'Add action', '/risks': 'Add risk', '/delays': 'Log delay', '/dpr': 'Add progress' };

function AuditDrawer() {
  const { audit, auditOpen, setAuditOpen } = useStore();
  return (
    <Drawer open={auditOpen} onClose={() => setAuditOpen(false)} title="Audit trail">
      {!audit.length ? (
        <p className="max-w-[60ch] text-sm text-sub">No changes yet. Edit a field in any register and the change appears here.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {audit.map((a) => (
            <li key={a.id} className="rounded-lg bg-tile p-3 text-sm">
              <p className="font-medium">{a.rowId} <span className="font-normal text-sub">in {a.entity}</span></p>
              <p>{a.kind === 'created' ? 'Created' : <>Changed {a.field} from “{a.from || 'empty'}” to “{a.to || 'empty'}”</>}</p>
              <p className="text-xs text-sub">{new Date(a.at).toLocaleString('en-GB')}</p>
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
    <nav aria-label="Main" className="relative flex shrink-0 rounded-full bg-panel p-1.5">
      {pill && <span aria-hidden className="absolute top-1.5 h-10 rounded-full bg-brand" style={{ left: pill.left, width: pill.width, transition: ready && !reduced ? 'left 150ms ease, width 150ms ease' : 'none' }} />}
      {MAIN.map(({ href, label, icon: Icon }, i) => {
        const on = i === idx;
        return (
          <Link key={href} href={href} ref={(el) => { refs.current[i] = el; }} aria-current={on ? 'page' : undefined}
            className={clsx('relative z-10 flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium', on ? 'text-ink' : 'text-white hover:bg-white/10')}>
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
  const { filters, setFilters, setAuditOpen, toast, fireCmd, showFilters, setShowFilters } = useStore();
  const { actions, risks, delays } = useScoped();
  const openActions = actions.filter((a) => a.status !== 'Closed').length;
  const highRisks = risks.filter((r) => r.status !== 'Closed' && r.rating === 'High').length;
  const openDelays = delays.filter((d) => d.status === 'Open').length;
  const overdue = actions.filter(isOverdue).length;
  const badge: Record<string, number> = { '/actions': openActions, '/risks': highRisks, '/delays': openDelays };

  const exportProjects = () => {
    downloadCsv('projects', ['Project', 'State', 'Status', 'Plan %', 'Actual %', 'Start', 'Execution start', 'Baseline finish', 'Forecast finish', 'Variance days', 'Days remaining'],
      PROJECTS.map((p) => [p.name, p.state, p.status, p.planPct, p.actualPct, p.start, p.execStart, p.baselineFinish, p.forecastFinish, varianceDays(p.baselineFinish, p.forecastFinish), daysRemaining(p.forecastFinish)]));
    toast('Report exported');
  };
  const primary = PRIMARY[path];

  return (
    <div className="mx-auto max-w-[1440px] p-4 md:p-6">
      <div className="rounded-3xl bg-canvas p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" aria-label="Sitewise home" className="rounded-full px-1"><Logo /></Link>
          <div className="order-3 -mx-1 flex w-full items-center gap-3 overflow-x-auto p-1 md:order-2 md:w-auto md:overflow-visible md:p-0">
            <Capsule path={path} />
            <div className="flex shrink-0 gap-2">
              {CIRCLES.map(({ href, label, icon: Icon }) => {
                const on = path.startsWith(href), n = badge[href];
                return (
                  <div key={href} className="group relative">
                    <Link href={href} aria-label={n ? `${label}, ${n}` : label} aria-current={on ? 'page' : undefined} className={clsx('relative flex h-10 w-10 items-center justify-center rounded-full', on ? 'bg-brand' : 'bg-surface hover:bg-white/60')}>
                      <Icon size={18} aria-hidden fill={on ? 'currentColor' : 'none'} />
                      {!!n && <span aria-hidden className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-panel px-1 text-xs text-white">{n}</span>}
                    </Link>
                    <span role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-panel px-3 py-1 text-xs text-white group-focus-within:block group-hover:block">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
            <Link href="/actions?flag=Overdue" aria-label={overdue ? `${overdue} overdue actions` : 'No overdue actions'} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface hover:bg-white/60">
              <Bell size={18} aria-hidden />{overdue > 0 && <span aria-hidden className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-bad" />}
            </Link>
            <PillSelect label="Project" value={filters.projectId} onChange={(v) => setFilters({ projectId: v })} options={[{ v: 'all', l: 'All projects' }, ...PROJECTS.map((p) => ({ v: p.id, l: p.name }))]} />
            <Avatar name="Project Owner" size={40} />
          </div>
        </div>

        <div className="mb-6 mt-8 flex flex-wrap items-center gap-3">
          {path !== '/' && <button type="button" onClick={() => router.push('/')} aria-label="Back to portfolio" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface hover:bg-white/60"><ChevronLeft size={20} /></button>}
          <h1 className="min-w-0 flex-1 font-display text-title-sm font-light md:text-title">{TITLES[path] ?? 'Sitewise'}</h1>
          <button type="button" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-label="Filters" className={clsx('flex h-10 w-10 items-center justify-center rounded-full', showFilters ? 'bg-brand' : 'bg-surface hover:bg-white/60')}><SlidersHorizontal size={18} /></button>
          <Button variant="primary" onClick={primary ? fireCmd : exportProjects}>{primary ?? 'Export report'}</Button>
        </div>
        {showFilters && (
          <div className="mb-6">
            <FilterBar active={(filters.discipline !== 'All' ? 1 : 0) + (filters.range !== 'all' ? 1 : 0)}>
              <PillSelect label="Discipline" value={filters.discipline} onChange={(v) => setFilters({ discipline: v })} options={DISCIPLINES.map((d) => ({ v: d, l: d === 'All' ? 'All disciplines' : d }))} />
              <PillSelect label="Date range" value={filters.range} onChange={(v) => setFilters({ range: v })} options={RANGES.map((r) => ({ v: r.id, l: r.label }))} />
              <SegmentedControl label="Chart period" options={['Weekly', 'Monthly'] as const} value={filters.gran} onChange={(g) => setFilters({ gran: g })} />
              <Button onClick={() => setAuditOpen(true)}><History size={16} aria-hidden />Audit trail</Button>
            </FilterBar>
          </div>
        )}
        <main><Suspense fallback={null}>{children}</Suspense></main>
      </div>
      <AuditDrawer />
      <Toasts />
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <StoreProvider><Frame>{children}</Frame></StoreProvider>;
}
