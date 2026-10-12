import { shortCategory } from '@/lib/format';

export const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
// "Altiva Hybrid Long-Short Fund" -> "altivahybridlongshort"
export const keyOf = (name) => norm(String(name ?? '').replace(/\s+fund\s*$/i, ''));

// Builds the AUM lookup from the latest rows in the database (which the AMFI sync fills)
export function buildLookup(dbRows = []) {
  const schemes = dbRows.filter((r) => r.kind === 'scheme').sort((a, b) => b.key.length - a.key.length);
  const categories = new Map(dbRows.filter((r) => r.kind === 'category').map((r) => [r.key, r]));

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