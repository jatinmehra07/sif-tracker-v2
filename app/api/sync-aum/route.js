import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { syncAum, seedAum } from '@/lib/aumSync';

// GET /api/sync-aum          -> fetch AMFI's AUM and store it if it changed
// GET /api/sync-aum?seed=1   -> load data/sif_scheme_aum.json into the database (once)
export async function GET(request) {
  if (!isAuthorized(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const seed = new URL(request.url).searchParams.get('seed') === '1';
    return NextResponse.json({ ok: true, ...(seed ? await seedAum() : await syncAum()) });
  } catch (err) {
    console.error('[sync-aum] failed:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }
}