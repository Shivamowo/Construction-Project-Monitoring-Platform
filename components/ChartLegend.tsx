export interface LegendItem { label: string; color: string; line?: boolean; dashed?: boolean }

/** Plain HTML legend placed directly under a tile header. */
export function ChartLegend({ items }: { items: LegendItem[]; dark?: boolean }) {
  return (
    <ul className="caption m-0 mb-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0" style={{ color: 'inherit' }}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          {i.line
            ? <span aria-hidden className="block h-0 w-4 border-t-2" style={{ borderColor: i.color, borderStyle: i.dashed ? 'dashed' : 'solid' }} />
            : <span aria-hidden className="block h-3 w-3 rounded-sm" style={{ background: i.color }} />}
          {i.label}
        </li>
      ))}
    </ul>
  );
}
