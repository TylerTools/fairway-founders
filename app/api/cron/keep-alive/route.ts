import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Pinged by Vercel Cron once a day to keep the Supabase free-tier project
 * from auto-pausing after 7 days of inactivity. Vercel automatically sends
 * its CRON_SECRET in the Authorization header for cron-invoked routes; if
 * we wanted stricter gating we'd verify it here, but a trivial public ping
 * is also fine.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const start = Date.now();
  const { count, error } = await supabase
    .from('users')
    .select('*', { head: true, count: 'exact' });

  return NextResponse.json({
    ok: !error,
    users: count ?? null,
    ms: Date.now() - start,
    error: error?.message ?? null,
  });
}
