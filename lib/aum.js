import data from '@/data/sif_scheme_aum.json';
import { shortCategory } from '@/lib/format';

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

const schemes = data.schemes.map((s) => ({ ...s, key: norm(s.match) }));
const categories = Object.fromEntries(
  Object.entries(data.categories.aumCr).map(([name, aumCr]) => [norm(name), aumCr])
);

// AUM of one scheme (all its plans together), from the fund house's own monthly fact sheet
export function schemeAum(fundName) {
  const n = norm(fundName);
  const hit = schemes.find((s) => n.startsWith(s.key));
  return hit ? { aumCr: hit.aumCr, asOf: hit.asOf } : null;
}

// AUM of the whole category (every fund in it), from AMFI's monthly SIF report
export function categoryAum(category) {
  const aumCr = categories[norm(shortCategory(category))];
  return aumCr == null ? null : { aumCr, asOf: data.categories.asOf };
}