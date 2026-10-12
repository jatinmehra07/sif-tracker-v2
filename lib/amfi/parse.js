const MONTHS = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                 Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };

const clean = (s) => String(s).replace(/\s+/g, ' ').trim();
const planOf = (name, plan) => plan ?? (/direct/i.test(name) ? 'Direct Plan' : 'Regular Plan');
const optionOf = (name, option) => option ?? (/idcw/i.test(name) ? 'IDCW' : 'Growth');

// "09-Oct-2026" -> "2026-10-09"
function toIsoDate(d) {
  const [dd, mon, yyyy] = String(d).trim().split('-');
  return MONTHS[mon] ? `${yyyy}-${MONTHS[mon]}-${dd.padStart(2, '0')}` : null;
}

// Shape of sif-latest-nav: data -> categories -> groups -> schemes
export function flattenLatestNav(json) {
  const out = [];
  for (const block of json?.data ?? [])
    for (const cat of block.categories ?? [])
      for (const group of cat.groups ?? [])
        for (const s of group.schemes ?? []) {
          const nav = Number(s.NetAssetValue);
          const date = toIsoDate(s.Date);
          if (!s.Sd_Id || !Number.isFinite(nav) || nav <= 0 || !date) continue;
          const name = clean(s.NavName);
          out.push({
            code: s.Sd_Id, name, company: s.SIFName, category: s.category,
            plan: planOf(name, s.Plan), option: optionOf(name, s.Option), nav, date,
          });
        }
  return out;
}

// Shape of sif-nav-history?query_type=all_for_date: data -> schemes -> navs
export function flattenNavsForDate(json) {
  const out = [];
  if (!Array.isArray(json?.data)) return out;     // weekend or holiday: nothing published
  for (const amc of json.data)
    for (const scheme of amc.schemes ?? [])
      for (const n of scheme.navs ?? []) {
        const nav = Number(n.hNAV_Amt);
        if (!n.SD_ID || !Number.isFinite(nav) || nav <= 0) continue;
        const name = clean(n.NAV_Name);
        out.push({
          code: n.SD_ID, name, company: amc.mfName,
          plan: planOf(name, n.Plan), option: optionOf(name, n.Option),
          nav, date: n.hNAV_Date.slice(0, 10),
        });
      }
  return out;
}