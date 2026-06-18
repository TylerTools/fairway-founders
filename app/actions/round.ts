'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';

export interface RoundActionState {
  ok: boolean;
  error?: string;
}

async function isGroupMember(foursomeId: string, userId: string): Promise<boolean> {
  const r = await supabase
    .from('foursome_members')
    .select('id')
    .eq('foursome_id', foursomeId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!r.data;
}

/**
 * Mark a group's shared scorecard submitted (or reopen it). Any member of the
 * group — or an admin — can do this. A submitted card locks for editing until
 * reopened, and shows as "in" on the leaderboard.
 */
export async function setScorecardSubmitted(
  foursomeId: string,
  submitted: boolean,
): Promise<RoundActionState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  const isAdmin = await canAccessAdmin();
  if (!isAdmin && !(await isGroupMember(foursomeId, me.id))) {
    return { ok: false, error: 'Not your group.' };
  }
  const { error } = await supabase
    .from('foursomes')
    .update({ submitted_at: submitted ? new Date().toISOString() : null })
    .eq('id', foursomeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/leaderboard');
  return { ok: true };
}

/**
 * Close out the round (admin only). A real event is finalized — closed_at is
 * stamped, the leaderboard reads "Final", and scoring locks; its scores stay on
 * record for the event. A test event is wiped entirely (event + groups + scores
 * + RSVPs) and the admin is sent back to the test-setup page.
 */
export async function closeRound(eventId: string): Promise<RoundActionState> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };

  const evt = await supabase
    .from('events')
    .select('id, is_test')
    .eq('id', eventId)
    .maybeSingle();
  if (!evt.data) return { ok: false, error: 'Event not found.' };

  if (evt.data.is_test) {
    const fs = await supabase.from('foursomes').select('id').eq('event_id', eventId);
    const fids = (fs.data ?? []).map((f) => f.id);
    if (fids.length) {
      await supabase.from('hole_scores').delete().in('foursome_id', fids);
      await supabase.from('foursome_members').delete().in('foursome_id', fids);
    }
    await supabase.from('foursomes').delete().eq('event_id', eventId);
    await supabase.from('rsvps').delete().eq('event_id', eventId);
    await supabase.from('events').delete().eq('id', eventId);
    revalidatePath('/leaderboard');
    revalidatePath('/admin');
    redirect('/admin/test');
  }

  const { error } = await supabase
    .from('events')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', eventId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/leaderboard');
  revalidatePath('/admin');
  return { ok: true };
}

/** Reopen a finalized (non-test) round so scores can be edited again. */
export async function reopenRound(eventId: string): Promise<RoundActionState> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };
  const { error } = await supabase
    .from('events')
    .update({ closed_at: null })
    .eq('id', eventId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/leaderboard');
  return { ok: true };
}
