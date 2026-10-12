'use client';

import { useState } from 'react';
import { navFmt, niceDate, crore, monthYear, avatarColor, initials } from '@/lib/format';
export default function FundCard({ family, onOpen }) {
  const [index, setIndex] = useState(0);
  const variant = family.variants[Math.min(index, family.variants.length - 1)];
  const fund = variant.fund;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarColor(family.company)}`}>
          {initials(family.company)}
        </span>
        <div>
          <p className="text-base font-semibold text-slate-900">{family.company}</p>
          <p className="text-xs text-slate-500">
            {family.variants.length} {family.variants.length === 1 ? 'strategy' : 'strategies'}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</p>
      {family.variants.length > 1 ? (
        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          {family.variants.map((v, i) => (
            <option key={v.fund.code} value={i}>{v.category}</option>
          ))}
        </select>
      ) : (
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">{variant.category}</p>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">NAV · {niceDate(fund.date)}</p>
        <p className="text-3xl font-bold tabular-nums text-slate-900">{navFmt(fund.nav)}</p>
        <p className="mt-1 text-xs text-slate-500">{fund.plan} · {fund.option}</p>
<div className="mt-3 space-y-1 text-xs text-slate-500">
  {fund.aum && (
    <p>
      Scheme AUM <b className="text-slate-700">{crore(fund.aum.aumCr)}</b> · {monthYear(fund.aum.asOf)}
    </p>
  )}
  {fund.categoryAum && (
    <p>
      All {variant.category} funds <b className="text-slate-700">{crore(fund.categoryAum.aumCr)}</b> · {monthYear(fund.categoryAum.asOf)}
    </p>
  )}
</div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(fund)}
        className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
      >
        View NAV chart
      </button>
    </div>
  );
}