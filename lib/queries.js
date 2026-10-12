import { sql } from '@/lib/db';
import { schemeAum, categoryAum } from '@/lib/aum';

// Latest NAV of every SIF scheme
export async function getFunds() {
  const rows = await sql`
    select distinct on (f.code)
           f.code, f.name, f.company, f.category, f.plan, f.option,
           h.nav, h.nav_date::text as date
    from funds f
    join nav_history h on h.code = f.code
    where f.code like 'SIF-%'
    order by f.code, h.nav_date desc`;

  return rows.map((r) => ({
    code: r.code, name: r.name, company: r.company, category: r.category,
    plan: r.plan, option: r.option,
    nav: Number(r.nav), date: r.date,
    aum: schemeAum(r.name),
    categoryAum: categoryAum(r.category),
  }));
}