'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canManageLeague, getMyLeagueMemberships } from '@/lib/auth';
import { COURSE_OPTIONS } from '@/lib/schedule';

export interface ScoreActionState {
  ok: boolean;
  error?: string;
}

export async function upsertHoleScore(
  foursomeId: string,
  hole: number,
  strokes: number | null,
): Promise<ScoreActionState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  // Resolve foursome → event → course → league for authorization, the lock
  // check, and the hole-range check.
  const four = await supabase
    .from('foursomes')
    .select('id, event_id, submitted_at')
    .eq('id', foursomeId)
    .maybeSingle();
  if (!four.data) return { ok: false, error: 'Group not found.' };
  const evt = await supabase
    .from('events')
    .select('course_id, course_config, closed_at')
    .eq('id', four.data.event_id)
    .maybeSingle();
  if (!evt.data) return { ok: false, error: 'Event not found.' };
  const course = await supabase
    .from('courses')
    .select('league_id')
    .eq('id', evt.data.course_id)
    .maybeSingle();
  const leagueId = course.data?.league_id ?? null;

  // A scramble group shares one card: an admin of THIS league can score any
  // group; everyone else can only score the group they belong to.
  const memberships = await getMyLeagueMemberships();
  const isAdmin = !!leagueId && canManageLeague(me, leagueId, memberships);
  if (!isAdmin) {
    const mine = await supabase
      .from('foursome_members')
      .select('id')
      .eq('foursome_id', foursomeId)
      .eq('user_id', me.id)
      .maybeSingle();
    if (!mine.data) return { ok: false, error: 'Not your group.' };
  }

  // Once the round is closed (Final) or the card is submitted, scoring is
  // frozen — an admin must reopen the round, or the group un-submit the card.
  if (evt.data.closed_at || four.data.submitted_at) {
    return { ok: false, error: 'This scorecard is locked.' };
  }

  // Only accept holes that belong to this event's configured layout.
  if (!COURSE_OPTIONS[evt.data.course_config].holes.includes(hole)) {
    return { ok: false, error: 'That hole isn’t part of this round.' };
  }

  if (strokes == null || Number.isNaN(strokes) || strokes <= 0) {
    await supabase
      .from('hole_scores')
      .delete()
      .eq('foursome_id', foursomeId)
      .eq('hole', hole);
  } else {
    const clamped = Math.max(1, Math.min(15, Math.round(strokes)));
    const existing = await supabase
      .from('hole_scores')
      .select('id')
      .eq('foursome_id', foursomeId)
      .eq('hole', hole)
      .maybeSingle();
    if (existing.data) {
      await supabase
        .from('hole_scores')
        .update({ strokes: clamped })
        .eq('id', existing.data.id);
    } else {
      await supabase
        .from('hole_scores')
        .insert({ foursome_id: foursomeId, hole, strokes: clamped });
    }
  }

  revalidatePath('/leaderboard');
  return { ok: true };
}
