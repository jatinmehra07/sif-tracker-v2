import { flattenNavsForDate } from './parse';

function formatToAmfiDate(isoDateStr) {
  const [year, month, day] = isoDateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}-${months[parseInt(month, 10) - 1]}-${year}`;
}

export async function fetchNavsForDate(isoDate) {
  const amfiDate = formatToAmfiDate(isoDate);
  const url = `https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=${amfiDate}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) throw new Error(`AMFI responded ${res.status} for ${isoDate}`);

  const rawText = await res.text();

  // If AMFI returned a layout error or empty result
  if (rawText.trim().startsWith('<') || !rawText.includes(';')) {
    return []; // Likely a weekend or holiday
  }

  // Parse semicolon-separated values
  const lines = rawText.split('\n');
  const rows = [];

  for (const line of lines) {
    const parts = line.split(';').map((p) => p.trim());
    if (parts.length >= 5 && !isNaN(Number(parts[0]))) {
      rows.push({
        schemeCode: parts[0],
        schemeName: parts[1],
        nav: parseFloat(parts[4]),
        date: isoDate
      });
    }
  }

  return rows;
}