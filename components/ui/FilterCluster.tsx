'use client';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export interface FilterDef { key: string; label: string; value: string; def: string; options?: { v: string; l: string }[]; type?: 'date'; onChange: (v: string) => void }

export function FilterCluster({ filters, onClear }: { filters: FilterDef[]; onClear?: () => void }) {
  const active = filters.filter((f) => f.value !== f.def);
  return (
    <div className="flex flex-wrap items-end justify-end gap-2" role="group" aria-label="Filters">
      {filters.map((f) => {
        const on = f.value !== f.def;
        return (
          <label key={f.key} className="fpill">
            <span className="cap">{f.label}{on && <i className="adot" aria-hidden />}</span>
            {f.type === 'date'
              ? <input type="date" value={f.value} onChange={(e) => f.onChange(e.target.value || f.def)} />
              : <select value={f.value} onChange={(e) => f.onChange(e.target.value)}>{f.options?.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>}
            <span aria-hidden className="chev"><ChevronDown /></span>
          </label>
        );
      })}
      {active.length > 0 && <button type="button" className="link-btn" onClick={() => (onClear ? onClear() : filters.forEach((f) => f.onChange(f.def)))}>Clear filters</button>}
    </div>
  );
}

/** Renders its children into the page header slot in the shell. */
export function HeaderFilters({ children }: { children: React.ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => { setEl(document.getElementById('header-slot')); }, []);
  return el ? createPortal(children, el) : null;
}

/** Filter values kept in the URL so views can be shared. */
export function useUrlParams(defs: Record<string, string>) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const values = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, sp.get(k) ?? d])) as Record<string, string>;
  const write = useCallback((mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(window.location.search);
    mut(p);
    const q = p.toString();
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [router, path]);
  const set = (k: string, v: string) => write((p) => { if (v === defs[k] || v === '') p.delete(k); else p.set(k, v); });
  const clear = () => write((p) => Object.keys(defs).forEach((k) => p.delete(k)));
  return { values, set, clear };
}
