import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { syncAum } from '@/lib/aumSync';

// GET /api/sync-aum -> fetch AMFI's AUM and store it if it changed
export async function GET(request) {
  if (!isAuthorized(request)) return new Response('Unauthorized', { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await syncAum()) });
  } catch (err) {
    console.error('[sync-aum] failed:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }
}