'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useScoped } from '@/lib/store';
import { shortfall, sum } from '@/lib/metrics';
import { num, pct } from '@/lib/format';
import { REPORT_DATE } from '@/lib/brand';
import { Button, Drawer, EmptyState, Field, FilterCluster, HeaderFilters, KpiCard, StatusChip, StripeBar, inputCls, toneFor, useUrlParams } from '@/components/ui';
import { DISCIPLINES } from '@/lib/store';
import type { DprRow } from '@/lib/types';

const TITLE: Record<string, string> = { Civil: 'Civil (concrete, m³)', Structural: 'Structural (fabrication, MT)' };
const REASONS = ['Mobilization', 'Access constraint', 'Awaiting front'];

function Entry({ r, onDone }: { r: DprRow; onDone: () => void }) {
  const { updateRow, toast } = useScoped();
  const [ftd, setFtd] = useState(String(r.ftdAct));
  const [reason, setReason] = useState(r.remarks);
  const [err, setErr] = useState('');
  const n = Number(ftd);
  const newFtm = r.ftmAct + (Number.isNaN(n) ? 0 : n - r.ftdAct);
  const behind = shortfall(r.ftmPlan, newFtm);
  const save = () => {
    const fail = (m: string) => { setErr(m); toast(m, 'error'); };
    if (ftd.trim() === '' || Number.isNaN(n) || n < 0) return fail('Enter today’s actual as a number of 0 or more.');
    if (behind > 0 && !reason) return fail(`Choose a reason: this activity is ${num(behind)} behind plan for the month.`);
    updateRow('dpr', r.id, { ftdAct: n, cumAch: r.cumAch + (n - r.ftdAct), ftmAct: newFtm, weekly: r.weekly + (n - r.ftdAct), remarks: behind > 0 ? reason : '' });
    toast('Progress logged');
    onDone();
  };
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="tile text-sm">
        <p className="m-0 font-medium">{r.building}</p><p className="m-0 label">{r.vendor}</p>
        <dl className="m-0 mt-3 grid grid-cols-3 gap-2">
          {[['Scope', r.scope], ['Cum plan', r.cumPlan], ['Cum actual', r.cumAch], ['Plan FTM', r.ftmPlan], ['Actual FTM', r.ftmAct], ['Weekly', r.weekly]].map(([k, v]) => <div key={k as string}><dt className="text-xs label">{k}</dt><dd className="m-0 text-lg">{num(v as number)}</dd></div>)}
        </dl>
      </div>
      <Field label={`Today’s actual (plan ${num(r.ftdPlan)} ${r.unit})`}><input type="number" min={0} inputMode="numeric" value={ftd} onChange={(e) => { setFtd(e.target.value); setErr(''); }} className={inputCls} /></Field>
      <Field label={behind > 0 ? `Reason (required, ${num(behind)} behind)` : 'Reason'}>
        <select value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }} className={inputCls} style={behind > 0 && !reason ? { borderColor: 'var(--red)' } : undefined}>
          <option value="">{behind > 0 ? 'Choose a reason' : 'No reason needed'}</option>{REASONS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      {err && <p role="alert" className="m-0 text-sm" style={{ color: 'var(--red)' }}>{err}</p>}
      <Button variant="primary" type="submit">Log progress</Button>
    </form>
  );
}

export default function Dpr() {
  const { dpr, hasDetail, active, cmd, filters, setFilters, trends } = useScoped();
  const url = useUrlParams({ date: REPORT_DATE, vendor: '' });
  const [openId, setOpenId] = useState<string | null>(null);
  const cmd0 = useRef(cmd);
  const rows = dpr.filter((r) => !url.values.vendor || r.vendor === url.values.vendor);
  const dateOk = url.values.date === REPORT_DATE;
  const shown = dateOk ? rows : [];
  useEffect(() => { if (cmd !== cmd0.current) { cmd0.current = cmd; if (shown[0]) setOpenId(shown[0].id); } }, [cmd, shown]);
  const cur = dpr.find((r) => r.id === openId);
  const groups = [...new Set(shown.map((r) => r.discipline))];
  const scope = sum(shown.map((r) => r.scope)), plan = sum(shown.map((r) => r.cumPlan)), ach = sum(shown.map((r) => r.cumAch)), tp = sum(shown.map((r) => r.ftdPlan)), ta = sum(shown.map((r) => r.ftdAct));
  const vendors = [...new Set(dpr.map((r) => r.vendor))];

  const bar = (r: DprRow) => (
    <div className="flex min-w-[140px] items-center gap-3">
      <StripeBar label={`${r.building} achieved`} value={r.scope ? (r.cumAch / r.scope) * 100 : 0} plan={r.scope ? (r.cumPlan / r.scope) * 100 : undefined} color={toneFor(r.cumAch, r.cumPlan)} />
      <span className="w-10 text-right text-xs">{r.scope ? Math.round((r.cumAch / r.scope) * 100) : 0}%</span>
    </div>
  );
  const behind = (r: DprRow) => {
    const n = shortfall(r.ftmPlan, r.ftmAct);
    return n > 0 ? <span className="flex flex-col items-start gap-1"><StatusChip tone="warn">{num(n)} behind</StatusChip><span className="text-xs label">{r.remarks || 'Reason needed'}</span></span> : <StatusChip tone="good">On plan</StatusChip>;
  };

  return (
    <>
      <HeaderFilters>
        <FilterCluster onClear={() => { url.clear(); setFilters({ discipline: 'All' }); }} filters={[
          { key: 'date', label: 'Date', type: 'date', value: url.values.date, def: REPORT_DATE, onChange: (v) => url.set('date', v) },
          { key: 'discipline', label: 'Discipline', value: filters.discipline, def: 'All', onChange: (v) => setFilters({ discipline: v }), options: DISCIPLINES.filter((d) => d === 'All' || d === 'Civil' || d === 'Structural').map((d) => ({ v: d, l: d === 'All' ? 'All' : d })) },
          { key: 'vendor', label: 'Vendor', value: url.values.vendor, def: '', onChange: (v) => url.set('vendor', v), options: [{ v: '', l: 'All' }, ...vendors.map((v) => ({ v, l: v }))] },
        ]} />
      </HeaderFilters>
      <div className="kpi-grid c5">
        <KpiCard label="Scope qty" value={num(scope)} rail="neutral" context={`${shown.length} activities`} />
        <KpiCard label="Plan till date" value={num(plan)} rail="neutral" spark={trends.planned} context={`${scope ? Math.round((plan / scope) * 100) : 0}% of scope`} />
        <KpiCard label="Achieved" value={num(ach)} rail={ach >= plan ? 'good' : 'caution'} spark={trends.achieved} context={`${scope ? Math.round((ach / scope) * 100) : 0}% of scope`} />
        <KpiCard label="Today plan" value={num(tp)} rail="neutral" context="Planned quantity for today" />
        <KpiCard label="Today actual" value={num(ta)} rail={ta >= tp ? 'good' : 'caution'} context={`${tp ? Math.round((ta / tp) * 100) : 0}% of plan`} />
      </div>
      {!hasDetail ? <EmptyState title={`No daily progress is loaded for ${active.name}. Select Belgaum expansion to enter progress.`} /> : !dateOk ? (
        <EmptyState title={`No progress was logged for this date. Set the date back to the report date.`} action={{ label: 'Use report date', onClick: () => url.set('date', REPORT_DATE) }} />
      ) : !shown.length ? <EmptyState title="No rows match. Clear the filters to see every activity." action={{ label: 'Clear filters', onClick: () => { url.clear(); setFilters({ discipline: 'All' }); } }} /> : (
        <>
          <div className="tile-white hidden max-h-[720px] overflow-auto !p-0 md:block">
            <table className="tbl w-full">
              <caption className="sr-only">Daily progress by discipline, building and vendor. Select a building to enter today’s progress.</caption>
              <thead><tr>{['Building or activity', 'Vendor', 'Scope', 'Cum plan', 'Cum actual', 'Plan FTM', 'Actual FTM', 'Achieved', 'Shortfall'].map((h, i) => <th key={h} scope="col" className={i >= 2 && i <= 6 ? 'num' : undefined}>{h}</th>)}</tr></thead>
              <tbody>
                {groups.map((g) => (
                  <Fragment key={g}>
                    <tr><th scope="rowgroup" colSpan={9} style={{ position: 'static', background: 'var(--canvas)', fontSize: 14 }}>{TITLE[g] ?? g}</th></tr>
                    {shown.filter((r) => r.discipline === g).map((r) => (
                      <tr key={r.id}>
                        <td><button type="button" className="text-left font-medium underline underline-offset-4" onClick={() => setOpenId(r.id)}>{r.building}</button></td>
                        <td>{r.vendor}</td>
                        {[r.scope, r.cumPlan, r.cumAch, r.ftmPlan, r.ftmAct].map((n, i) => <td key={i} className="num">{num(n)}</td>)}
                        <td>{bar(r)}</td>
                        <td>{behind(r)}</td>
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
                <h2 className="mb-2 mt-0 text-base font-medium">{TITLE[g] ?? g}</h2>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {shown.filter((r) => r.discipline === g).map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => setOpenId(r.id)} className="tile-white flex w-full flex-col gap-3 text-left">
                        <span><span className="block font-medium">{r.building}</span><span className="text-sm label">{r.vendor}</span></span>
                        {bar(r)}
                        <span className="flex items-center justify-between text-sm"><span>Plan FTM {num(r.ftmPlan)}, actual {num(r.ftmAct)}</span>{behind(r)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
      <Drawer open={!!cur} onClose={() => setOpenId(null)} title="Log progress">{cur && <Entry key={cur.id} r={cur} onDone={() => setOpenId(null)} />}</Drawer>
    </>
  );
}
