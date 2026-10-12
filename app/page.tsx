import { getFunds } from '@/lib/queries';
import FundGrid from '@/app/components/FundGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const funds = await getFunds().catch((err) => {
    console.error('[home] could not load funds:', err);
    return null;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SIF Tracker</h1>
            <p className="text-sm text-slate-500">Specialised Investment Funds · daily NAVs from AMFI</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            NAVs updated every market day
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {funds ? (
          <FundGrid initialFunds={funds} />
        ) : (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-lg font-semibold text-rose-800">Could not load the data</p>
            <p className="mt-1 text-sm text-rose-700">The database did not respond. Please try again in a moment.</p>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-10 text-xs text-slate-500">
        Source: AMFI. NAVs are published on market days; weekends and holidays show the previous day.AUM figures come from AMFI's Average AUM data and fund-house factsheets; each figure shows the period it covers and may be older than the NAV.
      </footer>
    </div>
  );
}