import * as S from '@/data/seed';

/** Data access layer. Swap these bodies for Postgres or an Odoo API without touching screens. */
const ok = <T,>(v: T): Promise<T> => Promise.resolve(v);

export const PRIMARY = S.PRIMARY;
export const getProjects = () => ok(S.PROJECTS);
export const getActions = () => ok(S.ACTIONS);
export const getRisks = () => ok(S.RISKS);
export const getDelays = () => ok(S.DELAYS);
export const getDpr = () => ok(S.DPR);
export const getDrawings = () => ok({ types: S.DRAWING_TYPES, tracker: S.DRAWING_TRACKER });
export const getProcurement = () => ok({ rows: S.PROCUREMENT, categories: S.PO_CATEGORIES, pipeline: S.PO_PIPELINE });
export const getContractors = () => ok({ monthly: S.CONTRACTOR_MONTHLY, manpower: S.MANPOWER, vendors: S.VENDORS, quantities: S.DISCIPLINE_QTY });
export const getSchedule = () => ok(S.SCURVE);
export const getMapOutline = () => ok(S.INDIA_OUTLINE);
export const getTrends = () => ok(S.TRENDS);
