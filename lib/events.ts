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

/** Compute the next Thursday at 2:30 PM ET from a reference date. */
export function nextThursdayAt230(from = new Date()): Date {
  const d = new Date(from);
  const daysUntil = ((4 - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  d.setUTCHours(18, 30, 0, 0);
  return d;
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
