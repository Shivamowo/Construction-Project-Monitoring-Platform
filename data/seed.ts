import type { ActionItem, Delay, DprRow, DrawingRow, DrawingType, PoRow, Project, Risk, Milestone } from '@/lib/types';

export const PRIMARY = 'p1';

const P = (id: string, name: string, state: string, lon: number, lat: number, status: Project['status'], phase: Project['phase'], plan: number, actual: number, start: string, exec: string, base: string, fc: string): Project => ({
  id, name, state, lon, lat, status, phase, planPct: plan, actualPct: actual, start, execStart: exec, baselineFinish: base, forecastFinish: fc,
});
export const PROJECTS: Project[] = [
  P('p1', 'Belgaum expansion', 'Karnataka', 74.5, 15.85, 'Delay', 'Active', 27.7, 20.9, '2024-12-07', '2025-04-24', '2026-04-24', '2026-05-16'),
  P('p2', 'Chittorgarh line 2', 'Rajasthan', 74.6, 24.9, 'At risk', 'Active', 41.0, 37.2, '2024-06-10', '2024-11-04', '2026-12-15', '2027-01-10'),
  P('p3', 'Ariyalur grinding unit', 'Tamil Nadu', 79.1, 11.15, 'On track', 'Active', 63.0, 64.1, '2024-02-01', '2024-07-15', '2027-02-28', '2027-02-20'),
  P('p4', 'Sonbhadra waste heat recovery', 'Uttar Pradesh', 83.0, 24.2, 'On track', 'Planned', 0, 0, '2026-10-15', '2027-02-01', '2028-03-31', '2028-03-31'),
  P('p5', 'Raipur clinker line', 'Chhattisgarh', 81.6, 21.25, 'At risk', 'Active', 52.0, 47.5, '2024-08-01', '2025-01-20', '2026-11-30', '2026-12-28'),
  P('p6', 'Kutch bulk terminal', 'Gujarat', 69.8, 23.25, 'On track', 'Active', 71.0, 71.6, '2023-11-15', '2024-05-01', '2026-10-31', '2026-10-25'),
  P('p7', 'Satna kiln upgrade', 'Madhya Pradesh', 80.8, 24.6, 'On track', 'Active', 35.0, 35.4, '2025-03-01', '2025-08-15', '2027-06-30', '2027-06-30'),
  P('p8', 'Bilaspur silo complex', 'Himachal Pradesh', 76.8, 31.35, 'At risk', 'Active', 58.0, 52.1, '2024-09-10', '2025-02-01', '2026-12-10', '2027-01-05'),
  P('p9', 'Cuddapah power block', 'Andhra Pradesh', 78.8, 14.45, 'On track', 'Active', 46.0, 46.8, '2024-10-01', '2025-03-10', '2027-03-31', '2027-03-25'),
  P('p10', 'Durgapur dispatch yard', 'West Bengal', 87.3, 23.5, 'On track', 'Active', 80.0, 81.2, '2023-08-01', '2024-01-15', '2026-11-15', '2026-11-10'),
  P('p11', 'Cachar grinding unit', 'Assam', 92.8, 24.8, 'On track', 'Planned', 0, 0, '2026-11-01', '2027-04-01', '2028-06-30', '2028-06-30'),
  P('p12', 'Nalgonda crusher plant', 'Telangana', 79.3, 17.05, 'On track', 'Planned', 0, 0, '2026-12-01', '2027-05-01', '2028-02-29', '2028-02-29'),
];

/** Simplified outline as [lon, lat]. */
export const INDIA_OUTLINE: [number, number][] = [
  [74, 37], [77, 35.5], [79, 34], [78, 32.5], [79, 31], [81, 30], [80, 28.5], [84, 28], [88, 27], [88.5, 26.5], [89, 27], [92, 27], [95, 28], [97, 28],
  [96, 27], [94, 25.5], [93, 24], [92.5, 22.5], [91.5, 24], [90, 22.5], [89, 22], [87, 21.5], [86.5, 20], [85, 19.5], [82, 17], [80.3, 15.5], [80.2, 13],
  [79.8, 10.5], [78, 8.5], [77.5, 8], [76.5, 9.5], [75, 12], [74, 15], [73, 17.5], [72.8, 20], [72.5, 21.5], [70, 21], [69, 22.3], [70, 23], [68.3, 23.7],
  [70, 24.5], [70.5, 26], [71.5, 27.5], [72.5, 29], [74.5, 31], [74, 33], [73.5, 35],
];

export const PO_CATEGORIES = [
  { name: 'Pre-project', total: 15, planned: 15, released: 15, pastDue: 0 },
  { name: 'Civil', total: 6, planned: 6, released: 6, pastDue: 0 },
  { name: 'Mechanical', total: 47, planned: 45, released: 35, pastDue: 11 },
  { name: 'Electrical', total: 21, planned: 20, released: 14, pastDue: 7 },
  { name: 'Instrumentation', total: 21, planned: 20, released: 8, pastDue: 12 },
  { name: 'WHRS', total: 1, planned: 1, released: 1, pastDue: 0 },
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

const dpr = (id: string, disc: string, building: string, vendor: string, unit: string, v: number[], reason = ''): DprRow => ({
  id, projectId: 'p1', discipline: disc, building, vendor, unit,
  scope: v[0], cumPlan: v[1], cumAch: v[2], ftmPlan: v[3], ftmAct: v[4], ftdPlan: v[5], ftdAct: v[6], weekly: Math.round(v[4] / 4.3), remarks: reason,
});
// [scope, cumPlan, cumAch, ftmPlan, ftmAct, ftdPlan, ftdAct]
export const DPR: DprRow[] = [
  dpr('dpr-1', 'Civil', 'Limestone crusher', 'Vardhan Civil Works', 'm³', [4400, 2900, 2100, 1800, 1500, 70, 62], 'Mobilization'),
  dpr('dpr-2', 'Civil', 'Raw mill building', 'Vardhan Civil Works', 'm³', [5500, 3600, 2700, 2300, 2000, 90, 80], 'Awaiting front'),
  dpr('dpr-3', 'Civil', 'Blending silo', 'Vardhan Civil Works', 'm³', [3420, 2200, 1500, 1300, 1300, 50, 50]),
  dpr('dpr-4', 'Civil', 'Coal mill hopper', 'Kaveri Infra', 'm³', [3750, 2450, 1900, 1500, 1250, 60, 52], 'Access constraint'),
  dpr('dpr-5', 'Civil', 'Pre-heater building', 'Kaveri Infra', 'm³', [13000, 8400, 6100, 4900, 3900, 190, 160], 'Mobilization'),
  dpr('dpr-6', 'Civil', 'KP1 TAD', 'Kaveri Infra', 'm³', [1350, 870, 640, 500, 500, 20, 20]),
  dpr('dpr-7', 'Civil', 'Reject hopper', 'Kaveri Infra', 'm³', [1150, 750, 560, 500, 350, 20, 14], 'Awaiting front'),
  dpr('dpr-8', 'Civil', 'Cooler, ESP and chimney', 'Vardhan Civil Works', 'm³', [4200, 2700, 1800, 1600, 1400, 60, 50], 'Access constraint'),
  dpr('dpr-9', 'Structural', 'Pre-heater structure', 'Metalcraft Fabrication', 'MT', [2950, 1900, 1100, 1000, 1000, 40, 40]),
  dpr('dpr-10', 'Structural', 'Raw mill structure', 'Metalcraft Fabrication', 'MT', [1400, 754, 542, 500, 480, 20, 20], 'Mobilization'),
];

const daysAgo = (n: number) => { const d = new Date(Date.UTC(2026, 8, 30) - n * 86400000); return d.toISOString().slice(0, 10); };
const ROLES = ['Project team', 'Civil team', 'Site team', 'Commercial', 'Client representative', 'Contractor representative'];
type AT = [string, string, string, string, number, ActionItem['status']];
const OPEN: AT[] = [
  ['Negotiate batching plant rate with contractor', 'Construction', 'Civil', ROLES[1], 86, 'Open'],
  ['Start excavation for coal mill', 'Construction', 'Civil', ROLES[2], 78, 'In progress'],
  ['Get manpower increase confirmed by contractor', 'Construction', 'Civil', ROLES[5], 72, 'Open'],
  ['Arrange portable water supply for workers', 'Construction', 'General', ROLES[2], 58, 'In progress'],
  ['Release TMT second lot PO', 'Procurement', 'Civil', ROLES[3], 51, 'Open'],
  ['Freeze GA for raw mill baghouse', 'Engineering', 'Mechanical', ROLES[0], 49, 'Open'],
  ['Issue fabrication drawings for pre-heater structure', 'Engineering', 'Structural', ROLES[0], 43, 'Open'],
  ['Confirm tower crane erection slot', 'Procurement', 'Structural', ROLES[3], 40, 'In progress'],
  ['Approve weigh bridge vendor drawings', 'Engineering', 'Mechanical', ROLES[4], 38, 'Open'],
  ['Close transformer technical queries', 'Procurement', 'Electrical', ROLES[0], 37, 'In progress'],
  ['Submit TPI scope for approval', 'Procurement', 'General', ROLES[3], 35, 'Open'],
  ['Resolve rebar yard layout clash', 'Construction', 'Civil', ROLES[1], 33, 'Open'],
  ['Update coal mill hopper baseline schedule', 'Engineering', 'General', ROLES[0], 32, 'Open'],
  ['Share cable tray routing for raw mill', 'Engineering', 'Electrical', ROLES[0], 31, 'Open'],
  ['Confirm instrumentation panel room size', 'Engineering', 'Instrumentation', ROLES[4], 12, 'Open'],
  ['Arrange night lighting for pre-heater pour', 'Construction', 'Civil', ROLES[2], 8, 'Open'],
  ['Clear contractor invoices for July', 'Procurement', 'General', ROLES[3], 3, 'Open'],
];
const CLOSED: [string, string, string, string, number, number][] = [
  ['Mobilise second batching plant', 'Construction', 'Civil', ROLES[1], 70, 25],
  ['Finalise labour camp layout', 'Construction', 'General', ROLES[2], 64, 21],
  ['Approve kiln foundation drawing', 'Engineering', 'Civil', ROLES[4], 60, 18],
  ['Place order for cable trays', 'Procurement', 'Electrical', ROLES[3], 55, 14],
  ['Issue GA for cement silo', 'Engineering', 'General', ROLES[0], 50, 10],
  ['Certify July concrete bills', 'Procurement', 'Civil', ROLES[3], 46, 6],
  ['Close crane foundation punch list', 'Construction', 'Structural', ROLES[1], 42, 2],
];
export const ACTIONS: ActionItem[] = [
  ...OPEN.map((a, i): ActionItem => ({ id: `A-${101 + i}`, projectId: 'p1', title: a[0], category: a[1], discipline: a[2], assignee: a[3], openDate: daysAgo(a[4]), dueDate: daysAgo(a[4] - 30), status: a[5], closedDate: '', comments: [] })),
  ...CLOSED.map((a, i): ActionItem => ({ id: `A-${118 + i}`, projectId: 'p1', title: a[0], category: a[1], discipline: a[2], assignee: a[3], openDate: daysAgo(a[4]), dueDate: daysAgo(a[4] - 30), status: 'Closed', closedDate: daysAgo(a[5]), comments: [] })),
];

const R = (n: number, title: string, category: string, discipline: string, rating: Risk['rating'], status: Risk['status'], owner: string, mitigation: string, link: string, age: number): Risk => ({
  id: `R-${10 + n}`, projectId: 'p1', title, category, discipline, rating, status, owner, mitigation, link, openDate: daysAgo(age),
});
export const RISKS: Risk[] = [
  R(1, 'Batching plant capacity below peak pour demand', 'Construction', 'Civil', 'High', 'Open', ROLES[1], 'Mobilise second plant and agree night pour schedule.', 'Action A-101', 84),
  R(2, 'Coal mill excavation slips past monsoon', 'Construction', 'Civil', 'High', 'Mitigating', ROLES[2], 'Add dewatering pumps and second excavation crew.', 'Delay D-02', 76),
  R(3, 'TMT lot release slips beyond need date', 'Procurement', 'Civil', 'High', 'Open', ROLES[3], 'Escalate PO approval and split the lot.', 'Action A-105', 50),
  R(4, 'Transformer lead time exceeds erection window', 'Procurement', 'Electrical', 'High', 'Open', ROLES[3], 'Confirm slot with vendor and expedite testing.', 'Delay D-06', 28),
  R(5, 'Contractor invoices disputed on escalation clause', 'Commercial', 'General', 'High', 'Open', ROLES[3], 'Hold a joint reconciliation meeting this month.', 'Action A-117', 20),
  R(6, 'Contractor manpower stays below plan', 'Construction', 'Civil', 'Medium', 'Open', ROLES[5], 'Weekly manpower review with contractor heads.', 'Action A-103', 70),
  R(7, 'Rebar yard congestion slows fabrication feed', 'Construction', 'Civil', 'Medium', 'Open', ROLES[1], 'Re-plan yard zones and stage deliveries.', 'Action A-112', 33),
  R(8, 'Change orders pending client approval', 'Commercial', 'General', 'Medium', 'Mitigating', ROLES[4], 'Table change orders at the next steering meeting.', '', 45),
  R(9, 'Crane availability delays steel erection', 'Construction', 'Structural', 'Medium', 'Open', ROLES[2], 'Lock crane slot and line up a standby crane.', 'Action A-108', 40),
  R(10, 'Client sign-off on GA drawings pending', 'Commercial', 'General', 'Medium', 'Closed', ROLES[0], 'Sign-off received on 12 September.', 'Action A-106', 90),
];

// ages 200, 160, 140, 100, 68, 40 days: average of open delays is 118 days
const D = (n: number, description: string, person: string, org: string, age: number, closeAge: number | null, daysLost: number, linked: string, discipline: string): Delay => ({
  id: `D-0${n}`, projectId: 'p1', description, person, org, openDate: daysAgo(age), closeDate: closeAge === null ? '' : daysAgo(closeAge), status: closeAge === null ? 'Open' : 'Closed', daysLost, linked, discipline,
});
export const DELAYS: Delay[] = [
  D(1, 'Land handover for coal mill area pending', ROLES[4], 'Owner site office', 200, null, 22, 'Building: Coal mill hopper', 'Civil'),
  D(2, 'Statutory clearance for crusher pending', ROLES[4], 'State authority', 160, null, 15, 'Building: Limestone crusher', 'Civil'),
  D(3, 'Client drawing approvals slower than plan', ROLES[4], 'Client design cell', 140, null, 12, 'Drawing: Raw mill baghouse', 'Mechanical'),
  D(4, 'Batching plant output below committed rate', ROLES[5], 'Vardhan Civil Works', 100, null, 9, 'Building: Pre-heater building', 'Civil'),
  D(5, 'Contractor manpower below plan', ROLES[5], 'Kaveri Infra', 68, null, 11, 'Building: Raw mill building', 'Civil'),
  D(6, 'Transformer PO release pending approval', ROLES[5], 'Transformer vendor', 40, null, 8, 'PO: Transformer', 'Electrical'),
  D(7, 'Water supply interrupted at labour camp', ROLES[2], 'Site services', 90, 70, 3, 'Building: Limestone crusher', 'General'),
  D(8, 'TMT first lot delivered late', ROLES[3], 'Steel supplier', 75, 55, 5, 'PO: TMT first lot', 'Civil'),
  D(9, 'Rain stopped concrete pours for two days', ROLES[1], 'Kaveri Infra', 45, 42, 2, 'Building: Cement silo', 'Civil'),
];

/** Seven-point trends used by KPI sparklines. */
export const TRENDS: Record<string, number[]> = {
  actions: [12, 14, 15, 16, 18, 17, 17], risks: [6, 7, 8, 8, 9, 9, 9], delays: [4, 4, 5, 5, 6, 6, 6], ageing: [96, 101, 106, 110, 113, 116, 118],
  planned: [20, 22, 24, 25, 26, 26, 27], achieved: [12, 13, 14, 16, 17, 18, 19], onTrack: [7, 7, 8, 8, 8, 8, 8],
};
