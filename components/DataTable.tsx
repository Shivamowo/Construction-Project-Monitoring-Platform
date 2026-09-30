'use client';
import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TileHeader } from './ui/TileHeader';

export interface Column<T> {
  key: string; label: string; render: (r: T) => ReactNode; sortValue?: (r: T) => string | number;
  /** Numeric columns align right with tabular figures; dates stay left with tabular figures. */
  num?: boolean; date?: boolean; w?: string;
}

export function DataTable<T>({ cols, rows, rowKey, caption, title, action, empty, maxH = 560, minW = 760 }: {
  cols: Column<T>[]; rows: T[]; rowKey: (r: T) => string; caption: string; title?: string; action?: ReactNode; empty?: ReactNode; maxH?: number; minW?: number;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    const c = cols.find((x) => x.key === sort?.key);
    if (!sort || !c?.sortValue) return rows;
    const f = c.sortValue;
    return [...rows].sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [rows, sort, cols]);
  if (!rows.length && empty) return <>{empty}</>;
  const cls = (c: Column<T>) => clsx(c.num && 'num', c.date && 'date');
  return (
    <section className="tile tile-white">
      {title && <TileHeader title={title}>{action}</TileHeader>}
      <div className="table-wrap" style={{ maxHeight: maxH }}>
        <table className="tbl" style={{ minWidth: minW }}>
          <caption className="sr-only">{caption}</caption>
          <colgroup>{cols.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} scope="col" className={cls(c)} aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                  {c.sortValue ? (
                    <button type="button" className={clsx('inline-flex items-center gap-1', c.num && 'flex-row-reverse')} onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}>
                      {c.label}
                      {sort?.key === c.key && (sort.dir === 1 ? <ChevronUp /> : <ChevronDown />)}
                    </button>
                  ) : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => <tr key={rowKey(r)}>{cols.map((c) => <td key={c.key} className={cls(c)}>{c.render(r)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
