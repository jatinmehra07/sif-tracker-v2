import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { fetchAumJson, extractAum } from '@/lib/amfi/aum';

// Shows what AMFI really returns and what our reader makes of it. Use it to check or adjust lib/amfi/aum.js.
export async function GET(request) {
  if (!isAuthorized(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const json = await fetchAumJson();
    const { rows, asOf } = extractAum(json, { unit: process.env.AMFI_AUM_UNIT });
    return NextResponse.json({
      selectedPeriod: json?.selectedPeriod, readAsPeriodEnd: asOf,
      parsedCount: rows.length,
      categories: rows.filter((r) => r.kind === 'category'),
      schemes: rows.filter((r) => r.kind === 'scheme'),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }
}