'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { requireCourseAdmin, requireEventAdmin } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

/** Weekly series defaults to ~2 years of Thursdays when admin picks
 *  "Until paused". They can stop the series at any time via the
 *  EventSettingsForm; after 2 years it just stops generating. */
const UNTIL_PAUSED_WEEKS = 104;
const MAX_SERIES_WEEKS = 156;

type CourseConfig = Database['public']['Enums']['course_config'];

export interface EventFormState {
  ok: boolean;
  error?: string;
}

/** Minutes to add to UTC to reach America/New_York wall-clock at the given
 *  instant (-240 in EDT, -300 in EST). Computed per-instant so it's correct
 *  on both sides of the DST boundary. */
function etOffsetMinutes(instant: Date): number {
  const utc = new Date(instant.toLocaleString('en-US', { timeZone: 'UTC' }));
  const et = new Date(
    instant.toLocaleString('en-US', { timeZone: 'America/New_York' }),
  );
  return Math.round((et.getTime() - utc.getTime()) / 60000);
}

/** Convert an ET wall-clock (y/mo/d h:mi) to the correct UTC instant, honoring
 *  whether that calendar date falls in EDT or EST. */
function etWallClockToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
): Date {
  // Approximate by treating the wall-clock as if it were UTC, then correct by
  // the ET offset at that approximate instant.
  const approx = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const offset = etOffsetMinutes(approx);
  return new Date(approx.getTime() - offset * 60000);
}

function parseLocalDate(value: string): Date {
  // <input type="datetime-local"> emits a value like "2026-05-14T14:30" with NO
  // timezone. Treat it as ET and convert to the correct UTC instant for that
  // date's offset (EDT in summer, EST in winter — no longer hardcoded).
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error('Invalid date.');
  const [, y, mo, d, h, mi] = m;
  return etWallClockToUtc(+y, +mo, +d, +h, +mi);
}

function defaultWindows(eventDate: Date): { opensAt: Date; closesAt: Date } {
  // RSVP opens 6 days before at noon ET, closes Tuesday before at 6 PM ET.
  // Derive the event's ET calendar date, then build the windows in ET wall-clock
  // so they land at the right local hour regardless of DST.
  const etDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(eventDate); // "YYYY-MM-DD"
  const [ey, em, ed] = etDate.split('-').map(Number);
  const opensAt = etWallClockToUtc(ey, em, ed - 6, 12, 0);
  const closesAt = etWallClockToUtc(ey, em, ed - 2, 18, 0);
  return { opensAt, closesAt };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const dateRaw = formData.get('date') as string | null;
  const courseId = formData.get('course_id') as string | null;
  const courseConfig = (formData.get('course_config') as CourseConfig) ?? 'front';
  const feeDollarsRaw = formData.get('fee_dollars') as string | null;
  const proShopEmail = (formData.get('pro_shop_email') as string | null) ?? null;
  const recurrence = (formData.get('recurrence') as string | null) ?? 'once';
  // `weeks_mode` is the new field: 'count' uses `repeat_count`; 'until_paused'
  // generates UNTIL_PAUSED_WEEKS (~2 years) so the series effectively runs
  // forever until the admin clicks End series. Default to 'count' for
  // backward compatibility with the previous form shape.
  const weeksMode = (formData.get('weeks_mode') as string | null) ?? 'count';
  const repeatRaw = formData.get('repeat_count') as string | null;
  const repeatCountRequest = Math.max(
    1,
    Math.min(MAX_SERIES_WEEKS, parseInt(repeatRaw ?? '1', 10) || 1),
  );

  if (!dateRaw) return { ok: false, error: 'Date is required.' };
  if (!courseId) return { ok: false, error: 'Course is required.' };

  // Authorize against the league that owns the chosen course — not "any admin".
  try {
    await requireCourseAdmin(courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  let firstDate: Date;
  try {
    firstDate = parseLocalDate(dateRaw);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const fee_cents = Math.max(0, Math.round(parseFloat(feeDollarsRaw ?? '0') * 100));

  // Build N events: 1 if one-off, else weekly for the chosen mode.
  let total = 1;
  let seriesId: string | null = null;
  if (recurrence === 'weekly') {
    total =
      weeksMode === 'until_paused' ? UNTIL_PAUSED_WEEKS : repeatCountRequest;
    seriesId = randomUUID();
  }

  const inserts = Array.from({ length: total }, (_, i) => {
    const date = new Date(firstDate);
    date.setUTCDate(date.getUTCDate() + i * 7);
    const { opensAt, closesAt } = defaultWindows(date);
    return {
      date: date.toISOString(),
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
      course_id: courseId,
      course_config: courseConfig,
      fee_cents,
      pro_shop_email: proShopEmail || null,
      status: 'locked' as const,
      series_id: seriesId,
    };
  });

  const res = await supabase.from('events').insert(inserts).select('id');
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  return { ok: true };
}

/** Stop a weekly series at this event. Deletes all FUTURE events sharing
 *  the same series_id (this one stays), but only when the future events
 *  have no foursomes generated yet — we never blow away events that have
 *  been played or have groups built. Returns how many were removed. */
export interface EndSeriesResult {
  ok: boolean;
  error?: string;
  removed?: number;
  skipped?: number;
}

export async function endEventSeries(
  eventId: string,
): Promise<EndSeriesResult> {
  try {
    await requireEventAdmin(eventId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  // 1. Look up the source event.
  const src = await supabase
    .from('events')
    .select('id, date, series_id')
    .eq('id', eventId)
    .maybeSingle();
  if (!src.data) return { ok: false, error: 'Event not found.' };
  if (!src.data.series_id) {
    return { ok: false, error: 'This event isn’t part of a series.' };
  }

  // 2. Find every later event in the same series.
  const future = await supabase
    .from('events')
    .select('id, date')
    .eq('series_id', src.data.series_id)
    .gt('date', src.data.date)
    .order('date', { ascending: true });
  const candidates = future.data ?? [];
  if (candidates.length === 0) {
    return { ok: true, removed: 0, skipped: 0 };
  }

  // 3. Skip events that already have groups / scores so history is safe.
  const candidateIds = candidates.map((e) => e.id);
  const usedRes = await supabase
    .from('foursomes')
    .select('event_id')
    .in('event_id', candidateIds);
  const used = new Set((usedRes.data ?? []).map((f) => f.event_id));
  const deletable = candidates.filter((e) => !used.has(e.id));
  const deletableIds = deletable.map((e) => e.id);
  const skipped = candidates.length - deletable.length;

  if (deletableIds.length === 0) {
    return { ok: true, removed: 0, skipped };
  }

  // 4. Delete RSVPs (FK on delete may or may not cascade depending on
  //    schema — be explicit) and then the events.
  await supabase.from('rsvps').delete().in('event_id', deletableIds);
  const del = await supabase.from('events').delete().in('id', deletableIds);
  if (del.error) return { ok: false, error: del.error.message };

  revalidatePath('/admin');
  revalidatePath('/admin/events');
  revalidatePath('/dashboard');
  return { ok: true, removed: deletableIds.length, skipped };
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requireEventAdmin(eventId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const courseConfig = (formData.get('course_config') as CourseConfig) ?? 'front';
  const feeDollarsRaw = formData.get('fee_dollars') as string | null;
  const proShopEmail = (formData.get('pro_shop_email') as string | null) ?? null;

  const fee_cents = Math.max(0, Math.round(parseFloat(feeDollarsRaw ?? '0') * 100));

  // If the date field is present, update it; otherwise keep existing.
  const updates: Database['public']['Tables']['events']['Update'] = {
    course_config: courseConfig,
    fee_cents,
    pro_shop_email: proShopEmail || null,
  };

  const dateRaw = formData.get('date') as string | null;
  if (dateRaw) {
    try {
      const date = parseLocalDate(dateRaw);
      const { opensAt, closesAt } = defaultWindows(date);
      updates.date = date.toISOString();
      updates.opens_at = opensAt.toISOString();
      updates.closes_at = closesAt.toISOString();
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const res = await supabase.from('events').update(updates).eq('id', eventId);
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/course');
  revalidatePath('/leaderboard');
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await requireEventAdmin(eventId);
  await supabase.from('events').delete().eq('id', eventId);
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin');
}
