import { sql } from '@/lib/db';
import { fetchLatestNavs } from '@/lib/amfi/latestNav';
import { upsertFunds, upsertNavs } from '@/lib/store';

export async function syncLatestNavs() {
  const schemes = await fetchLatestNavs();
  if (schemes.length === 0) throw new Error('AMFI returned no schemes');

  const [{ latest: before }] = await sql`select max(nav_date)::text as latest from nav_history`;
  await upsertFunds(schemes);
  await upsertNavs(schemes);
  const [{ latest: after }] = await sql`select max(nav_date)::text as latest from nav_history`;

  return { schemes: schemes.length, latestNavDate: after, isNewDate: before !== after };
}