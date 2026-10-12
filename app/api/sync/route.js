import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { syncLatestNavs } from '@/lib/sync';

export async function GET(request) {
  if (!isAuthorized(request)) return new Response('Unauthorized', { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await syncLatestNavs()) });
  } catch (err) {
    console.error('[sync] failed:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 502 });
  }
}