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
