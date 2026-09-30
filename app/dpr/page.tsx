'use client';
import { Fragment, useState } from 'react';
import { useScoped } from '@/lib/store';
import { fmtNum } from '@/lib/metrics';
import { Button, EmptyState, PageHeader, inputCls } from '@/components/ui';
import type { DprRow } from '@/lib/types';

const TITLE: Record<string, string> = { Civil: 'Civil (concrete, m³)', Structural: 'Structural (fabrication, MT)' };
type Draft = { ftd: string; remarks: string; err?: string };

export default function Dpr() {
  const { dpr, hasDetail, active, updateRow, toast } = useScoped();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const get = (r: DprRow): Draft => drafts[r.id] ?? { ftd: String(r.ftdAct), remarks: r.remarks };
  const set = (r: DprRow, p: Partial<Draft>) => setDrafts((d) => ({ ...d, [r.id]: { ...get(r), ...p, err: undefined } }));

  const save = (r: DprRow) => {
    const d = get(r), ftd = Number(d.ftd);
    const fail = (err: string) => { setDrafts((s) => ({ ...s, [r.id]: { ...d, err } })); toast(err, 'error'); };
    if (d.ftd.trim() === '' || Number.isNaN(ftd) || ftd < 0) return fail('Enter today’s actual as a number of 0 or more.');
    if (ftd < r.ftdPlan && !d.remarks.trim()) return fail(`Add a remark for ${r.building}: actual is below the plan of ${fmtNum(r.ftdPlan)}.`);
    const delta = ftd - r.ftdAct;
    updateRow('dpr', r.id, { ftdAct: ftd, cumAch: r.cumAch + delta, ftmAct: r.ftmAct + delta, weekly: r.weekly + delta, remarks: d.remarks.trim() });
    setDrafts((s) => { const { [r.id]: _, ...rest } = s; return rest; });
    toast('Progress logged');
  };

  const entry = (r: DprRow, sfx: string) => {
    const d = get(r), below = Number(d.ftd) < r.ftdPlan;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <input id={`ftd-${r.id}-${sfx}`} type="number" min={0} inputMode="numeric" aria-label={`Today’s actual for ${r.building}, ${r.vendor}`} value={d.ftd} onChange={(e) => set(r, { ftd: e.target.value })} className={`${inputCls} w-24`} />
          <input type="text" aria-label={`Remarks for ${r.building}, ${r.vendor}`} placeholder={below ? 'Remark required' : 'Remarks'} value={d.remarks} onChange={(e) => set(r, { remarks: e.target.value })} className={`${inputCls} min-w-[160px] flex-1 ${below ? 'border-bad' : ''}`} />
          <Button variant="primary" onClick={() => save(r)} aria-label={`Log progress for ${r.building}, ${r.vendor}`}>Log progress</Button>
        </div>
        {d.err && <p role="alert" className="text-xs text-bad">{d.err}</p>}
      </div>
    );
  };

  const groups = [...new Set(dpr.map((r) => r.discipline))];
  return (
    <>
      <PageHeader title="Daily progress report" lede="Log today’s quantity for each building and vendor. Add a remark when actual is below plan." />
      {!hasDetail ? <EmptyState title={`No daily progress for ${active.name}`} hint="Select Belgaum expansion in the project list to enter progress." /> : !dpr.length ? (
        <EmptyState title="No rows for this discipline" hint="Set the discipline filter to All disciplines, Civil or Structural." />
      ) : (
        <>
          <div className="hidden overflow-auto rounded-lg border border-line bg-white md:block md:max-h-[640px]">
            <table className="tbl w-full">
              <caption className="sr-only">Daily progress by discipline, building and vendor</caption>
              <thead>
                <tr>{['Building', 'Vendor', 'Scope', 'Cum plan', 'Cum achieved', 'FTM plan', 'FTM actual', 'FTD plan', 'Weekly', 'Today’s actual and remarks'].map((h, i) => <th key={h} scope="col" className={i >= 2 && i <= 8 ? 'num' : undefined}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g}>
                    <tr><th scope="rowgroup" colSpan={10} className="!static border-b border-line bg-white !text-sm">{TITLE[g] ?? g}</th></tr>
                    {dpr.filter((r) => r.discipline === g).map((r) => (
                      <tr key={r.id}>
                        <td className="font-semibold">{r.building}</td>
                        <td>{r.vendor}</td>
                        {[r.scope, r.cumPlan, r.cumAch, r.ftmPlan, r.ftmAct, r.ftdPlan, r.weekly].map((n, i) => <td key={i} className="num">{fmtNum(n)}</td>)}
                        <td className="min-w-[380px]">{entry(r, 't')}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-4 md:hidden">
            {groups.map((g) => (
              <section key={g} aria-label={TITLE[g] ?? g}>
                <h2 className="mb-2 text-base font-semibold">{TITLE[g] ?? g}</h2>
                <ul className="flex flex-col gap-3">
                  {dpr.filter((r) => r.discipline === g).map((r) => (
                    <li key={r.id} className="rounded-lg border border-line bg-white p-4">
                      <p className="font-semibold">{r.building}</p>
                      <p className="mb-2 text-sm text-graphite">{r.vendor}</p>
                      <dl className="mb-3 grid grid-cols-3 gap-2 text-sm">
                        {[['Scope', r.scope], ['Cum plan', r.cumPlan], ['Cum achieved', r.cumAch], ['FTM plan', r.ftmPlan], ['FTM actual', r.ftmAct], ['FTD plan', r.ftdPlan]].map(([k, v]) => (
                          <div key={k as string}><dt className="text-xs text-graphite">{k}</dt><dd className="font-medium">{fmtNum(v as number)}</dd></div>
                        ))}
                      </dl>
                      {entry(r, 'm')}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
