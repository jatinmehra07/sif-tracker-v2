const URL_HISTORY = 'https://www.amfiindia.com/api/sif-nav-history';
const WINDOW_DAYS = 90;

const iso = (d) => d.toISOString().slice(0, 10);

// Cut "the last N days" into windows of up to 90 days, in case AMFI limits how long a range can be
function dateWindows(days) {
  const end = new Date();
  const from = new Date(end);
  from.setUTCDate(from.getUTCDate() - days);
  const windows = [];
  while (from <= end) {
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + WINDOW_DAYS - 1);
    windows.push([iso(from), iso(to < end ? to : end)]);
    from.setUTCDate(from.getUTCDate() + WINDOW_DAYS);
  }
  return windows;
}

async function fetchWindow(code, from, to) {
  const url = `${URL_HISTORY}?query_type=historical_period&from_date=${from}&to_date=${to}&sd_id=${code}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; sif-tracker/1.0)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AMFI responded ${res.status}`);
  const json = await res.json();
  const records = json?.data?.nav_groups?.[0]?.historical_records ?? [];
  return records
    .map((r) => ({ date: String(r.date).slice(0, 10), nav: Number(r.nav) }))
    .filter((p) => p.date.length === 10 && Number.isFinite(p.nav) && p.nav > 0);
}

// NAV history of one scheme (e.g. "SIF-120") for the last `days` days, oldest first
export async function fetchHistory(code, days) {
  const results = await Promise.allSettled(dateWindows(days).map(([from, to]) => fetchWindow(code, from, to)));
  const ok = results.filter((r) => r.status === 'fulfilled');
  if (ok.length === 0) throw new Error('AMFI history is not available right now');

  const byDate = new Map();
  for (const r of ok) for (const p of r.value) byDate.set(p.date, p);
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}