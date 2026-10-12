import { sql } from '@/lib/db';

const unique = (rows, keyOf) => [...new Map(rows.map((r) => [keyOf(r), r])).values()];

// Latest row for every scheme / category. Returns [] if the table is not there yet.
export async function getAumRows() {
  try {
    const rows = await sql`
      select distinct on (kind, key) kind, key, name, aum_cr, as_of::text as as_of, source
      from aum
      order by kind, key, as_of desc`;
    return rows.map((r) => ({
      kind: r.kind, key: r.key, name: r.name, aumCr: Number(r.aum_cr), asOf: r.as_of, source: r.source,
    }));
  } catch (err) {
    console.error('[aum] could not read the aum table (did you run db/schema.sql?):', err.message);
    return [];
  }
}

export async function upsertAum(allRows) {
  const rows = unique(allRows, (r) => `${r.kind}|${r.key}|${r.asOf}`);
  if (rows.length === 0) return 0;
  await sql`
    insert into aum (kind, key, name, aum_cr, as_of, source)
    select * from unnest(
      ${rows.map((r) => r.kind)}::text[],
      ${rows.map((r) => r.key)}::text[],
      ${rows.map((r) => r.name)}::text[],
      ${rows.map((r) => r.aumCr)}::numeric[],
      ${rows.map((r) => r.asOf)}::date[],
      ${rows.map((r) => r.source)}::text[]
    )
    on conflict (kind, key, as_of) do update set
      name = excluded.name,
      aum_cr = excluded.aum_cr,
      source = excluded.source,
      updated_at = now()`;
  return rows.length;
}

export async function getSyncHash(id) {
  const rows = await sql`select content_hash from aum_sync_state where id = ${id}`;
  return rows[0]?.content_hash ?? null;
}

// Records that we checked; changed_at only moves when the content really differs.
export async function saveSyncHash(id, hash) {
  await sql`
    insert into aum_sync_state (id, content_hash, checked_at, changed_at)
    values (${id}, ${hash}, now(), now())
    on conflict (id) do update set
      content_hash = excluded.content_hash,
      checked_at = now(),
      changed_at = case when aum_sync_state.content_hash is distinct from excluded.content_hash
                        then now() else aum_sync_state.changed_at end`;
}