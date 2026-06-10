import { NextResponse } from 'next/server';
import { drainEmailQueue } from '@/lib/email-queue';

export const dynamic = 'force-dynamic';

/**
 * Pings the email queue worker. Run by Vercel Cron on a schedule.
 * No-ops cleanly when RESEND_API_KEY isn't set, so it's safe to deploy
 * before the API key is provisioned.
 */
export async function GET() {
  const start = Date.now();
  const result = await drainEmailQueue();
  return NextResponse.json({
    ...result,
    ms: Date.now() - start,
  });
}
