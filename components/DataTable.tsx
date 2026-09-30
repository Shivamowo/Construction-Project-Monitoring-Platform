'use client';
import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp } from 'lucide-react';

export interface Column<T> {
  key: string; label: string; render: (r: T) => ReactNode; sortValue?: (r: T) => string | number; num?: boolean;
}

export function DataTable<T>({ cols, rows, rowKey, caption, empty, maxH = 'max-h-[560px]', rowClass }: {
  cols: Column<T>[]; rows: T[]; rowKey: (r: T) => string; caption: string; empty?: ReactNode; maxH?: string; rowClass?: (r: T) => string | undefined;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    const c = cols.find((x) => x.key === sort?.key);
    if (!sort || !c?.sortValue) return rows;
    const f = c.sortValue;
    return [...rows].sort((a, b) => { const x = f(a), y = f(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir; });
  }, [rows, sort, cols]);
  if (!rows.length && empty) return <>{empty}</>;
  return (
    <div className={clsx('overflow-auto rounded-lg border border-line bg-white', maxH)}>
      <table className="tbl w-full">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={clsx(c.num && 'num')} aria-sort={sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
                {c.sortValue ? (
                  <button type="button" className="inline-flex items-center gap-1 font-semibold" onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}>
                    {c.label}
                    {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                ) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} className={rowClass?.(r)}>
              {cols.map((c) => <td key={c.key} className={clsx(c.num && 'num')}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
