'use client';
import { INDIA_OUTLINE, PROJECTS } from '@/data/seed';
import { C } from './charts';
import { statusTone } from './ui';

const W = 300, H = 300;
const px = (lon: number) => (lon - 68) * 9.6 + 6;
const py = (lat: number) => (37.5 - lat) * 9.6 + 6;
const FILL = { good: '#168736', warn: '#B86200', bad: '#B9251C', info: '#188CE5', none: '#747480' };

export function IndiaMap({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const d = INDIA_OUTLINE.map(([lo, la], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(' ') + 'Z';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-[300px]" role="group" aria-label="Project locations in India">
      <path d={d} fill="#EEF0F5" stroke={C.tint} strokeWidth="1.5" strokeLinejoin="round" />
      {PROJECTS.map((p) => {
        const x = px(p.lon), y = py(p.lat), on = p.id === selected, left = p.lon > 80;
        return (
          <g key={p.id} transform={`translate(${x} ${y})`} tabIndex={0} role="button" aria-label={`${p.name}, ${p.state}, ${p.status}${on ? ', selected' : ''}`} aria-pressed={on} className="cursor-pointer"
            onClick={() => onSelect(p.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(p.id))}>
            {on && <circle r="12" fill={C.yellow} />}
            <circle r="6" fill={FILL[statusTone(p.status)]} stroke="#fff" strokeWidth="1.5" />
            <text x={left ? -13 : 13} y="4" textAnchor={left ? 'end' : 'start'} fill={C.ink} style={{ fontSize: 11, fontWeight: 500 }}>{p.name.split(' ')[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}
