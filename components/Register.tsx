'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowUpDown, ChevronDown, Download, Plus } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/lib/store';
import { downloadCsv } from '@/lib/csv';
import { REPORT_DATE } from '@/lib/brand';
import type { Entity } from '@/lib/types';
import { Button, DarkPanel, DetailPane, Drawer, EmptyState, Field, FilterBar, FilterCluster, HeaderFilters, InnerTile, MasterRow, PillSelect, inputCls, useUrlParams, type Tone } from './ui';

export interface Col<T> {
  key: keyof T & string; label: string; type?: 'text' | 'select' | 'date' | 'number'; options?: string[];
  editable?: boolean; add?: boolean; required?: boolean; render?: (r: T) => ReactNode; wide?: boolean; hideInDetail?: boolean;
}
export interface RegFilter<T> { key: string; label: string; options: string[]; test: (r: T, v: string) => boolean }
export interface RegTab<T> { id: string; label: string; test: (r: T) => boolean }

export function Register<T extends { id: string }>({ entity, noun, rows, cols, filters, tabs, searchKeys, titleKey, ownerOf, statusOf, ageOf, figureOf, closePatch, makeRow, extra, toolbar, addLabel, addedMsg }: {
  entity: Entity; noun: string; rows: T[]; cols: Col<T>[]; filters: RegFilter<T>[]; tabs: RegTab<T>[]; searchKeys: (keyof T)[]; titleKey: keyof T & string;
  ownerOf: (r: T) => string; statusOf: (r: T) => { label: string; tone: Tone }; ageOf: (r: T) => string; figureOf?: (r: T) => ReactNode;
  closePatch: Record<string, unknown>; makeRow: (draft: Record<string, string>) => T; extra?: (r: T) => ReactNode; toolbar?: ReactNode; addLabel?: string; addedMsg?: string;
}) {
  const { updateRow, addRow, toast, cmd, audit } = useStore();
  const url = useUrlParams(Object.fromEntries(filters.map((f) => [f.key, ''])));
  const [q, setQ] = useState('');
  const [tab, setTab] = useState(tabs[0].id);
  const [sort, setSort] = useState({ key: '', dir: 1 });
  const [sel, setSel] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showFields, setShowFields] = useState(true);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const Noun = noun[0].toUpperCase() + noun.slice(1);
  const cmd0 = useRef(cmd);
  useEffect(() => { if (cmd !== cmd0.current) { cmd0.current = cmd; setAdding(true); } }, [cmd]);

  const fv = url.values;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => filters.every((f) => !fv[f.key] || f.test(r, fv[f.key])) && (!needle || searchKeys.some((k) => String(r[k]).toLowerCase().includes(needle))));
  }, [rows, q, fv, filters, searchKeys]);
  const shown = useMemo(() => {
    const t = tabs.find((x) => x.id === tab) ?? tabs[0];
    const list = filtered.filter(t.test);
    if (!sort.key) return list;
    return [...list].sort((a, b) => { const x = String((a as Record<string, unknown>)[sort.key]).toLowerCase(), y = String((b as Record<string, unknown>)[sort.key]).toLowerCase(); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [filtered, tab, tabs, sort]);
  const current = shown.find((r) => r.id === sel) ?? shown[0];

  const commit = (r: T, c: Col<T>, raw: string) => {
    setEdit(null);
    if (c.required && !raw.trim()) return toast(`${c.label} is empty. Enter a value and press Enter to save.`, 'error');
    updateRow(entity, r.id, { [c.key]: c.type === 'number' ? Number(raw) || 0 : raw });
    toast(`${Noun} updated`);
  };
  const editor = (r: T, c: Col<T>, view: ReactNode) => {
    const val = String(r[c.key] ?? '');
    if (!c.editable) return view;
    const k = `${r.id}:${c.key}`;
    if (edit === k) {
      const common = { autoFocus: true, defaultValue: val, 'aria-label': `Edit ${c.label.toLowerCase()}`, className: inputCls };
      return c.type === 'select' ? (
        <select {...common} onChange={(e) => commit(r, c, e.target.value)} onBlur={() => setEdit(null)} onKeyDown={(e) => e.key === 'Escape' && setEdit(null)}>{c.options?.map((o) => <option key={o}>{o}</option>)}</select>
      ) : (
        <input {...common} type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'} onBlur={(e) => commit(r, c, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(r, c, e.currentTarget.value); if (e.key === 'Escape') setEdit(null); }} />
      );
    }
    return <button type="button" onClick={() => setEdit(k)} aria-label={`Edit ${c.label.toLowerCase()}: ${val}`} className="w-full text-left underline decoration-dotted underline-offset-4" style={{ textDecorationColor: 'rgba(255,255,255,.35)' }}>{view}</button>;
  };

  const tc = cols.find((c) => c.key === titleKey)!;
  const save = () => {
    const missing = cols.find((c) => c.add && c.required && !draft[c.key]?.trim());
    if (missing) return toast(`Enter ${missing.label.toLowerCase()} to add the ${noun}.`, 'error');
    const row = makeRow(draft);
    addRow(entity, row);
    setSel(row.id); setTab(tabs[0].id);
    toast(addedMsg ?? `${Noun} added`);
    setAdding(false); setDraft({});
  };
  const exportCsv = () => {
    downloadCsv(entity, cols.map((c) => c.label), shown.map((r) => cols.map((c) => String(r[c.key] ?? ''))));
    toast('CSV exported');
  };
  const trail = current ? audit.filter((a) => a.rowId === current.id).slice(0, 5) : [];
  const activeFilters = Object.values(fv).filter(Boolean).length + (q ? 1 : 0);
  const add = addLabel ?? `Add ${noun}`;

  return (
    <div className="flex flex-col gap-4">
      <HeaderFilters>
        <FilterCluster onClear={url.clear} filters={filters.map((f) => ({ key: f.key, label: f.label, value: fv[f.key], def: '', onChange: (v) => url.set(f.key, v), options: [{ v: '', l: `All` }, ...f.options.map((o) => ({ v: o, l: o }))] }))} />
      </HeaderFilters>
      <FilterBar active={activeFilters} search={{ value: q, onChange: setQ, placeholder: `Search ${noun}s` }}>
        <PillSelect label="Sort by" value={sort.key} onChange={(v) => setSort({ ...sort, key: v })} options={[{ v: '', l: 'Sort: default' }, ...cols.map((c) => ({ v: c.key, l: `Sort: ${c.label.toLowerCase()}` }))]} />
        <button type="button" onClick={() => setSort({ ...sort, dir: sort.dir === 1 ? -1 : 1 })} aria-label={`Sort direction: ${sort.dir === 1 ? 'ascending' : 'descending'}`} className="icon-btn"><ArrowUpDown /></button>
        {toolbar}
        <Button onClick={exportCsv}><Download aria-hidden />Export CSV</Button>
      </FilterBar>
      <DarkPanel title={`${Noun} register`} action={<span className="caption tabular">{shown.length} of {rows.length} shown</span>} tabs={tabs.map((t) => ({ id: t.id, label: t.label, count: filtered.filter(t.test).length }))} tab={tab} onTab={setTab}>
        {!shown.length ? (
          <EmptyState title={`No ${noun}s match. Clear the filters or add a new ${noun}.`} action={{ label: add, onClick: () => setAdding(true) }} />
        ) : (
          <div className="md-grid">
            <ul className="m-0 flex max-h-[680px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1" aria-label={`${Noun} list`}>
              {shown.map((r) => <li key={r.id}><MasterRow selected={r.id === current?.id} onClick={() => setSel(r.id)} title={String(r[titleKey])} id={r.id} age={ageOf(r)} owner={ownerOf(r)} status={statusOf(r)} figure={figureOf?.(r)} /></li>)}
            </ul>
            {current && (
              <DetailPane title={editor(current, tc, String(current[titleKey]))} status={statusOf(current)} owner={ownerOf(current)}
                footer={<>
                  <span className="small flex items-center gap-3" style={{ color: 'var(--fog)' }}>
                    <button type="button" onClick={() => setShowFields(!showFields)} aria-expanded={showFields} className="ic underline underline-offset-4"><ChevronDown className={clsx(showFields ? '' : '-rotate-90')} style={{ transition: 'transform 160ms' }} />{showFields ? 'Hide fields' : 'Show fields'}</button>
                    
                  </span>
                  <span className="flex gap-2">
                    <Button variant="dark" onClick={() => setAdding(true)}><Plus aria-hidden />{add}</Button>
                    {String((current as Record<string, unknown>).status) !== String(closePatch.status) && (
                      <Button variant="primary" onClick={() => { updateRow(entity, current.id, closePatch); toast(`${Noun} closed`); }}>Close {noun}</Button>
                    )}
                  </span>
                </>}>
                <div className={clsx('expand', !showFields && 'closed')}>
                  <div><div className="grid gap-3 sm:grid-cols-2">
                    {cols.filter((c) => c.key !== titleKey && c.key !== 'id' && !c.hideInDetail).map((c) => (
                      <InnerTile key={c.key + c.label} label={c.label} wide={c.wide}>{editor(current, c, c.render ? c.render(current) : String(current[c.key] ?? '') || 'Not set')}</InnerTile>
                    ))}
                  </div></div>
                </div>
                {extra?.(current)}
                <div>
                  <h4 className="label mb-2">Audit trail</h4>
                  {trail.length ? (
                    <ul className="small m-0 flex list-none flex-col gap-1 p-0" style={{ color: 'var(--fog)' }}>
                      {trail.map((a) => <li key={a.id}>{a.kind === 'created' ? 'Created' : `${a.field}: “${a.from || 'empty'}” to “${a.to || 'empty'}”`}, {new Date(a.at).toLocaleString('en-GB')}</li>)}
                    </ul>
                  ) : <p className="small" style={{ color: 'var(--fog)' }}>No changes recorded for {current.id}. Edit a field to start the trail.</p>}
                </div>
              </DetailPane>
            )}
          </div>
        )}
      </DarkPanel>
      <Drawer open={adding} onClose={() => setAdding(false)} title={add}>
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
          {cols.filter((c) => c.add).map((c) => (
            <Field key={c.key} label={c.label + (c.required ? ' (required)' : '')}>
              {c.type === 'select' ? (
                <select className={inputCls} value={draft[c.key] ?? c.options?.[0]} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })}>{c.options?.map((o) => <option key={o}>{o}</option>)}</select>
              ) : (
                <input className={inputCls} type={c.type === 'date' ? 'date' : c.type === 'number' ? 'number' : 'text'} value={draft[c.key] ?? (c.type === 'date' ? REPORT_DATE : '')} onChange={(e) => setDraft({ ...draft, [c.key]: e.target.value })} />
              )}
            </Field>
          ))}
          <Button variant="primary" type="submit">{add}</Button>
        </form>
      </Drawer>
    </div>
  );
}
