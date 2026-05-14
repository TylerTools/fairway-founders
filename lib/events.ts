import { supabase } from './supabase';
import type { Database } from './database.types';
import { liveStatus } from './schedule';

export type EventRow = Database['public']['Tables']['events']['Row'];

/** Compute the next Thursday at 2:30 PM ET from a reference date. */
export function nextThursdayAt230(from = new Date()): Date {
  const d = new Date(from);
  const daysUntil = ((4 - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  // 2:30 PM ET = 18:30 UTC during EDT, 19:30 UTC during EST.
  // Default to EDT (May-Nov); the admin can correct on create if needed.
  d.setUTCHours(18, 30, 0, 0);
  return d;
}

/** Pick the most useful event for the home screen: soonest non-past. */
export function pickActiveEvent(events: EventRow[], now = Date.now()): EventRow | null {
  if (!events.length) return null;
  const future = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (future.length > 0) return future[0];
  // No future events — show the most recent past one.
  return events
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export async function fetchEvents(): Promise<EventRow[]> {
  const res = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  return res.data ?? [];
}

export async function fetchEvent(id: string): Promise<EventRow | null> {
  const res = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  return res.data ?? null;
}

export async function selectEvent(requestedId?: string): Promise<{
  event: EventRow | null;
  events: EventRow[];
}> {
  const events = await fetchEvents();
  if (requestedId) {
    const match = events.find((e) => e.id === requestedId);
    if (match) return { event: match, events };
  }
  return { event: pickActiveEvent(events), events };
}

export type { EventRow as Event };
export { liveStatus };
