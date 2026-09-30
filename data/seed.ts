import type { ActionItem, Delay, DprRow, DrawingRow, DrawingType, PoRow, Project, Risk, Milestone } from '@/lib/types';

export const PRIMARY = 'p1';

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Belgaum expansion', state: 'Karnataka', lon: 74.5, lat: 15.85, status: 'Delay', planPct: 27.7, actualPct: 20.9, start: '2024-12-07', execStart: '2025-04-24', baselineFinish: '2026-04-24', forecastFinish: '2026-05-16' },
  { id: 'p2', name: 'Chittorgarh line 2', state: 'Rajasthan', lon: 74.6, lat: 24.9, status: 'At risk', planPct: 41.0, actualPct: 37.2, start: '2024-06-10', execStart: '2024-11-04', baselineFinish: '2026-12-15', forecastFinish: '2027-01-10' },
  { id: 'p3', name: 'Ariyalur grinding unit', state: 'Tamil Nadu', lon: 79.1, lat: 11.15, status: 'On track', planPct: 63.0, actualPct: 64.1, start: '2024-02-01', execStart: '2024-07-15', baselineFinish: '2027-02-28', forecastFinish: '2027-02-20' },
  { id: 'p4', name: 'Sonbhadra waste heat recovery', state: 'Uttar Pradesh', lon: 83.0, lat: 24.2, status: 'Not started', planPct: 0, actualPct: 0, start: '2026-10-15', execStart: '2027-02-01', baselineFinish: '2028-03-31', forecastFinish: '2028-03-31' },
];

/** Simplified outline as [lon, lat]. */
export const INDIA_OUTLINE: [number, number][] = [
  [74, 37], [77, 35.5], [79, 34], [78, 32.5], [79, 31], [81, 30], [80, 28.5], [84, 28], [88, 27], [88.5, 26.5], [89, 27], [92, 27], [95, 28], [97, 28],
  [96, 27], [94, 25.5], [93, 24], [92.5, 22.5], [91.5, 24], [90, 22.5], [89, 22], [87, 21.5], [86.5, 20], [85, 19.5], [82, 17], [80.3, 15.5], [80.2, 13],
  [79.8, 10.5], [78, 8.5], [77.5, 8], [76.5, 9.5], [75, 12], [74, 15], [73, 17.5], [72.8, 20], [72.5, 21.5], [70, 21], [69, 22.3], [70, 23], [68.3, 23.7],
  [70, 24.5], [70.5, 26], [71.5, 27.5], [72.5, 29], [74.5, 31], [74, 33], [73.5, 35],
];

export const PO_TOTALS = { total: 111, planned: 107, released: 79 };
export const PO_CATEGORIES = [
  { name: 'Pre-project', total: 15, planned: 15, released: 15 },
  { name: 'Civil', total: 6, planned: 6, released: 6 },
  { name: 'Mechanical', total: 47, planned: 45, released: 15 },
  { name: 'Electrical', total: 21, planned: 20, released: 14 },
  { name: 'Instrumentation', total: 21, planned: 20, released: 8 },
  { name: 'WHRS', total: 1, planned: 1, released: 1 },
];
export const PO_PIPELINE = [
  { name: 'Not yet planned', value: 4 }, { name: 'Engineering inputs', value: 5 }, { name: 'Tender', value: 8 },
  { name: 'Technical evaluation', value: 7 }, { name: 'Sent to commercial', value: 8 },
];

export const DISCIPLINE_QTY = [
  { name: 'Concrete cum', unit: 'm³', scope: 121660, drawingPlan: 73806, drawingReceived: 68270, cumPlan: 52500, cumActual: 30679 },
  { name: 'Fabrication MT', unit: 'MT', scope: 15901, drawingPlan: 9382, drawingReceived: 4990, cumPlan: 1472, cumActual: 405 },
  { name: 'Erection MT', unit: 'MT', scope: 29774, drawingPlan: 0, drawingReceived: 0, cumPlan: 0, cumActual: 0 },
];

export const DRAWING_TYPES: (DrawingType & { discipline: string })[] = [
  { name: 'GA', unit: 'drawings', scope: 82, plan: 37, received: 37, discipline: 'General' },
  { name: 'Civil', unit: 'm³', scope: 121660, plan: 73806, received: 68270, discipline: 'Civil' },
  { name: 'Fabrication', unit: 'MT', scope: 15901, plan: 9382, received: 4990, discipline: 'Structural' },
  { name: 'Erection', unit: 'MT', scope: 29774, plan: 0, received: 0, discipline: 'Structural' },
  { name: 'Electrical', unit: 'drawings', scope: 260, plan: 0, received: 0, discipline: 'Electrical' },
  { name: 'Instrumentation panel', unit: 'drawings', scope: 140, plan: 0, received: 0, discipline: 'Instrumentation' },
];

export const DRAWING_TRACKER: DrawingRow[] = [
  { id: 'd1', section: 'Pyro', building: 'Pre-heater building', discipline: 'Civil', scope: 13000, plan: 10537, received: 8631 },
  { id: 'd2', section: 'Grinding unit', building: 'Cement silo', discipline: 'Civil', scope: 9000, plan: 6864, received: 8020 },
  { id: 'd3', section: 'Pyro', building: 'Clinker silo', discipline: 'Civil', scope: 6700, plan: 5357, received: 5976 },
  { id: 'd4', section: 'Pyro', building: 'Cooler, ESP and chimney', discipline: 'Civil', scope: 5500, plan: 5000, received: 4079 },
  { id: 'd5', section: 'Pyro', building: 'Limestone crusher', discipline: 'Civil', scope: 4400, plan: 4197, received: 3778 },
  { id: 'd6', section: 'Pyro', building: 'Raw mill building', discipline: 'Civil', scope: 5000, plan: 4019, received: 3653 },
];

const M = (plan: string, actual: string): Milestone => ({ plan, actual });
type P = [string, string, boolean, Milestone, Milestone, Milestone, Milestone, Milestone];
const discOf = (c: string) => (['Civil', 'Mechanical', 'Electrical', 'Instrumentation'].includes(c) ? c : 'General');
const PO_SRC: P[] = [
  ['Weighing system', 'Mechanical', false, M('2025-01-10', '2025-01-08'), M('2025-02-05', '2025-02-07'), M('2025-03-01', '2025-03-14'), M('2025-03-15', '2025-03-28'), M('2025-04-05', '2025-04-20')],
  ['Weigh bridge', 'Mechanical', false, M('2025-01-15', '2025-01-12'), M('2025-02-10', '2025-02-08'), M('2025-03-05', '2025-03-04'), M('2025-03-20', '2025-03-19'), M('2025-04-10', '2025-04-08')],
  ['Water treatment plant', 'Mechanical', false, M('2025-02-01', '2025-02-12'), M('2025-03-10', '2025-03-25'), M('2025-04-05', ''), M('2025-04-20', ''), M('2025-05-10', '')],
  ['Wagon tippler', 'Mechanical', false, M('2025-02-10', '2025-02-10'), M('2025-03-05', '2025-03-12'), M('2025-04-01', '2025-04-20'), M('2025-04-15', ''), M('2025-05-05', '')],
  ['UPS', 'Electrical', false, M('2025-01-20', '2025-01-18'), M('2025-02-15', '2025-02-15'), M('2025-03-10', '2025-03-12'), M('2025-03-25', '2025-03-28'), M('2025-04-15', '2025-04-18')],
  ['Truck tippler', 'Mechanical', false, M('2025-03-01', '2025-03-05'), M('2025-03-25', ''), M('2025-04-20', ''), M('2025-05-05', ''), M('2025-05-25', '')],
  ['Transformer', 'Electrical', true, M('2025-01-05', '2025-01-06'), M('2025-02-01', '2025-02-10'), M('2025-03-01', '2025-03-20'), M('2025-03-15', '2025-04-05'), M('2025-04-01', '')],
  ['Third-party inspection (TPI)', 'Pre-project', false, M('2025-01-05', '2025-01-05'), M('2025-01-20', '2025-01-22'), M('2025-02-05', '2025-02-05'), M('2025-02-15', '2025-02-14'), M('2025-02-28', '2025-03-02')],
  ['Tower crane', 'Civil', true, M('2025-01-12', '2025-01-12'), M('2025-02-05', '2025-02-04'), M('2025-02-25', '2025-02-27'), M('2025-03-10', '2025-03-14'), M('2025-03-25', '')],
  ['TMT first lot', 'Civil', false, M('2025-01-08', '2025-01-08'), M('2025-01-25', '2025-01-24'), M('2025-02-10', '2025-02-10'), M('2025-02-20', '2025-02-21'), M('2025-03-01', '2025-03-04')],
];
export const PROCUREMENT: PoRow[] = PO_SRC.map((s, i) => ({
  id: `po${i + 1}`, projectId: 'p1', pkg: s[0], category: s[1], discipline: discOf(s[1]), critical: s[2], eng: s[3], tender: s[4], tech: s[5], commercial: s[6], po: s[7],
}));

/** Months Apr 2025 to Jun 2026. */
const LABELS = ['Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];
const YM = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
const PLAN = [5, 6, 6, 5, 6, 7, 8, 8, 10, 9, 8, 7, 5, 5, 4];
const ACTUAL = [4, 4, 5, 4, 3];
export const SCURVE = LABELS.map((label, i) => ({ label, ym: YM[i], plan: PLAN[i], actual: i < ACTUAL.length ? ACTUAL[i] : null as number | null }));

export const CONTRACTOR_MONTHLY = ['Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25'].map((label, i) => ({
  label, ym: YM[i], plan: [1200, 10441, 13657, 15477, 15145][i], actual: [727, 1523, 8315, 11515, 6613][i],
}));
export const MANPOWER = ['May 25', 'Jun 25', 'Jul 25', 'Aug 25'].map((label, i) => ({
  label, ym: YM[i + 1], plan: [650, 1020, 3650, 4023][i], actual: [378, 642, 1239, 1662][i], productivity: [8.53, 11.23, 8.37, 6.36][i],
}));
export const VENDORS = [
  { name: 'All contractors', share: 1, plan: 55920, actual: 28693, manDays: 3970 },
  { name: 'Vardhan Civil Works', share: 0.6, plan: 33500, actual: 17120, manDays: 2210 },
  { name: 'Kaveri Infra', share: 0.4, plan: 22420, actual: 11573, manDays: 1760 },
  { name: 'Bharat Shuttering (sub-contractor)', share: 0.22, plan: 12300, actual: 6312, manDays: 870 },
  { name: 'Anand Rebar (sub-contractor)', share: 0.15, plan: 8400, actual: 4304, manDays: 590 },
];

const BUILDINGS = ['Limestone crusher', 'Reject hopper', 'Limestone stacker and reclaimer', 'Coal reclaimer upgradation', 'Additive stacker and reclaimer', 'Box feeder', 'RM hopper', 'Raw mill building', 'Raw mill ducting complex', 'Raw mill baghouse', 'Blending silo', 'Pre-heater building', 'KP1 TAD', 'KP2 TAD', 'KP3 TAD', 'Coal mill hopper', 'Coal mill recirculation building'];
const SCOPES = [4400, 200, 4500, 200, 3000, 990, 1200, 5500, 0, 3420, 3750, 13000, 1350, 1150, 1000, 250, 650];
const FACT = [1.0, 0.7, 0.95, 0.6, 1.1, 0.85, 0.4, 1.0, 0.75, 0.9];
const NOTES = ['Shuttering material short', 'Rain stopped pour', 'Batching plant breakdown', 'Rebar delivery late', 'Labour shortfall'];
function dprRow(i: number, disc: string, building: string, vendor: string, unit: string, scope: number): DprRow {
  const f = FACT[i % FACT.length];
  const ftmPlan = Math.round(scope * 0.06), ftdPlan = Math.round(ftmPlan / 26), ftdAct = Math.round(ftdPlan * f), ftmAct = Math.round(ftmPlan * f);
  return {
    id: `dpr-${disc[0]}${i}`, projectId: 'p1', discipline: disc, building, vendor, unit, scope, cumPlan: Math.round(scope * 0.43), cumAch: Math.round(scope * 0.25 * f),
    ftmPlan, ftmAct, ftdPlan, ftdAct, weekly: Math.round(ftmAct / 4.3), remarks: ftdAct < ftdPlan ? NOTES[i % NOTES.length] : '',
  };
}
export const DPR: DprRow[] = [
  ...BUILDINGS.map((b, i) => dprRow(i, 'Civil', b, i < 9 ? 'Vardhan Civil Works' : 'Kaveri Infra', 'm³', SCOPES[i])),
  ...[['Pre-heater building', 6200], ['Raw mill building', 3100], ['Blending silo', 2400], ['Coal mill hopper', 900]].map(([b, s], i) => dprRow(i + 3, 'Structural', b as string, 'Metalcraft Fabrication', 'MT', s as number)),
];

const A = (n: number, title: string, category: string, discipline: string, assignee: string, openDate: string, dueDate: string, status: ActionItem['status'] = 'Open'): ActionItem => ({
  id: `A-${100 + n}`, projectId: 'p1', title, category, discipline, assignee, openDate, dueDate, status, comments: [],
});
const AN = ['Anita Rao', 'Vikram Shetty', 'Meera Nair', 'Rohit Kulkarni', 'Sanjay Patil', 'Deepa Menon'];
export const ACTIONS: ActionItem[] = [
  A(1, 'Negotiate batching plant rate with contractor', 'Construction', 'Civil', AN[0], '2026-07-06', '2026-08-10'),
  A(2, 'Start excavation for coal mill', 'Construction', 'Civil', AN[1], '2026-07-14', '2026-08-30', 'In progress'),
  A(3, 'Get manpower increase confirmed by contractor', 'Construction', 'Civil', AN[2], '2026-07-20', '2026-09-05'),
  A(4, 'Arrange portable water supply for workers', 'Site facilities', 'General', AN[3], '2026-08-03', '2026-09-12', 'In progress'),
  A(5, 'Release TMT second lot PO', 'Procurement', 'Civil', AN[4], '2026-08-10', '2026-10-05'),
  A(6, 'Freeze GA for raw mill baghouse', 'Design', 'Mechanical', AN[5], '2026-08-12', '2026-09-20'),
  A(7, 'Issue fabrication drawings for pre-heater structure', 'Design', 'Structural', AN[0], '2026-08-18', '2026-10-10'),
  A(8, 'Confirm tower crane erection slot', 'Construction', 'Structural', AN[1], '2026-08-24', '2026-10-01'),
  A(9, 'Approve weigh bridge vendor drawings', 'Procurement', 'Mechanical', AN[2], '2026-08-28', '2026-10-08'),
  A(10, 'Close transformer technical queries', 'Procurement', 'Electrical', AN[3], '2026-09-01', '2026-10-12', 'In progress'),
  A(11, 'Submit TPI scope for approval', 'Commercial', 'General', AN[4], '2026-09-04', '2026-10-15'),
  A(12, 'Resolve rebar yard layout clash', 'Construction', 'Civil', AN[5], '2026-09-08', '2026-10-06'),
  A(13, 'Update coal mill hopper baseline schedule', 'Planning', 'General', AN[0], '2026-09-14', '2026-10-20'),
  A(14, 'Share cable tray routing for raw mill', 'Design', 'Electrical', AN[1], '2026-09-18', '2026-10-25'),
  A(15, 'Confirm instrumentation panel room size', 'Design', 'Instrumentation', AN[2], '2026-09-22', '2026-10-28'),
  A(16, 'Arrange night lighting for pre-heater pour', 'Construction', 'Civil', AN[3], '2026-09-25', '2026-10-05'),
  A(17, 'Clear contractor invoices for July', 'Commercial', 'General', AN[4], '2026-09-27', '2026-10-30'),
  A(18, 'Mobilise second batching plant', 'Construction', 'Civil', AN[5], '2026-06-15', '2026-07-30', 'Closed'),
  A(19, 'Finalise labour camp layout', 'Site facilities', 'General', AN[0], '2026-06-20', '2026-07-25', 'Closed'),
  { ...A(20, 'Confirm kiln shell delivery window', 'Procurement', 'Mechanical', AN[1], '2026-09-10', '2026-10-15'), id: 'A-201', projectId: 'p2' },
  { ...A(21, 'Approve revised cooler foundation drawing', 'Design', 'Civil', AN[2], '2026-09-16', '2026-10-20'), id: 'A-202', projectId: 'p2' },
  { ...A(22, 'Close mill motor commissioning punch list', 'Construction', 'Electrical', AN[3], '2026-09-05', '2026-10-10'), id: 'A-301', projectId: 'p3' },
  { ...A(23, 'Confirm site access permit renewal', 'Commercial', 'General', AN[4], '2026-09-20', '2026-10-18'), id: 'A-302', projectId: 'p3' },
  { ...A(24, 'Submit environmental clearance update', 'Commercial', 'General', AN[5], '2026-09-12', '2026-10-30'), id: 'A-401', projectId: 'p4' },
];

const R = (n: number, title: string, category: string, discipline: string, rating: Risk['rating'], status: Risk['status'], owner: string, mitigation: string, link: string, openDate: string): Risk => ({
  id: `R-${10 + n}`, projectId: 'p1', title, category, discipline, rating, status, owner, mitigation, link, openDate,
});
export const RISKS: Risk[] = [
  R(1, 'Batching plant capacity below peak pour demand', 'Construction', 'Civil', 'High', 'Open', AN[0], 'Mobilise second plant and agree night pour schedule.', 'Action A-101', '2026-07-08'),
  R(2, 'Coal mill excavation slips past monsoon', 'Construction', 'Civil', 'High', 'Mitigating', AN[1], 'Add dewatering pumps and second excavation crew.', 'Delay D-02', '2026-07-16'),
  R(3, 'Contractor manpower stays below plan', 'Construction', 'Civil', 'High', 'Open', AN[2], 'Weekly manpower review with contractor heads.', 'Action A-103', '2026-07-22'),
  R(4, 'Water supply gap affects labour welfare', 'Construction', 'General', 'Medium', 'Mitigating', AN[3], 'Install tanker point and portable storage.', 'Action A-104', '2026-08-05'),
  R(5, 'Rebar yard congestion slows fabrication feed', 'Construction', 'Civil', 'Medium', 'Open', AN[5], 'Re-plan yard zones and stage deliveries.', 'Action A-112', '2026-09-08'),
  R(6, 'Crane availability delays steel erection', 'Construction', 'Structural', 'Medium', 'Open', AN[1], 'Lock crane slot and line up a standby crane.', 'Action A-108', '2026-08-26'),
  R(7, 'Night pours limited by site lighting', 'Construction', 'Civil', 'Low', 'Open', AN[3], 'Add mast lighting at pour locations.', 'Action A-116', '2026-09-25'),
  R(8, 'TMT lot release slips beyond need date', 'Procurement', 'Civil', 'High', 'Open', AN[4], 'Escalate PO approval and split the lot.', 'Action A-105', '2026-08-11'),
  R(9, 'Transformer lead time exceeds erection window', 'Procurement', 'Electrical', 'High', 'Open', AN[3], 'Confirm slot with vendor and expedite testing.', 'Delay D-06', '2026-09-02'),
  R(10, 'Client sign-off on GA drawings pending', 'Design', 'General', 'Medium', 'Closed', AN[5], 'Sign-off received on 12 August.', 'Action A-106', '2026-06-25'),
  { ...R(11, 'Kiln shell fabrication yard capacity', 'Procurement', 'Mechanical', 'Medium', 'Open', AN[2], 'Audit vendor yard and add a second shift.', '', '2026-09-11'), id: 'R-201', projectId: 'p2' },
  { ...R(12, 'Commissioning team availability', 'Construction', 'Electrical', 'Low', 'Open', AN[4], 'Book commissioning engineers early.', '', '2026-09-09'), id: 'R-301', projectId: 'p3' },
  { ...R(13, 'Land handover for the boiler area', 'Construction', 'Civil', 'Medium', 'Open', AN[0], 'Agree handover date with the state authority.', '', '2026-09-15'), id: 'R-401', projectId: 'p4' },
];

const D = (n: number, description: string, person: string, org: string, openDate: string, closeDate: string, daysLost: number, linked: string, discipline: string): Delay => ({
  id: `D-0${n}`, projectId: 'p1', description, person, org, openDate, closeDate, status: closeDate ? 'Closed' : 'Open', daysLost, linked, discipline,
});
export const DELAYS: Delay[] = [
  D(1, 'Batching plant output below committed rate', AN[0], 'Vardhan Civil Works', '2026-07-06', '', 9, 'Building: Pre-heater building', 'Civil'),
  D(2, 'Coal mill excavation started late', AN[1], 'Kaveri Infra', '2026-07-14', '', 14, 'Building: Coal mill hopper', 'Civil'),
  D(3, 'Contractor manpower below plan', AN[2], 'Vardhan Civil Works', '2026-07-20', '', 11, 'Building: Raw mill building', 'Civil'),
  D(4, 'Water supply interrupted at labour camp', AN[3], 'Site services', '2026-08-03', '2026-08-19', 3, 'Building: Limestone crusher', 'General'),
  D(5, 'TMT first lot delivered late', AN[4], 'Steel supplier', '2026-07-01', '2026-07-18', 5, 'PO: TMT first lot', 'Civil'),
  D(6, 'Transformer PO release pending approval', AN[3], 'Owner procurement', '2026-09-02', '', 8, 'PO: Transformer', 'Electrical'),
  D(7, 'Raw mill baghouse GA not frozen', AN[5], 'Design consultant', '2026-08-12', '', 6, 'Drawing: Raw mill baghouse', 'Mechanical'),
  D(8, 'Tower crane arrival delayed', AN[1], 'Crane vendor', '2026-08-24', '', 7, 'PO: Tower crane', 'Structural'),
  D(9, 'Rain stopped concrete pours for two days', AN[0], 'Kaveri Infra', '2026-08-28', '2026-08-31', 2, 'Building: Cement silo', 'Civil'),
  { ...D(10, 'Kiln shell drawing revision', AN[2], 'Design consultant', '2026-09-16', '', 4, 'Drawing: Kiln shell', 'Mechanical'), id: 'D-201', projectId: 'p2' },
  { ...D(11, 'Cable tray supplier slippage', AN[4], 'Electrical vendor', '2026-09-05', '', 3, 'PO: Cable trays', 'Electrical'), id: 'D-301', projectId: 'p3' },
  { ...D(12, 'Statutory clearance pending', AN[5], 'State authority', '2026-09-12', '', 10, 'Site: Boiler area', 'Civil'), id: 'D-401', projectId: 'p4' },
];
