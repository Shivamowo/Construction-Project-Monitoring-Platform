'use client';
import { ChevronDown, Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function PillSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <span className="pill-select">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <span aria-hidden className="chev"><ChevronDown size={16} /></span>
    </span>
  );
}

export function FilterBar({ active = 0, search, children }: { active?: number; search?: { value: string; onChange: (v: string) => void; placeholder: string }; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      <span className="label mr-1 flex items-center gap-2">Active filters
        <span className="grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-medium" style={{ background: 'var(--panel)', color: '#fff' }}>{active}</span>
      </span>
      {children}
      {search && (
        <span className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-4 top-3.5" style={{ color: 'var(--muted)' }} />
          <input type="search" value={search.value} onChange={(e) => search.onChange(e.target.value)} aria-label={search.placeholder} placeholder={search.placeholder} className="input" style={{ paddingLeft: 40, border: 0 }} />
        </span>
      )}
    </div>
  );
}
