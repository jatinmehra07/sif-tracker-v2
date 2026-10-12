import { sql } from '@/lib/db';

const unique = (rows, keyOf) => [...new Map(rows.map((r) => [keyOf(r), r])).values()];
const col = (rows, fn) => rows.map(fn);

// Helper to extract a valid scheme code regardless of parser field naming
const getCode = (r) => {
  const c = r?.code ?? r?.schemeCode ?? r?.scheme_code;
  return c !== null && c !== undefined && String(c).trim() !== '' ? String(c).trim() : null;
};

export async function upsertFunds(allRows) {
  if (!allRows || allRows.length === 0) return;

  // Filter out any rows that do not have a valid code
  const validRows = allRows
    .map((r) => ({ ...r, code: getCode(r) }))
    .filter((r) => r.code !== null);

  if (validRows.length === 0) return;

  const rows = unique(validRows, (r) => r.code);

  await sql`
    insert into funds (code, name, company, category, plan, option)
    select * from unnest(
      ${col(rows, (r) => r.code)}::text[],
      ${col(rows, (r) => r.name ?? '')}::text[],
      ${col(rows, (r) => r.company ?? '')}::text[],
      ${col(rows, (r) => r.category ?? null)}::text[],
      ${col(rows, (r) => r.plan ?? '')}::text[],
      ${col(rows, (r) => r.option ?? '')}::text[]
    )
    on conflict (code) do update set
      name = excluded.name,
      company = excluded.company,
      category = coalesce(excluded.category, funds.category),
      plan = excluded.plan,
      option = excluded.option`;
}

export async function upsertNavs(allRows) {
  if (!allRows || allRows.length === 0) return;

  // Filter out rows missing code, date, or numeric nav
  const validRows = allRows
    .map((r) => ({
      ...r,
      code: getCode(r),
      date: r.date ?? r.nav_date,
      nav: r.nav !== null && r.nav !== undefined ? Number(r.nav) : null,
    }))
    .filter((r) => r.code !== null && r.date && r.nav !== null && !isNaN(r.nav));

  if (validRows.length === 0) return;

  const rows = unique(validRows, (r) => `${r.code}|${r.date}`);

  await sql`
    insert into nav_history (code, nav_date, nav)
    select * from unnest(
      ${col(rows, (r) => r.code)}::text[],
      ${col(rows, (r) => r.date)}::date[],
      ${col(rows, (r) => r.nav)}::numeric[]
    )
    on conflict (code, nav_date) do update set
      nav = excluded.nav`;
}