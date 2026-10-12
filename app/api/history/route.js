import { NextResponse } from 'next/server';
import { RANGES } from '@/lib/ranges';
import { fetchHistory } from '@/lib/amfi/history';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') ?? '';
  const range = searchParams.get('range') ?? '3M';

  if (!/^SIF-\d+$/.test(code) || !RANGES[range]) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  try {
    const points = await fetchHistory(code, RANGES[range]);
    return NextResponse.json(
      { points },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}