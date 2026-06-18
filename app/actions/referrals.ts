'use server';

import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';

// URL-safe alphabet without visually ambiguous characters (no l/1/o/0).
const CODE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const CODE_LEN = 7;

function generateCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

/**
 * Return the current member's personal referral code, lazily generating and
 * persisting one on first use. Idempotent and safe to call during render — it
 * does NOT revalidate. Returns null when signed out or on repeated collisions.
 */
export async function getOrCreateMyReferralCode(): Promise<string | null> {
  const me = await getAppUser();
  if (!me) return null;
  if (me.referral_code) return me.referral_code;

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateCode();
    const upd = await supabase
      .from('users')
      .update({ referral_code: code })
      .eq('id', me.id)
      .is('referral_code', null) // don't clobber a concurrently-set code
      .select('referral_code')
      .maybeSingle();

    if (upd.error) continue; // unique collision → try another code
    if (upd.data?.referral_code) return upd.data.referral_code;

    // 0 rows updated → another request set it first; read it back.
    const re = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', me.id)
      .maybeSingle();
    if (re.data?.referral_code) return re.data.referral_code;
  }
  return null;
}

/** How many members a given user has invited (their referral credit). */
export async function getReferralCount(userId: string): Promise<number> {
  const res = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('invited_by', userId);
  return res.count ?? 0;
}

export interface InviteLeaderboardEntry {
  userId: string;
  name: string;
  photo_url: string | null;
  invites: number;
}

/**
 * All-time "most invites" board for a league: members of the league ranked by
 * how many people they've brought in. Distinct from the monthly networking
 * "Givers" board (which counts in-network Four/Link/Birdie). Opted-out and
 * non-approved members are excluded.
 */
export async function getInviteLeaderboard(
  leagueId?: string | null,
): Promise<InviteLeaderboardEntry[]> {
  // Tally invited members by inviter.
  const invitedRes = await supabase
    .from('users')
    .select('invited_by')
    .not('invited_by', 'is', null);
  const counts = new Map<string, number>();
  for (const r of invitedRes.data ?? []) {
    if (!r.invited_by) continue;
    counts.set(r.invited_by, (counts.get(r.invited_by) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  // Restrict to inviters who are active members of this league.
  let inviterIds = [...counts.keys()];
  if (leagueId) {
    const lm = await supabase
      .from('league_memberships')
      .select('user_id')
      .eq('league_id', leagueId)
      .eq('status', 'active')
      .in('user_id', inviterIds);
    const inLeague = new Set((lm.data ?? []).map((r) => r.user_id));
    inviterIds = inviterIds.filter((id) => inLeague.has(id));
  }
  if (inviterIds.length === 0) return [];

  const usersRes = await supabase
    .from('users')
    .select('id, name, photo_url, leaderboard_opt_out, access_status')
    .in('id', inviterIds);

  const entries: InviteLeaderboardEntry[] = [];
  for (const u of usersRes.data ?? []) {
    if (u.leaderboard_opt_out || u.access_status !== 'approved') continue;
    entries.push({
      userId: u.id,
      name: u.name,
      photo_url: u.photo_url,
      invites: counts.get(u.id) ?? 0,
    });
  }
  entries.sort((a, b) => b.invites - a.invites || a.name.localeCompare(b.name));
  return entries;
}
