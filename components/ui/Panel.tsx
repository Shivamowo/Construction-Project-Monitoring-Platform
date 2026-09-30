'use client';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Avatar, Chip, type Tone } from './index';

export interface TabDef { id: string; label: string; count?: number }

export function TabNotch({ tabs, value, onChange }: { tabs: TabDef[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="tabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)} className="tab">
          {t.label}{t.count !== undefined && <span className="n">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DarkPanel({ tabs, tab, onTab, children, className }: { tabs?: TabDef[]; tab?: string; onTab?: (id: string) => void; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('dark-panel', className)}>
      {tabs && <TabNotch tabs={tabs} value={tab ?? tabs[0].id} onChange={onTab ?? (() => {})} />}
      {children}
    </section>
  );
}

export function MasterRow({ selected, onClick, title, id, age, owner, status, figure }: {
  selected: boolean; onClick: () => void; title: string; id: string; age?: string; owner?: string; status?: { label: string; tone: Tone }; figure?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-current={selected} className={clsx('row', selected && 'sel')}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--fog)' }}>
          <span>{id}</span>{age && <span>{age}</span>}{owner && <Avatar name={owner} size={24} />}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {status && <Chip tone={status.tone}>{status.label}</Chip>}
        {figure && <span className="text-lg font-light">{figure}</span>}
      </span>
    </button>
  );
}

export function InnerTile({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={clsx('inner', wide && 'sm:col-span-2')}>
      <div className="k">{label}</div>
      <div className="v">{children}</div>
    </div>
  );
}

export function DetailPane({ title, status, owner, footer, children }: { title: ReactNode; status?: { label: string; tone: Tone }; owner?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="detail">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="m-0 min-w-0 flex-1 text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          {status && <Chip tone={status.tone}>{status.label}</Chip>}
          {owner && <span className="flex items-center gap-2 text-sm"><Avatar name={owner} size={28} />{owner}</span>}
        </div>
      </header>
      {children}
      {footer && <footer className="foot">{footer}</footer>}
    </div>
  );
}
