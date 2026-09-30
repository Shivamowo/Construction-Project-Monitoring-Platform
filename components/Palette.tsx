'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export const MODULES = [
  { label: 'Project center', href: '/' }, { label: 'Portfolio', href: '/portfolio' }, { label: 'Scorecard', href: '/scorecard' }, { label: 'Procurement', href: '/procurement' },
  { label: 'Drawings', href: '/drawings' }, { label: 'Daily progress', href: '/dpr' }, { label: 'Contractors', href: '/contractors' }, { label: 'Actions', href: '/actions' },
  { label: 'Risks', href: '/risks' }, { label: 'Delays', href: '/delays' },
];

export function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { projects, setFilters } = useStore();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const items = useMemo(() => {
    const all = [
      ...MODULES.map((m) => ({ group: 'Modules', label: m.label, hint: m.href, run: () => router.push(m.href) })),
      ...projects.map((p) => ({ group: 'Projects', label: p.name, hint: p.state, run: () => { setFilters({ projectId: p.id }); router.push('/scorecard'); } })),
    ];
    const n = q.trim().toLowerCase();
    return n ? all.filter((i) => i.label.toLowerCase().includes(n)) : all;
  }, [q, projects, router, setFilters]);
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { document.getElementById(`pal-${idx}`)?.scrollIntoView({ block: 'nearest' }); }, [idx]);
  if (!open) return null;
  const go = (i: number) => { items[i]?.run(); onClose(); };
  return (
    <div className="palette-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette"
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); go(idx); }
        }}>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search modules and projects" aria-label="Search modules and projects" role="combobox" aria-expanded="true" aria-controls="pal-list" />
        <ul id="pal-list" role="listbox" aria-label="Results">
          {items.map((it, i) => (
            <li key={it.group + it.label} role="presentation">
              {(i === 0 || items[i - 1].group !== it.group) && <div className="grp caption">{it.group}</div>}
              <button id={`pal-${i}`} type="button" role="option" aria-selected={i === idx} onMouseMove={() => setIdx(i)} onClick={() => go(i)}>
                <span>{it.label}</span><span className="caption">{it.hint}</span>
              </button>
            </li>
          ))}
          {!items.length && <li className="small muted p-4">Nothing matches. Try a module or project name.</li>}
        </ul>
      </div>
    </div>
  );
}
