import { NextResponse } from 'next/server';
import { drainEmailQueue } from '@/lib/email-queue';

export const dynamic = 'force-dynamic';

/**
 * Pings the email queue worker. Run by Vercel Cron on a schedule.
 * No-ops cleanly when RESEND_API_KEY isn't set, so it's safe to deploy
 * before the API key is provisioned.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const start = Date.now();
  const result = await drainEmailQueue();
  return NextResponse.json({
    ...result,
    ms: Date.now() - start,
  });
}
