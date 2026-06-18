'use server';

import { supabase } from '@/lib/supabase';
import { POINT_WEIGHTS } from '@/lib/points';
import type { MemberCounts } from '@/components/CountTags';
import type { Database } from '@/lib/database.types';

type InteractionKind = Database['public']['Enums']['interaction_kind'];

/**
 * All-time accepted-interaction counts for a member's profile tags.
 * Credit rule: a Four credits the giver only; Links and Birdies credit both
 * parties. Implemented as cheap head-only count queries.
 */
export async function getMemberCountsTags(userId: string): Promise<MemberCounts> {
  const eitherParty = `from_user_id.eq.${userId},to_user_id.eq.${userId}`;
  const [foursRes, linksRes, birdiesRes] = await Promise.all([
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'four')
      .eq('status', 'accepted')
      .eq('from_user_id', userId),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'link')
      .eq('status', 'accepted')
      .or(eitherParty),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'birdie')
      .eq('status', 'accepted')
      .or(eitherParty),
  ]);

  return {
    fours: foursRes.count ?? 0,
    links: linksRes.count ?? 0,
    birdies: birdiesRes.count ?? 0,
  };
}

export interface MemberNetworkStats {
  fours: number;
  links: number;
  birdies: number;
  businessCents: number;
  saves: number;
  activeThisMonth: boolean;
}

/**
 * Public "business card" networking profile: accepted-interaction counts (a Four
 * credits the giver; Link/Birdie credit both parties), the total closed-business
 * $ they've been part of, how many people have saved their contact (vCard), and
 * whether they've had an accepted interaction this calendar month.
 */
export async function getMemberNetworkStats(
  userId: string,
): Promise<MemberNetworkStats> {
  const eitherParty = `from_user_id.eq.${userId},to_user_id.eq.${userId}`;
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [foursRes, linksRes, birdieRowsRes, savesRes, monthRes] = await Promise.all([
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'four')
      .eq('status', 'accepted')
      .eq('from_user_id', userId),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('kind', 'link')
      .eq('status', 'accepted')
      .or(eitherParty),
    supabase
      .from('interactions')
      .select('value_cents')
      .eq('kind', 'birdie')
      .eq('status', 'accepted')
      .or(eitherParty),
    supabase
      .from('link_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('target', 'vcard'),
    supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .gte('responded_at', monthStart)
      .or(eitherParty),
  ]);

  const birdieRows = birdieRowsRes.data ?? [];
  return {
    fours: foursRes.count ?? 0,
    links: linksRes.count ?? 0,
    birdies: birdieRows.length,
    businessCents: birdieRows.reduce((s, r) => s + (r.value_cents ?? 0), 0),
    saves: savesRes.count ?? 0,
    activeThisMonth: (monthRes.count ?? 0) > 0,
  };
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  photo_url: string | null;
  fours: number;
  links: number;
  birdies: number;
  points: number;
}

/**
 * Monthly networking leaderboard ("Givers"). Derived from accepted interactions
 * confirmed (responded_at) in the current calendar month, weighted by
 * POINT_WEIGHTS. Four credits the giver; Link/Birdie credit both parties.
 * Opted-out and non-approved members are excluded.
 */
export async function getNetworkLeaderboard(
  leagueId?: string | null,
): Promise<LeaderboardEntry[]> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  let q = supabase
    .from('interactions')
    .select('kind, from_user_id, to_user_id, league_id')
    .eq('status', 'accepted')
    .gte('responded_at', monthStart);
  if (leagueId) q = q.eq('league_id', leagueId);
  const res = await q;

  const acc = new Map<
    string,
    { fours: number; links: number; birdies: number; points: number }
  >();
  const bump = (uid: string, kind: InteractionKind) => {
    const e = acc.get(uid) ?? { fours: 0, links: 0, birdies: 0, points: 0 };
    if (kind === 'four') e.fours += 1;
    else if (kind === 'link') e.links += 1;
    else e.birdies += 1;
    e.points += POINT_WEIGHTS[kind];
    acc.set(uid, e);
  };

  for (const r of res.data ?? []) {
    if (r.kind === 'four') {
      bump(r.from_user_id, 'four');
    } else {
      bump(r.from_user_id, r.kind);
      bump(r.to_user_id, r.kind);
    }
  }

  const ids = [...acc.keys()];
  if (ids.length === 0) return [];

  const usersRes = await supabase
    .from('users')
    .select('id, name, photo_url, leaderboard_opt_out, access_status')
    .in('id', ids);

  const entries: LeaderboardEntry[] = [];
  for (const u of usersRes.data ?? []) {
    if (u.leaderboard_opt_out || u.access_status !== 'approved') continue;
    const e = acc.get(u.id)!;
    entries.push({
      userId: u.id,
      name: u.name,
      photo_url: u.photo_url,
      fours: e.fours,
      links: e.links,
      birdies: e.birdies,
      points: e.points,
    });
  }

  entries.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return entries;
}
