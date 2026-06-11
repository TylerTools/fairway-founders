'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getCurrentLeagueId } from '@/lib/league-context';
import { canAccessAdmin } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

export type SponsorshipKind = Database['public']['Enums']['sponsorship_kind'];
export type SponsorshipStatus = Database['public']['Enums']['sponsorship_status'];

export interface MySponsorship {
  id: string;
  kind: SponsorshipKind;
  status: SponsorshipStatus;
  ends_at: string | null;
}

export async function getMySponsorship(): Promise<MySponsorship | null> {
  const me = await getAppUser();
  if (!me) return null;
  const res = await supabase
    .from('sponsorships')
    .select('id, kind, status, ends_at')
    .eq('user_id', me.id)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return res.data ?? null;
}

export async function requestSponsorship(
  kind: SponsorshipKind,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const existing = await supabase
    .from('sponsorships')
    .select('id')
    .eq('user_id', me.id)
    .in('status', ['requested', 'active'])
    .limit(1);
  if (existing.data && existing.data.length) {
    return { ok: false, error: 'You already have a pending or active sponsorship.' };
  }

  const leagueId = await getCurrentLeagueId();
  const ins = await supabase.from('sponsorships').insert({
    user_id: me.id,
    kind,
    status: 'requested',
    note: note?.slice(0, 500) || null,
    league_id: leagueId,
  });
  if (ins.error) return { ok: false, error: ins.error.message };

  try {
    const admins = await supabase
      .from('users')
      .select('id')
      .eq('app_role', 'super_admin')
      .eq('access_status', 'approved')
      .neq('id', me.id);
    const rows = (admins.data ?? []).map((a) => ({
      user_id: a.id,
      kind: 'sponsorship_request' as const,
      title: `${me.name} requested ${
        kind === 'featured' ? 'a featured listing' : 'to sponsor a round'
      }`,
      body: note?.slice(0, 200) || null,
      link: '/admin/sponsorships',
      created_by: me.id,
    }));
    if (rows.length) await supabase.from('notifications').insert(rows);
  } catch {
    // best-effort
  }

  revalidatePath('/me');
  revalidatePath('/admin/sponsorships');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export interface PendingSponsorship {
  id: string;
  kind: SponsorshipKind;
  note: string | null;
  requested_at: string;
  user: { id: string; name: string; company: string | null; photo_url: string | null };
}

export async function getPendingSponsorships(): Promise<PendingSponsorship[]> {
  if (!(await canAccessAdmin())) return [];
  const res = await supabase
    .from('sponsorships')
    .select('id, kind, note, requested_at, user:user_id(id, name, company, photo_url)')
    .eq('status', 'requested')
    .order('requested_at', { ascending: true });
  return (res.data ?? []).map((r) => {
    const u = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      id: r.id,
      kind: r.kind,
      note: r.note,
      requested_at: r.requested_at,
      user: {
        id: u?.id ?? '',
        name: u?.name ?? 'Member',
        company: u?.company ?? null,
        photo_url: u?.photo_url ?? null,
      },
    };
  });
}

export async function decideSponsorship(
  id: string,
  approve: boolean,
  windowDays = 30,
  amountCents?: number,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };
  const me = await getAppUser();

  const row = await supabase
    .from('sponsorships')
    .select('id, user_id, kind, status')
    .eq('id', id)
    .maybeSingle();
  if (!row.data) return { ok: false, error: 'Request not found.' };
  if (row.data.status !== 'requested') return { ok: false, error: 'Already decided.' };

  const now = new Date();
  const ends = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000).toISOString();
  const upd = await supabase
    .from('sponsorships')
    .update(
      approve
        ? {
            status: 'active',
            approved_by: me?.id ?? null,
            starts_at: now.toISOString(),
            ends_at: ends,
            amount_cents: amountCents ?? null,
          }
        : { status: 'declined', approved_by: me?.id ?? null },
    )
    .eq('id', id);
  if (upd.error) return { ok: false, error: upd.error.message };

  try {
    await supabase.from('notifications').insert({
      user_id: row.data.user_id,
      kind: approve ? 'sponsorship_approved' : 'sponsorship_declined',
      title: approve
        ? `Your ${row.data.kind === 'featured' ? 'featured listing' : 'round sponsorship'} is live`
        : 'Your sponsorship request was declined',
      body: null,
      link: '/me',
      created_by: me?.id ?? null,
    });
  } catch {
    // best-effort
  }

  revalidatePath('/admin/sponsorships');
  revalidatePath('/roster');
  revalidatePath('/me');
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Featured member IDs currently pinned to the top of the directory. */
export async function getActiveFeaturedUserIds(): Promise<string[]> {
  const nowIso = new Date().toISOString();
  const res = await supabase
    .from('sponsorships')
    .select('user_id, ends_at')
    .eq('status', 'active')
    .eq('kind', 'featured');
  const ids = new Set<string>();
  for (const r of res.data ?? []) {
    if (!r.ends_at || r.ends_at > nowIso) ids.add(r.user_id);
  }
  return [...ids];
}

export async function setSponsorshipAmount(
  id: string,
  amountCents: number | null,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await canAccessAdmin())) return { ok: false, error: 'Admins only.' };
  const upd = await supabase
    .from('sponsorships')
    .update({ amount_cents: amountCents })
    .eq('id', id);
  if (upd.error) return { ok: false, error: upd.error.message };
  revalidatePath(`/admin/sponsorships/${id}`);
  return { ok: true };
}

export interface ActiveSponsorship {
  id: string;
  kind: SponsorshipKind;
  status: SponsorshipStatus;
  starts_at: string | null;
  ends_at: string | null;
  amount_cents: number | null;
  user: { id: string; name: string; company: string | null; photo_url: string | null };
}

export async function getActiveSponsorships(): Promise<ActiveSponsorship[]> {
  if (!(await canAccessAdmin())) return [];
  const res = await supabase
    .from('sponsorships')
    .select(
      'id, kind, status, starts_at, ends_at, amount_cents, user:user_id(id, name, company, photo_url)',
    )
    .eq('status', 'active')
    .order('starts_at', { ascending: false });
  return (res.data ?? []).map((r) => {
    const u = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      id: r.id,
      kind: r.kind,
      status: r.status,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      amount_cents: r.amount_cents,
      user: {
        id: u?.id ?? '',
        name: u?.name ?? 'Member',
        company: u?.company ?? null,
        photo_url: u?.photo_url ?? null,
      },
    };
  });
}

export interface SponsorReport {
  member: { id: string; name: string; company: string | null; photo_url: string | null };
  kind: SponsorshipKind;
  status: SponsorshipStatus;
  startsAt: string | null;
  endsAt: string | null;
  amountCents: number | null;
  listingViews: number;
  uniqueViewers: number;
  siteClicks: number;
  vcardSaves: number;
  foursReceived: number;
  linksMade: number;
  birdiesClosed: number;
  businessReceivedCents: number;
  clubClosedBusinessCents: number;
  clubConnections: number;
}

/**
 * Per-sponsor value report over the sponsorship window (start → now, or the
 * full window if expired): the member's listing traffic, the business they
 * received through the club, and club-wide context to frame the value.
 */
export async function getSponsorReport(
  sponsorshipId: string,
): Promise<SponsorReport | null> {
  if (!(await canAccessAdmin())) return null;

  const sp = await supabase
    .from('sponsorships')
    .select(
      'id, user_id, kind, status, starts_at, ends_at, amount_cents, requested_at, user:user_id(id, name, company, photo_url)',
    )
    .eq('id', sponsorshipId)
    .maybeSingle();
  if (!sp.data) return null;

  const u = Array.isArray(sp.data.user) ? sp.data.user[0] : sp.data.user;
  const uid = sp.data.user_id;
  const nowIso = new Date().toISOString();
  const startIso = sp.data.starts_at ?? sp.data.requested_at;
  const endIso = sp.data.ends_at && sp.data.ends_at < nowIso ? sp.data.ends_at : nowIso;
  const eitherParty = `from_user_id.eq.${uid},to_user_id.eq.${uid}`;

  const [viewsRes, clicksRes, interRes, clubBirdieRes, clubPairsRes] = await Promise.all([
    supabase
      .from('profile_views')
      .select('viewer_id')
      .eq('profile_id', uid)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('link_clicks')
      .select('target')
      .eq('profile_id', uid)
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('interactions')
      .select('kind, from_user_id, to_user_id, value_cents')
      .eq('status', 'accepted')
      .gte('responded_at', startIso)
      .lte('responded_at', endIso)
      .or(eitherParty),
    supabase
      .from('interactions')
      .select('value_cents')
      .eq('status', 'accepted')
      .eq('kind', 'birdie')
      .gte('responded_at', startIso)
      .lte('responded_at', endIso),
    supabase
      .from('interactions')
      .select('from_user_id, to_user_id')
      .eq('status', 'accepted')
      .gte('responded_at', startIso)
      .lte('responded_at', endIso),
  ]);

  const views = viewsRes.data ?? [];
  const clicks = clicksRes.data ?? [];
  let foursReceived = 0;
  let linksMade = 0;
  let birdiesClosed = 0;
  let businessReceivedCents = 0;
  for (const r of interRes.data ?? []) {
    if (r.kind === 'four' && r.to_user_id === uid) foursReceived += 1;
    else if (r.kind === 'link') linksMade += 1;
    else if (r.kind === 'birdie') {
      birdiesClosed += 1;
      businessReceivedCents += r.value_cents ?? 0;
    }
  }
  const clubClosedBusinessCents = (clubBirdieRes.data ?? []).reduce(
    (s, r) => s + (r.value_cents ?? 0),
    0,
  );
  const pairs = new Set<string>();
  for (const r of clubPairsRes.data ?? []) {
    const a = r.from_user_id;
    const b = r.to_user_id;
    pairs.add(a < b ? `${a}|${b}` : `${b}|${a}`);
  }

  return {
    member: {
      id: u?.id ?? uid,
      name: u?.name ?? 'Member',
      company: u?.company ?? null,
      photo_url: u?.photo_url ?? null,
    },
    kind: sp.data.kind,
    status: sp.data.status,
    startsAt: sp.data.starts_at,
    endsAt: sp.data.ends_at,
    amountCents: sp.data.amount_cents,
    listingViews: views.length,
    uniqueViewers: new Set(views.map((v) => v.viewer_id).filter(Boolean)).size,
    siteClicks: clicks.filter(
      (c) => c.target === 'website' || c.target === 'social' || c.target === 'link_hub',
    ).length,
    vcardSaves: clicks.filter((c) => c.target === 'vcard').length,
    foursReceived,
    linksMade,
    birdiesClosed,
    businessReceivedCents,
    clubClosedBusinessCents,
    clubConnections: pairs.size,
  };
}
