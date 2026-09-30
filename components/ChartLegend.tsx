export interface LegendItem { label: string; color: string; line?: boolean; dashed?: boolean }

export function ChartLegend({ items, dark }: { items: LegendItem[]; dark?: boolean }) {
  return (
    <ul className={`mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs ${dark ? 'text-white' : 'text-sub'}`}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          {i.line ? (
            <span aria-hidden className="block h-0 w-4 border-t-2" style={{ borderColor: i.color, borderStyle: i.dashed ? 'dashed' : 'solid' }} />
          ) : (
            <span aria-hidden className="block h-2.5 w-2.5 rounded-sm" style={{ background: i.color }} />
          )}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
