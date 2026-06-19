import { supabase } from './supabase';
import type { Database } from './database.types';
import { liveStatus } from './schedule';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type LeagueRow = Database['public']['Tables']['leagues']['Row'];

/** Event joined with its course + league. Course may still be null while
 *  events.course_id is nullable (during the migration window). */
export type EventWithCourse = EventRow & {
  course: (CourseRow & { league: LeagueRow | null }) | null;
};

const ET_TZ = 'America/New_York';

/** Offset (minutes) of a timezone vs UTC at a given instant. EDT → -240, EST → -300. */
function tzOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
    .formatToParts(at)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  const asUtc = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    hour,
    +parts.minute,
    +parts.second,
  );
  return (asUtc - at.getTime()) / 60000;
}

/** Convert a wall-clock time in a timezone to the correct UTC instant
 *  (DST-aware). `month` is 1-based; day overflow is normalized by Date.UTC. */
function zonedWallClockToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const offset = tzOffsetMinutes(timeZone, guess);
  return new Date(guess.getTime() - offset * 60000);
}

/** Compute the next Thursday at 2:30 PM *America/New_York* (DST-correct) from a
 *  reference date, returned as the corresponding UTC instant. Storing the real
 *  instant (not a fixed 18:30 UTC) keeps the tee time at 2:30 ET year-round. */
export function nextThursdayAt230(from = new Date()): Date {
  // Today's calendar date *in ET*, plus that day's ET weekday.
  const etParts = new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ,
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
    .formatToParts(from)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    etParts.weekday,
  );
  const daysUntil = ((4 - weekday + 7) % 7) || 7; // 4 = Thursday; always future
  return zonedWallClockToUtc(
    ET_TZ,
    +etParts.year,
    +etParts.month,
    +etParts.day + daysUntil,
    14,
    30,
  );
}

/** Pick the most useful event for the home screen: soonest non-past. */
export function pickActiveEvent<T extends { date: string }>(
  events: T[],
  now = Date.now(),
): T | null {
  if (!events.length) return null;
  const future = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (future.length > 0) return future[0];
  return events
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

const EVENT_SELECT = '*, course:course_id(*, league:league_id(*))';

export async function fetchEvents(): Promise<EventWithCourse[]> {
  const res = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .order('date', { ascending: true });
  return (res.data ?? []) as unknown as EventWithCourse[];
}

export async function fetchEvent(id: string): Promise<EventWithCourse | null> {
  const res = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle();
  return (res.data ?? null) as unknown as EventWithCourse | null;
}

export async function selectEvent(requestedId?: string): Promise<{
  event: EventWithCourse | null;
  events: EventWithCourse[];
}> {
  const events = await fetchEvents();
  if (requestedId) {
    const match = events.find((e) => e.id === requestedId);
    if (match) return { event: match, events };
  }
  return { event: pickActiveEvent(events), events };
}

/** Fallback when the event has no joined course (shouldn't happen post-seed). */
export const FALLBACK_COURSE_NAME = 'Legacy Golf Club';
export function courseNameFor(event: { course: { name: string } | null } | null): string {
  return event?.course?.name ?? FALLBACK_COURSE_NAME;
}

export type { EventRow as Event };
export { liveStatus };
