'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { runGroupGeneration } from './groups';

export interface TestGameState {
  ok: boolean;
  error?: string;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * One-shot setup for a live gameplay test (e.g. a nine-hole scramble with two
 * teams of four). Creates an event that is immediately "open" — bypassing the
 * usual RSVP window — drops the selected players in as RSVPs, then builds the
 * groups. Gross scoring + 9-hole front config so it reads as a clean test.
 *
 * On success it redirects to the live leaderboard for the new event. The 8
 * players must already have real, approved accounts: any member of a group can
 * edit that group's shared scorecard, which requires them to be signed in.
 */
export async function createTestGame(
  courseId: string,
  userIds: string[],
): Promise<TestGameState> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };
  if (!courseId) return { ok: false, error: 'Pick a course.' };

  const uniqueIds = [...new Set(userIds)].filter(Boolean);
  if (uniqueIds.length < 2) {
    return { ok: false, error: 'Pick at least 2 players.' };
  }

  const now = Date.now();
  const insert = await supabase
    .from('events')
    .insert({
      course_id: courseId,
      course_config: 'front',
      scoring_mode: 'gross',
      status: 'open',
      fee_cents: 0,
      opens_at: new Date(now - HOUR_MS).toISOString(),
      closes_at: new Date(now + 6 * HOUR_MS).toISOString(),
      date: new Date(now + 6 * HOUR_MS).toISOString(),
    })
    .select('id')
    .single();
  if (insert.error || !insert.data) {
    return { ok: false, error: insert.error?.message ?? 'Could not create the test event.' };
  }
  const eventId = insert.data.id;

  const rsvpRes = await supabase
    .from('rsvps')
    .insert(uniqueIds.map((user_id) => ({ event_id: eventId, user_id })));
  if (rsvpRes.error) return { ok: false, error: rsvpRes.error.message };

  const gen = await runGroupGeneration(eventId, { skipEmail: true });
  if (!gen.ok) return { ok: false, error: gen.error ?? 'Could not build groups.' };

  revalidatePath('/admin');
  revalidatePath('/leaderboard');
  redirect(`/leaderboard?event=${eventId}`);
}
