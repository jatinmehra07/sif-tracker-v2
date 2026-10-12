'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { niceDate, shortCategory } from '@/lib/format';
import FundCard from './FundCard';
import FundModal from './FundModal';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function FundGrid({ initialFunds }) {
  // Starts with the server's data, then re-checks every 5 minutes and when you return to the tab
  const { data, error } = useSWR('/api/funds', fetcher, {
    fallbackData: { funds: initialFunds },
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: true,
  });
  const funds = data?.funds ?? [];

  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('regular');
  const [selected, setSelected] = useState(null);

  // One card per fund house. Its strategies (categories) go into the card's dropdown.
  const families = useMemo(() => {
    const byCompany = new Map();
    for (const f of funds) {
      const isDirect = /direct/i.test(f.plan ?? '');
      if (!/growth/i.test(f.option ?? '') || isDirect !== (plan === 'direct')) continue;
      const category = shortCategory(f.category) ?? 'Other';
      if (!byCompany.has(f.company)) byCompany.set(f.company, new Map());
      if (!byCompany.get(f.company).has(category)) byCompany.get(f.company).set(category, f);
    }
    return [...byCompany.entries()]
      .map(([company, cats]) => ({
        company,
        variants: [...cats.entries()]
          .map(([category, fund]) => ({ category, fund }))
          .sort((a, b) => a.category.localeCompare(b.category)),
      }))
      .sort((a, b) => a.company.localeCompare(b.company));
  }, [funds, plan]);

  const shown = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return families;
    return families.filter(
      (fam) => fam.company.toLowerCase().includes(q) || fam.variants.some((v) => v.category.toLowerCase().includes(q))
    );
  }, [families, search]);

  const latestDate = funds.map((f) => f.date).sort().at(-1);
  const strategies = families.reduce((n, fam) => n + fam.variants.length, 0);

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Fund houses" value={families.length} />
        <Stat label="Strategies" value={strategies} hint="across all fund houses" />
        <Stat label="Latest NAV date" value={latestDate ? niceDate(latestDate) : '—'} hint="published on market days" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search a fund house or strategy…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {[['regular', 'Regular plan'], ['direct', 'Direct plan']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setPlan(val)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${plan === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Growth option NAVs. {error ? 'Could not refresh, showing saved data.' : 'Refreshes every 5 minutes.'}
      </p>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-800">{funds.length === 0 ? 'No data yet' : 'No fund house matches your search'}</p>
          <p className="mt-1 text-sm text-slate-500">
            {funds.length === 0 ? 'Run the sync once to load the first NAVs.' : 'Try a different name.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((fam) => (
            <FundCard key={`${fam.company}-${plan}`} family={fam} onOpen={setSelected} />
          ))}
        </div>
      )}

      {selected && <FundModal fund={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}