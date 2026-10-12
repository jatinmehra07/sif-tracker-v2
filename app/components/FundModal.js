'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { RANGES } from '@/lib/ranges';
import { pct, navFmt, niceDate, tone, shortCategory } from '@/lib/format';

const W = 640, H = 230, PL = 10, PR = 56, PT = 16, PB = 16;

function Chart({ points }) {
  const [hover, setHover] = useState(null);

  const navs = points.map((p) => p.nav);
  const pad = (Math.max(...navs) - Math.min(...navs)) * 0.1 || 0.01;
  const min = Math.min(...navs) - pad;
  const max = Math.max(...navs) + pad;
  const x = (i) => PL + (i / (points.length - 1)) * (W - PL - PR);
  const y = (v) => PT + ((max - v) / (max - min)) * (H - PT - PB);

  const color = points[points.length - 1].nav >= points[0].nav ? '#059669' : '#e11d48';
  const line = points.map((p, i) => `${x(i)},${y(p.nav)}`).join(' ');
  const shown = points[hover ?? points.length - 1];

  function onMove(e) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - PL) / (W - PL - PR)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-800">{niceDate(shown.date)} · {navFmt(shown.nav)}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={PT + t * (H - PT - PB)} y2={PT + t * (H - PT - PB)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={W - PR + 6} y={PT + t * (H - PT - PB) + 3} fontSize="10" fill="#94a3b8">
              {(max - t * (max - min)).toFixed(2)}
            </text>
          </g>
        ))}
        <polygon points={`${x(0)},${H - PB} ${line} ${x(points.length - 1)},${H - PB}`} fill="url(#fill)" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {hover != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} stroke="#94a3b8" />
            <circle cx={x(hover)} cy={y(points[hover].nav)} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function FundModal({ fund, onClose }) {
  const [range, setRange] = useState('3M');
  const { data, isLoading } = useSWR(`/api/history?code=${fund.code}&range=${range}`, fetcher);
  const points = Array.isArray(data?.points) ? data.points : [];

  const first = points[0];
  const last = points[points.length - 1];
  const change = points.length > 1 ? (last.nav / first.nav - 1) * 100 : null;
  const navs = points.map((p) => p.nav);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">{fund.company} · {fund.code}</p>
            <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900">{fund.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {[shortCategory(fund.category), fund.plan, fund.option].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200">✕</button>
        </div>

        <div className="my-4 flex items-center justify-between gap-3">
          <p className="text-2xl font-bold text-slate-900">
            {navFmt(fund.nav)} <span className="text-xs font-medium text-slate-400">as of {niceDate(fund.date)}</span>
          </p>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {Object.keys(RANGES).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-semibold ${range === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        ) : points.length < 2 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">
            {data?.error ? 'Could not load the NAV history from AMFI. Please try again in a moment.' : 'Not enough NAV history in this range yet.'}
          </p>
        ) : (
          <>
            <Chart key={range} points={points} />
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Change in {range}</p>
                <p className={`text-lg font-bold ${tone(change)}`}>{pct(change)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">First NAV in range</p>
                <p className="font-semibold text-slate-900">{navFmt(first.nav)}</p>
                <p className="text-xs text-slate-400">{niceDate(first.date)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Low – High</p>
                <p className="font-semibold text-slate-900">{navFmt(Math.min(...navs))} – {navFmt(Math.max(...navs))}</p>
              </div>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Source: AMFI NAV history. If the fund is younger than the range, the chart starts at its first NAV. Past
          performance does not guarantee future returns. Not investment advice.
        </p>
      </div>
    </div>
  );
}