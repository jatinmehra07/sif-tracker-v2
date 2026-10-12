import { flattenLatestNav } from './parse';

const URL_LATEST = 'https://www.amfiindia.com/api/sif-latest-nav?type=';

export async function fetchLatestNavs() {
  const res = await fetch(URL_LATEST, {
    cache: 'no-store',
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; sif-tracker/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AMFI responded ${res.status}`);
  return flattenLatestNav(await res.json());
}