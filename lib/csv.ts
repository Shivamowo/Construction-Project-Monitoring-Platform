export function downloadCsv(name: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  try {
    const url = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  } catch { /* download unavailable */ }
}
