import seed from '@/data/sif_scheme_aum.json';
import { shortCategory } from '@/lib/format';

export const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
// "Altiva Hybrid Long-Short Fund" -> "altivahybridlongshort"
export const keyOf = (name) => norm(String(name ?? '').replace(/\s+fund\s*$/i, ''));

// The figures we shipped with (data/sif_scheme_aum.json). Used as a starting point and as a fallback.
export function seedRows() {
  const cat = seed.categories;
  return [
    ...Object.entries(cat.aumCr).map(([name, aumCr]) => ({
      kind: 'category', key: keyOf(name), name, aumCr, asOf: cat.asOf, source: cat.source,
    })),
    ...seed.schemes.map((s) => ({
      kind: 'scheme', key: keyOf(s.match), name: s.match, aumCr: s.aumCr, asOf: s.asOf, source: 'Fund house factsheet',
    })),
  ];
}

export const categoryKeys = () => new Set(Object.keys(seed.categories.aumCr).map(keyOf));

// Combines the seed file with the latest rows from the database. For each fund the NEWEST period wins,
// so a stale database row can never hide a fresher figure, and a missing table never breaks the site.
export function buildLookup(dbRows = []) {
  const best = new Map();
  for (const r of [...seedRows(), ...dbRows]) {
    const id = `${r.kind}|${r.key}`;
    const cur = best.get(id);
    if (!cur || r.asOf >= cur.asOf) best.set(id, r);      // ISO dates compare correctly as text
  }
  const schemes = [];
  const categories = new Map();
  for (const r of best.values()) (r.kind === 'scheme' ? schemes.push(r) : categories.set(r.key, r));
  schemes.sort((a, b) => b.key.length - a.key.length);   // most specific name first

  return {
    // AUM of one scheme (all its plans together)
    scheme(fundName) {
      const n = norm(fundName);
      const hit = schemes.find((s) => n.startsWith(s.key));
      return hit ? { aumCr: hit.aumCr, asOf: hit.asOf } : null;
    },
    // AUM of the whole category (every fund in it)
    category(category) {
      const hit = categories.get(norm(shortCategory(category)));
      return hit ? { aumCr: hit.aumCr, asOf: hit.asOf } : null;
    },
  };
}