
import { NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { fetchNavsForDate } from '@/lib/amfi/navHistory';
import { upsertFunds, upsertNavs } from '@/lib/store';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(from, to) {
  const days = [];
  const end = new Date(`${to}T00:00:00Z`);
  for (let d = new Date(`${from}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET(request) {
  if (!isAuthorized(request)) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  if (!isoDay.test(from) || !isoDay.test(to)) {
    return NextResponse.json({ ok: false, error: 'use ?from=YYYY-MM-DD&to=YYYY-MM-DD' }, { status: 400 });
  }
  const days = daysBetween(from, to);
  if (days.length > 45) {
    return NextResponse.json({ ok: false, error: 'max 45 days per call' }, { status: 400 });
  }

  let stored = 0, daysWithData = 0;
  const failed = [];
  for (const day of days) {
    try {
      const rows = await fetchNavsForDate(day);
      if (rows.length) {
        await upsertFunds(rows);
        await upsertNavs(rows);
        stored += rows.length;
        daysWithData++;
      }
    } catch (err) {
      failed.push({ day, error: err.message });
    }
    await sleep(400);          // be polite to AMFI's servers
  }
  return NextResponse.json({ ok: true, days: days.length, daysWithData, stored, failed });
}