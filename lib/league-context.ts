import { cookies } from 'next/headers';
import { cache } from 'react';
import { supabase } from './supabase';
import { getAppUser } from './current-user';
import { isSuperAdmin } from './auth';
import type { Database } from './database.types';

export type LeagueRow = Database['public']['Tables']['leagues']['Row'];

const COOKIE_NAME = 'ff-league';
export { COOKIE_NAME as LEAGUE_COOKIE_NAME };

/** All leagues the current user can switch into.
 *  - Super admins see every league.
 *  - Other users see only the leagues they're a member of. */
export const getMyLeagues = cache(async (): Promise<LeagueRow[]> => {
  const me = await getAppUser();
  if (!me) return [];

  if (isSuperAdmin(me)) {
    const res = await supabase.from('leagues').select('*').order('name');
    return res.data ?? [];
  }

  const memberships = await supabase
    .from('league_memberships')
    .select('league:league_id(*)')
    .eq('user_id', me.id);
  const leagues: LeagueRow[] = [];
  for (const row of memberships.data ?? []) {
    const l = Array.isArray(row.league) ? row.league[0] : row.league;
    if (l) leagues.push(l);
  }
  return leagues.sort((a, b) => a.name.localeCompare(b.name));
});

/** Resolve the current league:
 *  - Honor the `ff-league` cookie when it points at a league the user can see
 *  - Otherwise fall back to the first available league */
export const getCurrentLeague = cache(async (): Promise<LeagueRow | null> => {
  const leagues = await getMyLeagues();
  if (leagues.length === 0) return null;

  const store = await cookies();
  const cookieId = store.get(COOKIE_NAME)?.value;
  if (cookieId) {
    const match = leagues.find((l) => l.id === cookieId);
    if (match) return match;
  }
  return leagues[0];
});

export async function getCurrentLeagueId(): Promise<string | null> {
  return (await getCurrentLeague())?.id ?? null;
}
