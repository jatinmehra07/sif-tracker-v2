export const pct = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`);
export const navFmt = (n) => `₹${n.toFixed(4)}`;
export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export const tone = (v) => (v == null ? 'text-slate-400' : v >= 0 ? 'text-emerald-600' : 'text-rose-600');
export const arrow = (v) => (v == null || v === 0 ? '' : v > 0 ? '▲ ' : '▼ ');

// "2026-10-09" -> "9 Oct 2026"
export function niceDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

// "Equity Oriented Investment Strategies - Equity Ex-Top 100 Long-Short Fund" -> "Equity Ex-Top 100 Long-Short"
export function shortCategory(cat) {
  if (!cat) return null;
  const parts = cat.split(' - ');
  return parts[parts.length - 1].replace(/ Fund$/i, '');
}

const COLORS = ['bg-sky-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600',
                'bg-rose-600', 'bg-teal-600', 'bg-indigo-600', 'bg-fuchsia-600'];

export function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export const initials = (name = '') =>
  name.replace(/ SIF$/i, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export const crore = (n) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')} Cr`);
// "2026-07-31" -> "Jul 2026"
export function monthYear(iso) {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}