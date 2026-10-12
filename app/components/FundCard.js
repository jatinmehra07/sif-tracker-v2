'use client';

import { useState } from 'react';
import { navFmt, niceDate, crore, monthYear, avatarColor, initials } from '@/lib/format';
function AumLine({ label, item }) {
  if (!item) return null;
  return (
    <p>
      {label} <b className="text-slate-700">{crore(item.aumCr)}</b> · {item.period || monthYear(item.asOf)}
    </p>
  );
}

export default function FundCard({ family, onOpen }) {
  const [index, setIndex] = useState(0);

  // Defensive fallback in case family or variants are empty
  if (!family || !family.variants || family.variants.length === 0) {
    return null;
  }

  const variant = family.variants[Math.min(index, family.variants.length - 1)];
  const fund = variant.fund;
  // "2026-07-31" -> "Jul 2026"


  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        {/* Header: Company Avatar & Strategy Count */}
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarColor(
              family.company
            )}`}
          >
            {initials(family.company)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{family.company}</p>
            <p className="text-xs text-slate-500">
              {family.variants.length} {family.variants.length === 1 ? 'strategy' : 'strategies'}
            </p>
          </div>
        </div>

        {/* Strategy Selector */}
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Strategy</p>
        {family.variants.length > 1 ? (
          <select
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            {family.variants.map((v, i) => (
              <option key={v.fund?.code || i} value={i}>
                {v.category}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
            {variant.category}
          </p>
        )}

        {/* NAV & Valuation Date */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            NAV · {niceDate(fund.date)}
          </p>
          <p className="text-3xl font-bold tabular-nums text-slate-900">{navFmt(fund.nav)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {fund.plan} · {fund.option}
          </p>

          {/* Scheme & Category AAUM Section */}
          <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50/70 p-2.5 text-xs text-slate-600">
            {fund.aum?.aumCr ? (
              <p className="flex justify-between">
                <span>Scheme AUM:</span>
                <span className="font-semibold text-slate-800">
                  {crore(fund.aum.aumCr)}{' '}
                  <span className="font-normal text-slate-400">({monthYear(fund.aum.asOf)})</span>
                </span>
              </p>
            ) : (
              <p className="flex justify-between text-slate-400">
                <span>Scheme AUM:</span>
                <span>Pending disclosure</span>
              </p>
            )}

           <div className="mt-3 space-y-1 text-xs text-slate-500">
  <AumLine label="Scheme avg AUM" item={fund.aum.scheme} />
  <AumLine label="Fund house avg AUM" item={fund.aum.house} />
  <AumLine label="Category avg AUM" item={fund.aum.category} />
</div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onOpen(fund)}
        className="mt-5 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.99]"
      >
        View NAV chart
      </button>
    </div>
  );
}
