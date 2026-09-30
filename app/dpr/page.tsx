'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useScoped } from '@/lib/store';
import { shortfall, sum } from '@/lib/metrics';
import { num } from '@/lib/format';
import { dprDaily, monthShortfall } from '@/lib/series';
import { ShortfallCalendar } from '@/components/viz';
import { ChartLegend } from '@/components/ChartLegend';
import { ChevronDown } from 'lucide-react';
import { REPORT_DATE } from '@/lib/brand';
import { Button, Drawer, EmptyState, Field, FilterCluster, HeaderFilters, KpiCard, KpiRow, StatusChip, StripeBar, Tile, TileHeader, inputCls, toneFor, useUrlParams } from '@/components/ui';
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
      <div className="tile small">
        <p className="w5">{r.building}</p><p className="muted">{r.vendor}</p>
        <dl className="m-0 mt-3 grid grid-cols-3 gap-2">
          {[['Scope', r.scope], ['Cum plan', r.cumPlan], ['Cum actual', r.cumAch], ['Plan FTM', r.ftmPlan], ['Actual FTM', r.ftmAct], ['Weekly', r.weekly]].map(([k, v]) => <div key={k as string}><dt className="caption">{k}</dt><dd className="body m-0 tabular">{num(v as number)}</dd></div>)}
        </dl>
      </div>
      <Field label={`Today’s actual (plan ${num(r.ftdPlan)} ${r.unit})`}><input type="number" min={0} inputMode="numeric" value={ftd} onChange={(e) => { setFtd(e.target.value); setErr(''); }} className={inputCls} /></Field>
      <Field label={behind > 0 ? `Reason (required, ${num(behind)} behind)` : 'Reason'}>
        <select value={reason} onChange={(e) => { setReason(e.target.value); setErr(''); }} className={inputCls} style={behind > 0 && !reason ? { borderColor: 'var(--red)' } : undefined}>
          <option value="">{behind > 0 ? 'Choose a reason' : 'No reason needed'}</option>{REASONS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </Field>
      {err && <p role="alert" className="small t-bad">{err}</p>}
      <Button variant="primary" type="submit">Log progress</Button>
    </form>
  );
}

function Trend14({ r }: { r: DprRow }) {
  const d = dprDaily(r, 14), W = 280, H = 64;
  const max = Math.max(...d.map((x) => Math.max(x.plan, x.actual)), 1);
  const px = (i: number) => (i / (d.length - 1)) * (W - 8) + 4, py = (v: number) => H - 4 - (v / max) * (H - 8);
  const short = d.filter((x) => x.actual < x.plan).length;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${r.building}: last 14 days, actual below plan on ${short} days. Today ${r.ftdAct} against ${r.ftdPlan}.`}>
        <polyline points={d.map((x, i) => `${px(i)},${py(x.plan)}`).join(' ')} fill="none" stroke="#9AA0AE" strokeWidth="1.5" strokeDasharray="4 3" />
        <polyline points={d.map((x, i) => `${px(i)},${py(x.actual)}`).join(' ')} fill="none" stroke="#2E2E38" strokeWidth="2" strokeLinejoin="round" />
        {d.map((x, i) => x.actual < x.plan && <circle key={i} cx={px(i)} cy={py(x.actual)} r="2.5" fill="#E08A1E" />)}
      </svg>
      <div className="flex flex-col gap-1">
        <ChartLegend items={[{ label: 'Daily plan', color: '#9AA0AE', line: true, dashed: true }, { label: 'Daily actual', color: '#2E2E38', line: true }, { label: 'Below plan', color: '#E08A1E' }]} />
        <span className="caption">Last 14 days to the report date. Earlier days are estimated from the logged daily rate.</span>
      </div>
    </div>
  );
}

export default function Dpr() {
  const { dpr, hasDetail, active, cmd, filters, setFilters, trends } = useScoped();
  const url = useUrlParams({ date: REPORT_DATE, vendor: '' });
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const cmd0 = useRef(cmd);
  const rows = dpr.filter((r) => !url.values.vendor || r.vendor === url.values.vendor);
  const dateOk = url.values.date === REPORT_DATE;
  const shown = dateOk ? rows : [];
  useEffect(() => { if (cmd !== cmd0.current) { cmd0.current = cmd; if (shown[0]) setOpenId(shown[0].id); } }, [cmd, shown]);
  const cur = dpr.find((r) => r.id === openId);
  const groups = [...new Set(shown.map((r) => r.discipline))];
  const scope = sum(shown.map((r) => r.scope)), plan = sum(shown.map((r) => r.cumPlan)), ach = sum(shown.map((r) => r.cumAch)), tp = sum(shown.map((r) => r.ftdPlan)), ta = sum(shown.map((r) => r.ftdAct));
  const vendors = [...new Set(dpr.map((r) => r.vendor))];
  const cal = monthShortfall(shown);
  const units = [...new Set(shown.map((r) => r.unit))].join(' and ');

  const bar = (r: DprRow) => (
    <div className="flex items-center gap-3">
      <StripeBar label={`${r.building} achieved`} value={r.scope ? (r.cumAch / r.scope) * 100 : 0} plan={r.scope ? (r.cumPlan / r.scope) * 100 : undefined} color={toneFor(r.cumAch, r.cumPlan)} />
      <span className="caption ink tabular" style={{ minWidth: 36, textAlign: 'right' }}>{r.scope ? Math.round((r.cumAch / r.scope) * 100) : 0}%</span>
    </div>
  );
  const behind = (r: DprRow) => {
    const n = shortfall(r.ftmPlan, r.ftmAct);
    return n > 0 ? <span className="flex flex-col items-start gap-1"><StatusChip tone="warn">{num(n)} behind</StatusChip><span className="caption truncate" style={{ maxWidth: '100%' }}>{r.remarks || 'Reason needed'}</span></span> : <StatusChip tone="good">On plan</StatusChip>;
  };
  const HEAD: [string, string, boolean][] = [['Building or activity', '18%', false], ['Vendor', '15%', false], ['Scope', '8%', true], ['Cum plan', '8%', true], ['Cum actual', '8%', true], ['Plan FTM', '7%', true], ['Actual FTM', '7%', true], ['Achieved', '13%', false], ['Shortfall', '12%', false], ['Trend', '4%', false]];

  return (
    <>
      <HeaderFilters>
        <FilterCluster onClear={() => { url.clear(); setFilters({ discipline: 'All' }); }} filters={[
          { key: 'date', label: 'Date', type: 'date', value: url.values.date, def: REPORT_DATE, onChange: (v) => url.set('date', v) },
          { key: 'discipline', label: 'Discipline', value: filters.discipline, def: 'All', onChange: (v) => setFilters({ discipline: v }), options: DISCIPLINES.filter((d) => d === 'All' || d === 'Civil' || d === 'Structural').map((d) => ({ v: d, l: d })) },
          { key: 'vendor', label: 'Vendor', value: url.values.vendor, def: '', onChange: (v) => url.set('vendor', v), options: [{ v: '', l: 'All' }, ...vendors.map((v) => ({ v, l: v }))] },
        ]} />
      </HeaderFilters>
      <KpiRow n={5}>
        <KpiCard label="Scope qty" value={num(scope)} rail="neutral" context={`${shown.length} activities`} />
        <KpiCard label="Plan till date" value={num(plan)} rail="neutral" spark={trends.planned} context={`${scope ? Math.round((plan / scope) * 100) : 0}% of scope`} />
        <KpiCard label="Achieved" value={num(ach)} rail={ach >= plan ? 'good' : 'caution'} spark={trends.achieved} context={`${scope ? Math.round((ach / scope) * 100) : 0}% of scope`} />
        <KpiCard label="Today plan" value={num(tp)} rail="neutral" context="Planned quantity for today" />
        <KpiCard label="Today actual" value={num(ta)} rail={ta >= tp ? 'good' : 'caution'} context={`${tp ? Math.round((ta / tp) * 100) : 0}% of plan`} />
      </KpiRow>
      {!hasDetail ? <EmptyState title={`No daily progress is loaded for ${active.name}. Select Belgaum expansion to enter progress.`} /> : !dateOk ? (
        <EmptyState title="No progress was logged for this date. Set the date back to the report date." action={{ label: 'Use report date', onClick: () => url.set('date', REPORT_DATE) }} />
      ) : !shown.length ? <EmptyState title="No rows match. Clear the filters to see every activity." action={{ label: 'Clear filters', onClick: () => { url.clear(); setFilters({ discipline: 'All' }); } }} /> : (
        <div className="stack">
          <div className="grid12">
            <Tile surface title="Shortfall this month" className="c7" action={<span className="caption">Daily plan minus actual, all activities</span>}>
              <ShortfallCalendar days={cal} unit={units} />
            </Tile>
            <Tile title="Where the shortfall sits" className="c5">
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {[...shown].sort((a, b) => shortfall(b.ftmPlan, b.ftmAct) - shortfall(a.ftmPlan, a.ftmAct)).slice(0, 5).map((r) => {
                  const n = shortfall(r.ftmPlan, r.ftmAct), maxN = Math.max(...shown.map((x) => shortfall(x.ftmPlan, x.ftmAct)), 1);
                  return (
                    <li key={r.id} className="flex flex-col gap-2">
                      <div className="flex justify-between gap-3"><span className="small truncate">{r.building}</span><span className="small tabular">{num(n)} {r.unit}</span></div>
                      <div className="stripe" aria-hidden><i style={{ width: `${(n / maxN) * 100}%`, ['--c' as string]: '#E08A1E' }} /></div>
                    </li>
                  );
                })}
              </ul>
            </Tile>
          </div>
          <section className="tile tile-white">
            <TileHeader title="Progress by building"><span className="caption">Select a building to log today’s progress</span></TileHeader>
            <div className="table-wrap hidden md:block" style={{ maxHeight: 720 }}>
              <table className="tbl" style={{ minWidth: 980 }}>
                <caption className="sr-only">Daily progress by discipline, building and vendor.</caption>
                <colgroup>{HEAD.map(([h, w]) => <col key={h} style={{ width: w }} />)}</colgroup>
                <thead><tr>{HEAD.map(([h, , n]) => <th key={h} scope="col" className={n ? 'num' : undefined}>{h === 'Trend' ? <span className="sr-only">Trend</span> : h}</th>)}</tr></thead>
                <tbody>
                  {groups.map((g) => (
                    <Fragment key={g}>
                      <tr className="grp"><th scope="rowgroup" colSpan={HEAD.length}>{TITLE[g] ?? g}</th></tr>
                      {shown.filter((r) => r.discipline === g).map((r) => (
                        <Fragment key={r.id}>
                          <tr>
                            <td><button type="button" className="w5 truncate text-left underline underline-offset-4" style={{ maxWidth: '100%' }} onClick={() => setOpenId(r.id)}>{r.building}</button></td>
                            <td className="truncate">{r.vendor}</td>
                            {[r.scope, r.cumPlan, r.cumAch, r.ftmPlan, r.ftmAct].map((n, i) => <td key={i} className="num">{num(n)}</td>)}
                            <td>{bar(r)}</td>
                            <td>{behind(r)}</td>
                            <td className="text-right"><button type="button" onClick={() => setExpanded(expanded === r.id ? null : r.id)} aria-expanded={expanded === r.id} aria-label={`${expanded === r.id ? 'Hide' : 'Show'} 14-day trend for ${r.building}`} className="icon-btn" style={{ background: 'var(--canvas)', width: 36, height: 36 }}><ChevronDown style={{ transform: expanded === r.id ? 'rotate(180deg)' : undefined }} /></button></td>
                          </tr>
                          {expanded === r.id && <tr className="expanded"><td colSpan={HEAD.length} style={{ paddingLeft: 16 }}><Trend14 r={r} /></td></tr>}
                        </Fragment>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="stack md:hidden">
              {groups.map((g) => (
                <section key={g} aria-label={TITLE[g] ?? g} className="stack">
                  <h3 className="label">{TITLE[g] ?? g}</h3>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {shown.filter((r) => r.discipline === g).map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => setOpenId(r.id)} className="tile flex w-full flex-col gap-3 text-left">
                          <span className="flex flex-col gap-1"><span className="small w5">{r.building}</span><span className="caption">{r.vendor}</span></span>
                          {bar(r)}
                          <span className="small flex items-center justify-between gap-2 tabular"><span>Plan FTM {num(r.ftmPlan)}, actual {num(r.ftmAct)}</span>{behind(r)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>
        </div>
      )}
      <Drawer open={!!cur} onClose={() => setOpenId(null)} title="Log progress">{cur && <Entry key={cur.id} r={cur} onDone={() => setOpenId(null)} />}</Drawer>
    </>
  );
}
