'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { assignHoles } from '@/lib/groups';
import { saveCourseHoles, type HoleInput } from './holes';

export interface TestGameState {
  ok: boolean;
  error?: string;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * One-shot setup for a live gameplay test. The admin builds the groups by hand —
 * each group is a list of user ids — so any composition works (two teams of
 * four, 1-vs-1-vs-1, two-against-one, a solo group, etc.). Creates an event
 * that's immediately open (bypassing the RSVP window), drops the players in as
 * RSVPs, and creates the foursomes exactly as assigned. Gross scoring + 9-hole
 * front config. On success it redirects to the live scorecard.
 *
 * Players must already have approved accounts and be signed in to score their
 * group's shared card.
 */
export async function createTestGame(
  courseId: string,
  groups: string[][],
  holes: HoleInput[] = [],
): Promise<TestGameState> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };
  if (!courseId) return { ok: false, error: 'Pick a course.' };

  // Clean: dedupe players across groups (first assignment wins) and drop empties.
  const seen = new Set<string>();
  const cleaned: string[][] = [];
  for (const g of groups) {
    const members = (g ?? []).filter((id) => id && !seen.has(id));
    members.forEach((id) => seen.add(id));
    if (members.length > 0) cleaned.push(members);
  }
  if (cleaned.length === 0 || seen.size < 2) {
    return { ok: false, error: 'Add at least 2 players across your groups.' };
  }

  // Persist any par/yardage edits to the course (best-effort).
  if (holes.length > 0) await saveCourseHoles(courseId, holes);

  const now = Date.now();
  const insert = await supabase
    .from('events')
    .insert({
      course_id: courseId,
      course_config: 'front',
      scoring_mode: 'gross',
      status: 'open',
      is_test: true,
      fee_cents: 0,
      opens_at: new Date(now - HOUR_MS).toISOString(),
      closes_at: new Date(now + 6 * HOUR_MS).toISOString(),
      // Tee ~3h out: keeps the event "open" and the active selection, while
      // reading as on-today so the back-to-game ball appears immediately.
      date: new Date(now + 3 * HOUR_MS).toISOString(),
    })
    .select('id')
    .single();
  if (insert.error || !insert.data) {
    return { ok: false, error: insert.error?.message ?? 'Could not create the test event.' };
  }
  const eventId = insert.data.id;

  // RSVP everyone so the event roster reflects the players.
  const rsvpRes = await supabase
    .from('rsvps')
    .insert([...seen].map((user_id) => ({ event_id: eventId, user_id })));
  if (rsvpRes.error) return { ok: false, error: rsvpRes.error.message };

  // Create one foursome per group, exactly as assigned.
  const holeAssignments = assignHoles(cleaned.length, 'front');
  for (let gi = 0; gi < cleaned.length; gi++) {
    const ha = holeAssignments[gi];
    const four = await supabase
      .from('foursomes')
      .insert({
        event_id: eventId,
        hole: ha.hole,
        tier: ha.tier,
        group_index: gi,
      })
      .select('id')
      .single();
    if (four.error || !four.data) {
      return { ok: false, error: four.error?.message ?? 'Could not create a group.' };
    }
    const memberRows = cleaned[gi].map((user_id, idx) => ({
      foursome_id: four.data!.id,
      user_id,
      cart_number: Math.floor(idx / 2) + 1,
    }));
    const mErr = await supabase.from('foursome_members').insert(memberRows);
    if (mErr.error) return { ok: false, error: mErr.error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/leaderboard');
  redirect(`/leaderboard?event=${eventId}`);
}
