'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useScoped } from '@/lib/store';
import { fmtNum } from '@/lib/metrics';
import { Button, Drawer, EmptyState, Field, FilterBar, PillSelect, StripeBar, inputCls, toneFor } from '@/components/ui';
import type { DprRow } from '@/lib/types';

const TITLE: Record<string, string> = { Civil: 'Civil (concrete, m³)', Structural: 'Structural (fabrication, MT)' };

function Entry({ r, onDone }: { r: DprRow; onDone: () => void }) {
  const { updateRow, toast } = useScoped();
  const [ftd, setFtd] = useState(String(r.ftdAct));
  const [remarks, setRemarks] = useState(r.remarks);
  const [err, setErr] = useState('');
  const below = ftd.trim() !== '' && Number(ftd) < r.ftdPlan;
  const save = () => {
    const n = Number(ftd);
    const fail = (m: string) => { setErr(m); toast(m, 'error'); };
    if (ftd.trim() === '' || Number.isNaN(n) || n < 0) return fail('Enter today’s actual as a number of 0 or more.');
    if (n < r.ftdPlan && !remarks.trim()) return fail(`Add a remark: today’s actual is below the plan of ${fmtNum(r.ftdPlan)}.`);
    const delta = n - r.ftdAct;
    updateRow('dpr', r.id, { ftdAct: n, cumAch: r.cumAch + delta, ftmAct: r.ftmAct + delta, weekly: r.weekly + delta, remarks: remarks.trim() });
    toast('Progress logged');
    onDone();
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="rounded-xl bg-tile p-4 text-sm">
        <p className="font-medium">{r.building}</p><p className="text-sub">{r.vendor}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {[['Scope', r.scope], ['Cum plan', r.cumPlan], ['Cum achieved', r.cumAch], ['FTM plan', r.ftmPlan], ['FTM actual', r.ftmAct], ['Weekly', r.weekly]].map(([k, v]) => <div key={k as string}><dt className="text-xs text-sub">{k}</dt><dd className="text-lg">{fmtNum(v as number)}</dd></div>)}
        </dl>
      </div>
      <Field label={`Today’s actual (plan ${fmtNum(r.ftdPlan)} ${r.unit})`}><input type="number" min={0} inputMode="numeric" value={ftd} onChange={(e) => { setFtd(e.target.value); setErr(''); }} className={inputCls} /></Field>
      <Field label={below ? 'Remarks (required)' : 'Remarks'}><input value={remarks} onChange={(e) => { setRemarks(e.target.value); setErr(''); }} className={`${inputCls} ${below ? 'border-bad' : ''}`} /></Field>
      {err && <p role="alert" className="text-sm text-bad">{err}</p>}
      <Button variant="primary" type="submit">Log progress</Button>
    </form>
  );
}

export default function Dpr() {
  const { dpr, hasDetail, active, cmd } = useScoped();
  const [q, setQ] = useState('');
  const [vendor, setVendor] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const cmd0 = useRef(cmd);
  const rows = dpr.filter((r) => (!vendor || r.vendor === vendor) && (!q || `${r.building} ${r.vendor}`.toLowerCase().includes(q.toLowerCase())));
  useEffect(() => { if (cmd !== cmd0.current) { cmd0.current = cmd; if (rows[0]) setOpenId(rows[0].id); } }, [cmd, rows]);
  const cur = dpr.find((r) => r.id === openId);
  const groups = [...new Set(rows.map((r) => r.discipline))];
  const bar = (r: DprRow) => (
    <div className="flex min-w-[140px] items-center gap-3">
      <StripeBar label={`${r.building} achieved`} value={r.scope ? (r.cumAch / r.scope) * 100 : 0} plan={r.scope ? (r.cumPlan / r.scope) * 100 : undefined} color={toneFor(r.cumAch, r.cumPlan)} />
      <span className="w-10 text-right text-xs">{r.scope ? Math.round((r.cumAch / r.scope) * 100) : 0}%</span>
    </div>
  );

  if (!hasDetail) return <EmptyState title={`No daily progress is loaded for ${active.name}. Select Belgaum expansion to enter progress.`} />;
  return (
    <div className="flex flex-col gap-4">
      <FilterBar active={(vendor ? 1 : 0) + (q ? 1 : 0)} search={{ value: q, onChange: setQ, placeholder: 'Search buildings' }}>
        <PillSelect label="Vendor" value={vendor} onChange={setVendor} options={[{ v: '', l: 'Vendor: all' }, ...[...new Set(dpr.map((r) => r.vendor))].map((v) => ({ v, l: v }))]} />
      </FilterBar>
      {!rows.length ? <EmptyState title="No rows match. Clear the filters or set the discipline to All disciplines." action={{ label: 'Clear filters', onClick: () => { setQ(''); setVendor(''); } }} /> : (
        <>
          <div className="hidden max-h-[720px] overflow-auto rounded-xl bg-surface md:block">
            <table className="tbl w-full">
              <caption className="sr-only">Daily progress by discipline, building and vendor. Select a row to enter today’s progress.</caption>
              <thead><tr>{['Building', 'Vendor', 'Scope', 'Cum plan', 'Cum achieved', 'FTM plan', 'FTM actual', 'FTD plan', 'FTD actual', 'Weekly', 'Achieved', 'Remarks'].map((h, i) => <th key={h} scope="col" className={i >= 2 && i <= 9 ? 'num' : undefined}>{h}</th>)}</tr></thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g}>
                    <tr><th scope="rowgroup" colSpan={12} className="!static !bg-canvas !text-sm">{TITLE[g] ?? g}</th></tr>
                    {rows.filter((r) => r.discipline === g).map((r) => (
                      <tr key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                        <td><button type="button" className="text-left font-medium" onClick={(e) => { e.stopPropagation(); setOpenId(r.id); }}>{r.building}</button></td>
                        <td>{r.vendor}</td>
                        {[r.scope, r.cumPlan, r.cumAch, r.ftmPlan, r.ftmAct, r.ftdPlan, r.ftdAct, r.weekly].map((n, i) => <td key={i} className={`num ${i === 6 && n < r.ftdPlan ? 'text-bad' : ''}`}>{fmtNum(n)}</td>)}
                        <td>{bar(r)}</td>
                        <td className="max-w-[200px] truncate text-sub">{r.remarks || 'None'}</td>
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
                <h2 className="mb-2 text-base font-medium">{TITLE[g] ?? g}</h2>
                <ul className="flex flex-col gap-2">
                  {rows.filter((r) => r.discipline === g).map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setOpenId(r.id)} className="flex w-full flex-col gap-3 rounded-xl bg-surface p-4 text-left">
                        <span><span className="block font-medium">{r.building}</span><span className="text-sm text-sub">{r.vendor}</span></span>
                        {bar(r)}
                        <span className="flex justify-between text-sm"><span>FTD plan {fmtNum(r.ftdPlan)}</span><span className={r.ftdAct < r.ftdPlan ? 'text-bad' : ''}>FTD actual {fmtNum(r.ftdAct)}</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
      <Drawer open={!!cur} onClose={() => setOpenId(null)} title="Enter daily progress">{cur && <Entry key={cur.id} r={cur} onDone={() => setOpenId(null)} />}</Drawer>
    </div>
  );
}
