'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAppUser } from '@/lib/current-user';
import { isSuperAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { LEAGUE_COOKIE_NAME } from '@/lib/league-context';

/** Set the active league cookie. Verifies the user can actually see that
 *  league (super_admin or has a membership row). */
export async function setLeagueContext(leagueId: string): Promise<void> {
  const me = await getAppUser();
  if (!me) return;

  if (!isSuperAdmin(me)) {
    const membership = await supabase
      .from('league_memberships')
      .select('id')
      .eq('user_id', me.id)
      .eq('league_id', leagueId)
      .maybeSingle();
    if (!membership.data) return; // silently ignore unauthorized switches
  }

  const store = await cookies();
  store.set(LEAGUE_COOKIE_NAME, leagueId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });

  // The layout reads this cookie; revalidate everything so the new league
  // takes effect across the app on next render.
  revalidatePath('/', 'layout');
}
