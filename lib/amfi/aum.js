// AMFI SIF "Average AUM": https://www.amfiindia.com/sif/average-aum
//
// The page's data comes from AMFI_AUM_URL (set in your environment variables). Its response looks like:
//   { data: [ { sifname: "Altiva SIF", SchemeCat_Desc: "Hybrid Investment Strategies - Hybrid Long-Short Fund",
//               schemes: [ { SchemeNAVName, AMFI_Code, AverageAumForTheMonth } ... ],
//               totalAUM: { AverageAum } },
//             { sifname: "Altiva SIF Total", SchemeCat_Desc: "Total", schemes: [], totalAUM: {...} } ... ],
//     selectedPeriod: ... }
// AMFI reports these amounts in RUPEES LAKH (100 lakh = 1 crore). Only this file knows that format.

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const monthNo = (s) => MONTHS[String(s).slice(0, 3).toLowerCase()] ?? null;
const pad = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();   // m is 1-12

// Turns "September 2026", "January - March 2026", "31-Mar-2026" or "2026-03-31" into the period's last day (ISO)
export function periodEnd(text) {
  const s = String(text ?? '').trim();
  let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = s.match(/(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s,]*(\d{4})/)) && monthNo(m[2]))
    return `${m[3]}-${pad(monthNo(m[2]))}-${pad(m[1])}`;
  if ((m = s.match(/([A-Za-z]{3,9})\s*[-–to]+\s*([A-Za-z]{3,9})\s*,?\s*(\d{4})/)) && monthNo(m[2]))
    return `${m[3]}-${pad(monthNo(m[2]))}-${pad(lastDay(+m[3], monthNo(m[2])))}`;
  if ((m = s.match(/([A-Za-z]{3,9})[\s,-]+(\d{4})/)) && monthNo(m[1]))
    return `${m[2]}-${pad(monthNo(m[1]))}-${pad(lastDay(+m[2], monthNo(m[1])))}`;
  return null;
}

// selectedPeriod may be a string or an object; find the first text in it that reads as a period
function findPeriod(node) {
  if (typeof node === 'string') return periodEnd(node);
  if (node && typeof node === 'object')
    for (const v of Object.values(node)) { const p = findPeriod(v); if (p) return p; }
  return null;
}

const toNum = (v) => {
  if (v == null || String(v).trim() === '') return null;      // missing is not zero
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ₹]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// "Hybrid Investment Strategies - Hybrid Long-Short Fund" -> "Hybrid Long-Short"
const shortCat = (cat) => clean(String(cat ?? '').split(' - ').pop()).replace(/ Fund$/i, '');
// "Altiva SIF" -> "Altiva"
const brand = (sifname) => clean(sifname).replace(/\s+SIF$/i, '');

// Reads AMFI's response into rows:
//   kind 'scheme':   one per fund house + strategy (all plans together), e.g. "Altiva Hybrid Long-Short"
//   kind 'category': one per strategy, summed over every fund house, e.g. "Hybrid Long-Short"
export function extractAum(json, { unit = 'lakh' } = {}) {
  const divisor = String(unit).toLowerCase() === 'crore' ? 1 : 100;
  const asOf = findPeriod(json?.selectedPeriod);
  if (!asOf) throw new Error('Could not read the period from AMFI "selectedPeriod". Check /api/aum-debug.');

  const rows = [];
  const categoryTotals = new Map();

  for (const g of json?.data ?? []) {
    if (!g?.schemes?.length || /^total$/i.test(clean(g.SchemeCat_Desc))) continue;   // skip the "... Total" rows

    // AMFI gives the group total; if it is missing, add up the plans ourselves
    const total = toNum(g.totalAUM?.AverageAum) ?? g.schemes.reduce((n, s) => n + (toNum(s.AverageAumForTheMonth) ?? 0), 0);
    const cat = shortCat(g.SchemeCat_Desc);
    if (!cat || !brand(g.sifname)) continue;

    const aumCr = +(total / divisor).toFixed(2);
    rows.push({ kind: 'scheme', name: `${brand(g.sifname)} ${cat}`, aumCr, asOf });
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + total);
  }

  for (const [cat, total] of categoryTotals)
    rows.push({ kind: 'category', name: cat, aumCr: +(total / divisor).toFixed(2), asOf });

  return { rows, asOf };
}

export async function fetchAumJson() {
  const url = process.env.AMFI_AUM_URL;
  if (!url) throw new Error('AMFI_AUM_URL is not set. Add the AMFI AUM request URL to your environment variables.');
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; sif-tracker/1.0)' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`AMFI responded ${res.status}`);
  return res.json();
}