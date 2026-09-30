'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { dateLong } from '@/lib/format';
import { C } from './charts';
import { StatusChip, StripeBar, statusTone, toneFor } from './ui';

const W = 300, H = 300;
const px = (lon: number) => (lon - 68) * 9.6 + 6;
const py = (lat: number) => (37.5 - lat) * 9.6 + 6;
const FILL = { good: '#168736', warn: '#E08A1E', bad: '#B9251C', info: '#188CE5', none: '#747480' };

export function IndiaMap({ selected, onSelect, cards = true }: { selected: string; onSelect: (id: string) => void; cards?: boolean }) {
  const { projects, outline } = useStore();
  const [hover, setHover] = useState<string | null>(null);
  const d = outline.map(([lo, la], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(' ') + 'Z';
  const hp = projects.find((p) => p.id === hover);
  const left = hp ? (px(hp.lon) / W) * 100 : 0, top = hp ? (py(hp.lat) / H) * 100 : 0;
  return (
    <div className="relative mx-auto w-full max-w-[520px]" onMouseLeave={() => setHover(null)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHover(null); }} onKeyDown={(e) => e.key === 'Escape' && setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="group" aria-label={`Project locations in India: ${projects.length} projects`}>
        <path d={d} fill="#EEF0F5" stroke={C.tint} strokeWidth="1.5" strokeLinejoin="round" />
        {projects.map((p) => {
          const on = p.id === selected;
          return (
            <g key={p.id} transform={`translate(${px(p.lon)} ${py(p.lat)})`} tabIndex={0} role="button" aria-label={`${p.name}, ${p.state}, ${p.status}${on ? ', selected' : ''}`} aria-pressed={on} className="cursor-pointer"
              onMouseEnter={() => cards && setHover(p.id)} onFocus={() => cards && setHover(p.id)} onClick={() => onSelect(p.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(p.id))}>
              {(on || hover === p.id) && <circle r="12" fill={C.yellow} />}
              <circle r="6" fill={FILL[statusTone(p.status)]} stroke="#fff" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>
      {hp && cards && (
        <div className="map-card" style={{ left: `${left}%`, top: `${top}%`, transform: `translate(${left > 55 ? 'calc(-100% - 14px)' : '14px'}, ${top > 60 ? '-100%' : '0'})` }}>
          <div className="flex items-start justify-between gap-2"><strong className="font-medium">{hp.name}</strong><StatusChip tone={statusTone(hp.status)}>{hp.status}</StatusChip></div>
          <div><div className="mb-1 flex justify-between text-xs" style={{ color: 'var(--muted)' }}><span>Actual {hp.actualPct}%</span><span>Plan {hp.planPct}%</span></div><StripeBar label={`${hp.name} actual against plan`} value={hp.actualPct} plan={hp.planPct} color={toneFor(hp.actualPct, hp.planPct)} /></div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Forecast finish {dateLong(hp.forecastFinish)}</div>
          <Link href="/scorecard" onClick={() => onSelect(hp.id)} className="btn-primary" style={{ height: 36 }}>Open scorecard</Link>
        </div>
      )}
    </div>
  );
}
