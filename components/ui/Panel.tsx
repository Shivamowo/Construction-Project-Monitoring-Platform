'use client';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Avatar, Chip, type Tone } from './index';
import { DarkCtx } from './dark';

export interface TabDef { id: string; label: string; count?: number }

export function TabNotch({ tabs, value, onChange }: { tabs: TabDef[]; value: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="absolute left-0 top-0 flex max-w-full gap-1 overflow-x-auto rounded-br-2xl rounded-tl-3xl bg-surface p-2">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={t.id === value} onClick={() => onChange(t.id)}
          className={clsx('flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium', t.id === value ? 'bg-brand text-ink' : 'text-ink hover:bg-tile')}>
          {t.label}
          {t.count !== undefined && <span className={clsx('flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs', t.id === value ? 'bg-ink text-white' : 'bg-tile')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function DarkPanel({ tabs, tab, onTab, children, className }: { tabs?: TabDef[]; tab?: string; onTab?: (id: string) => void; children: ReactNode; className?: string }) {
  return (
    <DarkCtx.Provider value>
      <section className={clsx('dark-scope relative rounded-3xl bg-panel p-4 text-white sm:p-6', tabs ? 'pt-[76px] sm:pt-[84px]' : '', className)}>
        {tabs && <TabNotch tabs={tabs} value={tab ?? tabs[0].id} onChange={onTab ?? (() => {})} />}
        {children}
      </section>
    </DarkCtx.Provider>
  );
}

export function MasterRow({ selected, onClick, title, id, age, owner, status, figure }: {
  selected: boolean; onClick: () => void; title: string; id: string; age?: string; owner?: string; status?: { label: string; tone: Tone }; figure?: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-current={selected} className={clsx('flex w-full items-center gap-3 rounded-lg p-4 text-left', selected ? 'border-l-[3px] border-brand bg-rowsel' : 'border-l-[3px] border-transparent bg-row hover:bg-rowsel/60')}>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fog">
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
    <div className={clsx('min-w-0 rounded-lg bg-white/10 p-3', wide && 'sm:col-span-2')}>
      <div className="text-xs text-fog">{label}</div>
      <div className="mt-0.5 break-words text-lg">{children}</div>
    </div>
  );
}

export function DetailPane({ title, status, owner, footer, children }: { title: ReactNode; status?: { label: string; tone: Tone }; owner?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-steel p-4 text-white sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1 text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          {status && <Chip tone={status.tone}>{status.label}</Chip>}
          {owner && <span className="flex items-center gap-2 text-sm"><Avatar name={owner} size={28} />{owner}</span>}
        </div>
      </header>
      {children}
      {footer && <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-black/20 p-3">{footer}</footer>}
    </div>
  );
}
