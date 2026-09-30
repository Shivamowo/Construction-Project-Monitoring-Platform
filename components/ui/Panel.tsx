'use client';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Avatar, Chip, type Tone } from './index';
import { TileHeader } from './TileHeader';

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

export function DarkPanel({ title, action, tabs, tab, onTab, children, className }: { title?: ReactNode; action?: ReactNode; tabs?: TabDef[]; tab?: string; onTab?: (id: string) => void; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('dark-panel', className)}>
      {title && <TileHeader title={title}>{action}</TileHeader>}
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
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="small w5 block truncate">{title}</span>
        <span className="caption flex flex-wrap items-center gap-2"><span className="tabular">{id}</span>{age && <span>{age}</span>}{owner && <Avatar name={owner} />}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        {status && <Chip tone={status.tone}>{status.label}</Chip>}
        {figure && <span className="fig-r tabular">{figure}</span>}
      </span>
    </button>
  );
}

export function InnerTile({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={clsx('inner', wide && 'sm:col-span-2')}>
      <div className="caption">{label}</div>
      <div className="v tabular">{children}</div>
    </div>
  );
}

export function DetailPane({ title, status, owner, footer, children }: { title: ReactNode; status?: { label: string; tone: Tone }; owner?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="detail">
      <TileHeader as="h3" title={title}>
        {status && <Chip tone={status.tone}>{status.label}</Chip>}
        {owner && <span className="small ic"><Avatar name={owner} />{owner}</span>}
      </TileHeader>
      {children}
      {footer && <footer className="foot">{footer}</footer>}
    </div>
  );
}
