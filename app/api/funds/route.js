import { NextResponse } from 'next/server';
import { getFunds } from '@/lib/queries';

export async function GET() {
  const funds = await getFunds();
  return NextResponse.json(
    { funds },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}