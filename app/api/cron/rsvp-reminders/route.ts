import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { queueEmail } from '@/lib/email-queue';

export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

/**
 * Once-a-day cron that decides whether to send a reminder for the upcoming
 * event based on the current day-of-week (in ET):
 *
 *   Monday   → "Heads up — Thursday round is open" (nudge non-RSVPed)
 *   Tuesday  → "Last call — RSVP closes today at 6pm ET"
 *   other    → no-op
 *
 * Queues into email_log; the send-emails cron actually delivers.
 *
 * Run with `?mode=monday` or `?mode=tuesday` to force-run regardless of
 * the actual day (used for manual testing).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const forceMode = url.searchParams.get('mode');

  const mode = forceMode ?? dayOfWeekET();
  if (mode !== 'monday' && mode !== 'tuesday') {
    return NextResponse.json({ ok: true, skipped: true, reason: `today=${mode}` });
  }

  const now = new Date().toISOString();
  // Find the soonest future event with an open or about-to-open RSVP window
  const evtRes = await supabase
    .from('events')
    .select('id, date, course:course_id(name)')
    .gte('date', now)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!evtRes.data) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'no upcoming event' });
  }
  const event = evtRes.data;
  const courseInfo = Array.isArray(event.course) ? event.course[0] : event.course;
  const courseName = courseInfo?.name ?? 'the course';
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Who has RSVPed already?
  const rsvpRes = await supabase
    .from('rsvps')
    .select('user_id')
    .eq('event_id', event.id);
  const rsvped = new Set((rsvpRes.data ?? []).map((r) => r.user_id));

  // Approved members who could be reminded
  const usersRes = await supabase
    .from('users')
    .select('id, name, email')
    .eq('access_status', 'approved');
  const candidates = (usersRes.data ?? []).filter((u) => !rsvped.has(u.id));

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      eventId: event.id,
      reminded: 0,
      reason: 'everyone already RSVPed',
    });
  }

  let queued = 0;
  for (const u of candidates) {
    const first = u.name.split(' ')[0] || 'there';
    const subject =
      mode === 'monday'
        ? `Heads up — ${dateStr} at ${courseName}`
        : `Last call — RSVP closes today at 6pm ET`;
    const body =
      mode === 'monday'
        ? [
            `Hi ${first},`,
            '',
            `Just a heads up — the next Fairway Founders round is ${dateStr} at ${courseName}. RSVP closes Tuesday at 6pm ET.`,
            '',
            `RSVP here: ${SITE_URL}/dashboard`,
            '',
            '— Fairway Founders',
          ].join('\n')
        : [
            `Hi ${first},`,
            '',
            `Last call — RSVP for ${dateStr} at ${courseName} closes tonight at 6pm ET. Groups are built right after.`,
            '',
            `RSVP here: ${SITE_URL}/dashboard`,
            '',
            '— Fairway Founders',
          ].join('\n');
    await queueEmail({
      kind: 'rsvp_reminder',
      toEmail: u.email,
      toUserId: u.id,
      subject,
      body,
      eventId: event.id,
    });
    queued++;
  }

  return NextResponse.json({
    ok: true,
    mode,
    eventId: event.id,
    queued,
    skipped: usersRes.data?.length ? rsvped.size : 0,
  });
}

/** Returns 'monday' / 'tuesday' / 'other' in Eastern Time. */
function dayOfWeekET(): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'America/New_York',
  });
  const name = fmt.format(new Date()).toLowerCase();
  return name === 'monday' || name === 'tuesday' ? name : 'other';
}
