import { BRAND } from '@/lib/brand';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="block h-4 w-4 shrink-0" style={{ background: 'var(--yellow)' }} />
      <span className="h3">{BRAND.name}</span>
    </span>
  );
}
