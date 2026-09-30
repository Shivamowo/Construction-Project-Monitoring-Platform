const NF = new Intl.NumberFormat('en-IN');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 121660 becomes 1,21,660. */
export const num = (n: number, dp = 0) => (dp ? new Intl.NumberFormat('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n) : NF.format(n));
/** 2026-04-24 becomes 24-04-2026 (tables). */
export const dateShort = (d: string) => (d ? `${d.slice(8, 10)}-${d.slice(5, 7)}-${d.slice(0, 4)}` : 'Not set');
/** 2026-04-24 becomes 24 Apr 2026 (headers). */
export const dateLong = (d: string) => (d ? `${+d.slice(8, 10)} ${MON[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : 'Not set');
export const pct = (n: number, dp = 0) => `${num(n, dp)}%`;
