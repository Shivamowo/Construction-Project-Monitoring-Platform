'use client';
import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, History, Plus, Search } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { downloadCsv } from '@/lib/csv';
import type { Entity } from '@/lib/types';
import { DataTable, type Column } from './DataTable';
import { Button, Drawer, EmptyState, Field, inputCls } from './ui';

export interface Col<T> {
  key: keyof T & string; label: string; type?: 'text' | 'select' | 'date' | 'number'; options?: string[];
  editable?: boolean; add?: boolean; required?: boolean; num?: boolean; render?: (r: T) => ReactNode; sortValue?: (r: T) => string | number;
}
export interface RegFilter<T> { key: string; label: string; options: string[]; test: (r: T, v: string) => boolean }

export function Register<T extends { id: string }>({ entity, noun, rows, cols, filters, searchKeys, makeRow, rowActions, rowClass }: {
  entity: Entity; noun: string; rows: T[]; cols: Col<T>[]; filters: RegFilter<T>[]; searchKeys: (keyof T)[];
  makeRow: (draft: Record<string, string>) => T; rowActions?: (r: T) => ReactNode; rowClass?: (r: T) => string | undefined;
}) {
  const { updateRow, addRow, toast, setAuditOpen } = useStore();
  const sp = useSearchParams();
  const [q, setQ] = useState('');
  const [fv, setFv] = useState<Record<string, string>>(() => Object.fromEntries(filters.map((f) => [f.key, sp.get(f.key) ?? ''])));
  const [edit, setEdit] = useState<{ id: string; key: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const Noun = noun[0].toUpperCase() + noun.slice(1);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => filters.every((f) => !fv[f.key] || f.test(r, fv[f.key])) && (!needle || searchKeys.some((k) => String(r[k]).toLowerCase().includes(needle))));
  }, [rows, q, fv, filters, searchKeys]);

  const commit = (r: T, c: Col<T>, raw: string) => {
    setEdit(null);
    if (c.required && !raw.trim()) return toast(`${c.label} is empty. Enter a value and press Enter to save.`, 'error');
    updateRow(entity, r.id, { [c.key]: c.type === 'number' ? Number(raw) || 0 : raw });
    toast(`${Noun} updated`);
  };

  const cell = (r: T, c: Col<T>) => {
    const val = String(r[c.key] ?? '');
    const view = c.render ? c.render(r) : val || <span className="text-graphite">Not set</span>;
    if (!c.editable) return view;
    if (edit?.id === r.id && edit.key === c.key) {
      const common = { autoFocus: true, defaultValue: val, 'aria-label': `Edit ${c.label.toLowerCase()}`, className: clsx(inputCls, 'min-w-[120px]') };
      return c.type === 'select' ? (
        <select {...common} onChange={(e) => commit(r, c, e.target.value)} onBlur={() => setEdit(null)} onKeyDown={(e) => e.key === 'Escape' && setEdit(null)}>
          {c.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input {...common} type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
          onBlur={(e) => commit(r, c, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') commit(r, c, e.currentTarget.value); if (e.key === 'Escape') setEdit(null); }} />
      );
    }
    return (
      <button type="button" onClick={() => setEdit({ id: r.id, key: c.key })} aria-label={`Edit ${c.label.toLowerCase()}: ${val}`} className="min-h-[28px] w-full rounded px-1 text-left hover:bg-mist">
        {view}
      </button>
    );
  };

  const tableCols: Column<T>[] = [
    ...cols.map((c) => ({ key: c.key, label: c.label, num: c.num, sortValue: c.sortValue ?? ((r: T) => (c.type === 'number' ? Number(r[c.key]) : String(r[c.key]).toLowerCase())), render: (r: T) => cell(r, c) })),
    ...(rowActions ? [{ key: '_a', label: 'Actions', render: (r: T) => <div className="flex gap-1">{rowActions(r)}</div> }] : []),
  ];

  const save = () => {
    const missing = cols.find((c) => c.add && c.required && !draft[c.key]?.trim());
    if (missing) return toast(`Enter ${missing.label.toLowerCase()} to add the ${noun}.`, 'error');
    addRow(entity, makeRow(draft));
    toast(`${Noun} added`);
    setAdding(false); setDraft({});
  };

  const exportCsv = () => {
    downloadCsv(entity, cols.map((c) => c.label), shown.map((r) => cols.map((c) => String(r[c.key] ?? ''))));
    toast('CSV exported');
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-2.5 top-2.5 text-graphite" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Search ${noun}s`} placeholder={`Search ${noun}s`} className={clsx(inputCls, 'pl-8')} />
        </div>
        {filters.map((f) => (
          <select key={f.key} aria-label={f.label} value={fv[f.key]} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} className={clsx(inputCls, 'w-auto')}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ))}
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setAuditOpen(true)}><History size={16} aria-hidden />Audit trail</Button>
          <Button onClick={exportCsv}><Download size={16} aria-hidden />Export CSV</Button>
          <Button variant="primary" onClick={() => setAdding(true)}><Plus size={16} aria-hidden />Add {noun}</Button>
        </div>
      </div>
      <p className="mb-2 text-xs text-graphite" aria-live="polite">{shown.length} of {rows.length} {noun}s shown. Select a cell to edit it.</p>
      <DataTable cols={tableCols} rows={shown} rowKey={(r) => r.id} caption={`${Noun} register`} rowClass={rowClass}
        empty={<EmptyState title={`No ${noun}s match`} hint={`Clear the search or filters, or add a new ${noun}.`}><Button onClick={() => { setQ(''); setFv(Object.fromEntries(filters.map((f) => [f.key, '']))); }}>Clear filters</Button></EmptyState>} />
      <Drawer open={adding} onClose={() => setAdding(false)} title={`Add ${noun}`}>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          {cols.filter((c) => c.add).map((c) => (
            <Field key={c.key} label={c.label + (c.required ? ' (required)' : '')}>
              {c.type === 'select' ? (
                <select className={inputCls} value={draft[c.key] ?? c.options?.[0]} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}>{c.options?.map((o) => <option key={o}>{o}</option>)}</select>
              ) : (
                <input className={inputCls} type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'} value={draft[c.key] ?? ''} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })} />
              )}
            </Field>
          ))}
          <Button variant="primary" type="submit">Add {noun}</Button>
        </form>
      </Drawer>
    </div>
  );
}
