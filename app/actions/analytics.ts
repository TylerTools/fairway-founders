'use server';

import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
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
