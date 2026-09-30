import { BRAND } from '@/lib/brand';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="block h-4 w-4 shrink-0 bg-brand" />
      {!compact && <span className="font-display text-lg font-bold tracking-tight text-ink">{BRAND.name}</span>}
      {compact && <span className="sr-only">{BRAND.name}</span>}
    </span>
  );
}
