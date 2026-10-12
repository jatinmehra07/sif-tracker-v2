import { createHash } from 'node:crypto';
import { sql } from '@/lib/db';
import { fetchAumJson, extractAum } from '@/lib/amfi/aum';
import { keyOf, norm } from '@/lib/aum';import { upsertAum, getSyncHash, saveSyncHash } from '@/lib/aumStore';

const STATE_ID = 'amfi-aum';



// Fetches AMFI's AUM, keeps only scheme rows that match a fund we track (plus all category totals),
// and stores them only when AMFI's data has actually changed since the last check.
export async function syncAum() {
  const json = await fetchAumJson();
  const { rows: parsed, asOf } = extractAum(json, { unit: process.env.AMFI_AUM_UNIT });
  if (parsed.length === 0) throw new Error('No AUM rows found in the AMFI response. Open /api/aum-debug to see its shape.');

  const fundNames = (await sql`select distinct name from funds where code like 'SIF-%'`).map((f) => norm(f.name));

  const rows = [];
  const unmatched = [];
  const seen = new Set();
  for (const p of parsed) {
    const key = keyOf(p.name);
    const id = `${p.kind}|${key}`;
    if (seen.has(id)) continue;                       // same fund house + strategy listed twice: keep the first
    if (p.kind === 'scheme' && !fundNames.some((n) => n.startsWith(key))) { unmatched.push(p.name); continue; }
    seen.add(id);
    rows.push({ kind: p.kind, key, name: p.name, aumCr: p.aumCr, asOf: p.asOf, source: 'AMFI Average AUM' });
  }

  const hash = createHash('sha256')
    .update(JSON.stringify(rows.map((r) => [r.kind, r.key, r.asOf, r.aumCr]).sort()))
    .digest('hex');
  const changed = hash !== (await getSyncHash(STATE_ID));

  if (changed) await upsertAum(rows);
  await saveSyncHash(STATE_ID, hash);

  return {
    mode: 'amfi', period: asOf, found: parsed.length, matched: rows.length, changed,
    unmatched: unmatched.slice(0, 10),
  };
}