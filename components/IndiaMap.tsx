'use client';
import { INDIA_OUTLINE, PROJECTS } from '@/data/seed';
import { C } from './charts';
import { statusTone } from './ui';

const W = 300, H = 300;
const px = (lon: number) => (lon - 68) * 9.6 + 6;
const py = (lat: number) => (37.5 - lat) * 9.6 + 6;
const FILL = { good: C.good, warn: C.warn, bad: C.bad, info: C.info, none: C.graphite };

export function IndiaMap({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const d = INDIA_OUTLINE.map(([lo, la], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(' ') + 'Z';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[380px]" role="group" aria-label="Project locations in India">
      <path d={d} fill="#F6F6FA" stroke={C.tint} strokeWidth="1.5" strokeLinejoin="round" />
      {PROJECTS.map((p) => {
        const x = px(p.lon), y = py(p.lat), on = p.id === selected, left = p.lon > 80;
        return (
          <g key={p.id} transform={`translate(${x} ${y})`} tabIndex={0} role="button" aria-label={`${p.name}, ${p.state}, ${p.status}${on ? ', selected' : ''}`} aria-pressed={on} className="cursor-pointer"
            onClick={() => onSelect(p.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(p.id))}>
            {on && <circle r="11" fill={C.yellow} stroke={C.ink} strokeWidth="1" />}
            <circle r="6" fill={FILL[statusTone(p.status)]} stroke="#fff" strokeWidth="1.5" />
            <text x={left ? -12 : 12} y="4" textAnchor={left ? 'end' : 'start'} fill={C.ink} style={{ fontSize: 11, fontWeight: 600 }}>{p.name.split(' ')[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}
