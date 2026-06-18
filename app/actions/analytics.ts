'use server';

import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type LinkClickTarget = Database['public']['Enums']['link_click_target'];

/**
 * Fire-and-forget profile-view recorder. Deduped to one row per viewer per
 * profile per UTC day by the unique index (duplicate inserts raise 23505, which
 * we swallow). Self-views aren't counted. Never throws; never revalidates.
 */
export async function recordProfileView(profileId: string): Promise<void> {
  try {
    const me = await getAppUser();
    const viewerId = me?.id ?? null;
    if (viewerId && viewerId === profileId) return;
    await supabase.from('profile_views').insert({ profile_id: profileId, viewer_id: viewerId });
  } catch {
    // best-effort, deduped at the DB
  }
}

/** Fire-and-forget outbound-click recorder (website / social / vCard / etc.). */
export async function recordLinkClick(
  profileId: string,
  target: LinkClickTarget,
  memberLinkId?: string,
): Promise<void> {
  try {
    const me = await getAppUser();
    const viewerId = me?.id ?? null;
    if (viewerId && viewerId === profileId) return;
    await supabase.from('link_clicks').insert({
      profile_id: profileId,
      viewer_id: viewerId,
      target,
      member_link_id: memberLinkId ?? null,
    });
  } catch {
    // best-effort, deduped at the DB
  }
}

export interface MyTraffic {
  profileViews: number;
  uniqueViewers: number;
  websiteClicks: number;
  vcardSaves: number;
}

/**
 * Aggregate, current-month traffic for the signed-in member's OWN profile.
 * Counts only — never returns viewer identities.
 */
export async function getMyTraffic(): Promise<MyTraffic> {
  const me = await getAppUser();
  if (!me) {
    return { profileViews: 0, uniqueViewers: 0, websiteClicks: 0, vcardSaves: 0 };
  }
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();

  const [viewsRes, clicksRes] = await Promise.all([
    supabase
      .from('profile_views')
      .select('viewer_id')
      .eq('profile_id', me.id)
      .gte('created_at', monthStart),
    supabase
      .from('link_clicks')
      .select('target')
      .eq('profile_id', me.id)
      .gte('created_at', monthStart),
  ]);

  const views = viewsRes.data ?? [];
  const uniq = new Set(views.map((v) => v.viewer_id).filter(Boolean));
  const clicks = clicksRes.data ?? [];

  return {
    profileViews: views.length,
    uniqueViewers: uniq.size,
    websiteClicks: clicks.filter(
      (c) => c.target === 'website' || c.target === 'social' || c.target === 'link_hub',
    ).length,
    vcardSaves: clicks.filter((c) => c.target === 'vcard').length,
  };
}

export interface ClubValue {
  members: number;
  activeMembers: number;
  newMembers30d: number;
  leagues: { label: string; members: number }[];
  closedBusinessCents: number;
  deals: number;
  fours: number;
  links: number;
  connections: number;
  profileViews30d: number;
  siteClicks30d: number;
  vcardSaves30d: number;
  roundsPlayed: number;
  events: number;
}

/**
 * Club-wide "state of the club" aggregates for pitching sponsors. Cumulative
 * totals for the durable story (members, closed business, connections, rounds)
 * and trailing-30-day figures for traffic/activity. Admin only; counts only.
 *
 * Pass leagueId to scope members/interactions/events to a single league.
 * Pass null (or omit) for the GLN-wide rollup used on /gln/value.
 * Analytics (profile views / link clicks / vCard saves) stay global per the
 * rebuild's analytics-scope decision — they're cross-league by nature.
 */
export async function getClubValue(
  leagueId?: string | null,
): Promise<ClubValue | null> {
  if (!(await canAccessAdmin())) return null;
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Members of the current league (active memberships) when scoped, else all.
  let allowedUserIds: Set<string> | null = null;
  let courseIdsInLeague: string[] | null = null;
  if (leagueId) {
    const [memRes, courseRes] = await Promise.all([
      supabase
        .from('league_memberships')
        .select('user_id')
        .eq('league_id', leagueId)
        .eq('status', 'active'),
      supabase.from('courses').select('id').eq('league_id', leagueId),
    ]);
    allowedUserIds = new Set((memRes.data ?? []).map((r) => r.user_id));
    courseIdsInLeague = (courseRes.data ?? []).map((c) => c.id);
  }

  // For per-league counts, only count users who are active members of the
  // current league. Empty allowedUserIds → match nothing via sentinel UUID.
  const userIdsArr = allowedUserIds ? [...allowedUserIds] : null;
  const sentinel = '00000000-0000-0000-0000-000000000000';

  const baseMembers = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('access_status', 'approved');
  const membersQ = userIdsArr
    ? userIdsArr.length > 0
      ? baseMembers.in('id', userIdsArr)
      : baseMembers.eq('id', sentinel)
    : baseMembers;

  const baseActive = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('access_status', 'approved')
    .gte('last_active_at', since30);
  const activeQ = userIdsArr
    ? userIdsArr.length > 0
      ? baseActive.in('id', userIdsArr)
      : baseActive.eq('id', sentinel)
    : baseActive;

  const baseNew = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('access_status', 'approved')
    .gte('created_at', since30);
  const newQ = userIdsArr
    ? userIdsArr.length > 0
      ? baseNew.in('id', userIdsArr)
      : baseNew.eq('id', sentinel)
    : baseNew;

  const [membersC, activeC, newC, lmRes, interRes, viewsC, clicksRes, roundsC, eventsC] =
    await Promise.all([
      membersQ,
      activeQ,
      newQ,
      leagueId
        ? supabase
            .from('league_memberships')
            .select('league:league_id(short_name, name), user:user_id(access_status)')
            .eq('league_id', leagueId)
            .eq('status', 'active')
        : supabase
            .from('league_memberships')
            .select('league:league_id(short_name, name), user:user_id(access_status)')
            .eq('status', 'active'),
      // Interactions: filter by current league (legacy null-league rows fall
      // through and show in every context). Cross-league mode: no filter.
      leagueId
        ? supabase
            .from('interactions')
            .select('kind, from_user_id, to_user_id, value_cents')
            .eq('status', 'accepted')
            .or(`league_id.eq.${leagueId},league_id.is.null`)
        : supabase
            .from('interactions')
            .select('kind, from_user_id, to_user_id, value_cents')
            .eq('status', 'accepted'),
      // Analytics stay global — by user decision they're aggregated per profile.
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since30),
      supabase.from('link_clicks').select('target').gte('created_at', since30),
      // Rounds played + events: scope by course's league when applicable.
      // Rounds = foursome_members joined to foursomes → events → courses.
      // Cheaper proxy: count foursome_members whose foursome's event's
      // course is in this league. For the per-league rollup we approximate
      // by counting events in the league × average attendance via a follow-up
      // join — but for v1 we just count events and surface rounds as global
      // (analytics-style stat).
      supabase.from('foursome_members').select('id', { count: 'exact', head: true }),
      courseIdsInLeague !== null
        ? courseIdsInLeague.length > 0
          ? supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .in('course_id', courseIdsInLeague)
          : Promise.resolve({ count: 0, data: null, error: null, status: 200, statusText: 'OK' })
        : supabase.from('events').select('id', { count: 'exact', head: true }),
    ]);

  const leagueMap = new Map<string, number>();
  for (const r of lmRes.data ?? []) {
    const l = Array.isArray(r.league) ? r.league[0] : r.league;
    const u = Array.isArray(r.user) ? r.user[0] : r.user;
    if (!l || u?.access_status !== 'approved') continue;
    const label = l.short_name || l.name;
    leagueMap.set(label, (leagueMap.get(label) ?? 0) + 1);
  }
  const leagues = [...leagueMap.entries()]
    .map(([label, members]) => ({ label, members }))
    .sort((a, b) => b.members - a.members);

  let closedBusinessCents = 0;
  let deals = 0;
  let fours = 0;
  let links = 0;
  const pairs = new Set<string>();
  for (const r of interRes.data ?? []) {
    if (r.kind === 'four') fours += 1;
    else if (r.kind === 'link') links += 1;
    else if (r.kind === 'birdie') {
      deals += 1;
      closedBusinessCents += r.value_cents ?? 0;
    }
    const a = r.from_user_id;
    const b = r.to_user_id;
    pairs.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }

  const clicks = clicksRes.data ?? [];

  return {
    members: membersC.count ?? 0,
    activeMembers: activeC.count ?? 0,
    newMembers30d: newC.count ?? 0,
    leagues,
    closedBusinessCents,
    deals,
    fours,
    links,
    connections: pairs.size,
    profileViews30d: viewsC.count ?? 0,
    siteClicks30d: clicks.filter(
      (c) => c.target === 'website' || c.target === 'social' || c.target === 'link_hub',
    ).length,
    vcardSaves30d: clicks.filter((c) => c.target === 'vcard').length,
    roundsPlayed: roundsC.count ?? 0,
    events: eventsC.count ?? 0,
  };
}
