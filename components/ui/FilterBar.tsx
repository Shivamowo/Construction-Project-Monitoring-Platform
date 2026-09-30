'use client';
import { ChevronDown, Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function PillSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <span className="relative inline-flex shrink-0">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-10 appearance-none rounded-full bg-surface pl-4 pr-12 text-sm font-medium text-ink">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-tile"><ChevronDown size={16} /></span>
    </span>
  );
}

export function FilterBar({ active = 0, search, children }: { active?: number; search?: { value: string; onChange: (v: string) => void; placeholder: string }; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      <span className="mr-1 flex items-center gap-2 text-sm text-sub">Active filters
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-panel px-1.5 text-xs font-medium text-white">{active}</span>
      </span>
      {children}
      {search && (
        <span className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-4 top-3 text-sub" />
          <input type="search" value={search.value} onChange={(e) => search.onChange(e.target.value)} aria-label={search.placeholder} placeholder={search.placeholder} className="h-10 w-full rounded-full bg-surface pl-10 pr-4 text-sm" />
        </span>
      )}
    </div>
  );
}
