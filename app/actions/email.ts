'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { getCurrentLeagueId } from '@/lib/league-context';
import type { Database } from '@/lib/database.types';

type Audience = Database['public']['Enums']['email_audience'];

export interface BlastFormState {
  ok: boolean;
  error?: string;
  message?: string;
  queued?: number;
}

interface Recipient {
  user_id: string;
  email: string;
}

/** Members active in a given league (null leagueId returns ALL approved
 *  users across every league — used by GLN-wide blasts). */
async function leagueAudience(leagueId: string | null): Promise<Recipient[]> {
  if (!leagueId) {
    const res = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'approved');
    return (res.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
  }
  const memRes = await supabase
    .from('league_memberships')
    .select('user:user_id(id, email, access_status)')
    .eq('league_id', leagueId)
    .eq('status', 'active');
  const out: Recipient[] = [];
  for (const row of memRes.data ?? []) {
    const u = Array.isArray(row.user) ? row.user[0] : row.user;
    if (!u || u.access_status !== 'approved') continue;
    out.push({ user_id: u.id, email: u.email });
  }
  return out;
}

/** Resolve an audience selector into a concrete list of recipients.
 *  When leagueId is provided, every preset scopes to that league's active
 *  members; null = cross-league (GLN admins call this way from /gln). */
async function resolveAudience(
  audience: Audience,
  leagueId: string | null,
): Promise<Recipient[]> {
  if (audience === 'one') return [];

  if (audience === 'all_approved') {
    return leagueAudience(leagueId);
  }

  if (audience === 'all_admins') {
    if (leagueId) {
      // League-scoped: just this league's active admins.
      const res = await supabase
        .from('league_memberships')
        .select('user:user_id(id, email, access_status)')
        .eq('league_id', leagueId)
        .eq('status', 'active')
        .eq('role', 'admin');
      const dedup = new Map<string, Recipient>();
      for (const row of res.data ?? []) {
        const u = Array.isArray(row.user) ? row.user[0] : row.user;
        if (!u || u.access_status !== 'approved') continue;
        dedup.set(u.id, { user_id: u.id, email: u.email });
      }
      return [...dedup.values()];
    }
    // GLN-wide: super_admins + every league admin.
    const supers = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'approved')
      .eq('app_role', 'super_admin');
    const leagueAdmins = await supabase
      .from('league_memberships')
      .select('user:user_id(id, email)')
      .eq('role', 'admin')
      .eq('status', 'active');
    const dedup = new Map<string, Recipient>();
    for (const u of supers.data ?? []) {
      dedup.set(u.id, { user_id: u.id, email: u.email });
    }
    for (const row of leagueAdmins.data ?? []) {
      const u = Array.isArray(row.user) ? row.user[0] : row.user;
      if (u) dedup.set(u.id, { user_id: u.id, email: u.email });
    }
    return [...dedup.values()];
  }

  if (audience === 'pending_applicants') {
    if (leagueId) {
      // Pending memberships for this specific league.
      const res = await supabase
        .from('league_memberships')
        .select('user:user_id(id, email)')
        .eq('league_id', leagueId)
        .eq('status', 'pending');
      const out: Recipient[] = [];
      for (const row of res.data ?? []) {
        const u = Array.isArray(row.user) ? row.user[0] : row.user;
        if (u) out.push({ user_id: u.id, email: u.email });
      }
      return out;
    }
    const res = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'pending');
    return (res.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
  }

  if (audience === 'this_week_rsvps' || audience === 'this_week_no_rsvps') {
    // Pick the soonest non-past event in the current league (or globally if
    // leagueId is null).
    const now = new Date().toISOString();
    let evtQ = supabase
      .from('events')
      .select('id, course:course_id(league_id)')
      .gte('date', now)
      .order('date', { ascending: true });
    const evtRows = (await evtQ).data ?? [];
    let evtId: string | null = null;
    if (leagueId) {
      for (const row of evtRows) {
        const c = Array.isArray(row.course) ? row.course[0] : row.course;
        if (c?.league_id === leagueId) {
          evtId = row.id;
          break;
        }
      }
    } else {
      evtId = evtRows[0]?.id ?? null;
    }
    if (!evtId) return [];

    const rsvps = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', evtId);
    const rsvpIds = new Set((rsvps.data ?? []).map((r) => r.user_id));

    if (audience === 'this_week_rsvps') {
      if (rsvpIds.size === 0) return [];
      const users = await supabase
        .from('users')
        .select('id, email')
        .in('id', [...rsvpIds]);
      return (users.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
    }

    // this_week_no_rsvps = approved league members who haven't RSVPed
    const pool = await leagueAudience(leagueId);
    return pool.filter((u) => !rsvpIds.has(u.user_id));
  }

  return [];
}

const AUDIENCE_LABELS: Record<Audience, string> = {
  one: 'Single recipient',
  all_approved: 'All approved members',
  this_week_rsvps: 'This week — RSVPed',
  this_week_no_rsvps: 'This week — not yet RSVPed',
  pending_applicants: 'Pending applicants',
  all_admins: 'All admins',
};

export async function previewAudience(audience: Audience): Promise<number> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) return 0;
  // Scope to current league for league admins. GLN admins use the cockpit
  // and also see their current league here — to reach all leagues from /gln,
  // they switch league context first.
  const leagueId = await getCurrentLeagueId();
  const recipients = await resolveAudience(audience, leagueId);
  return recipients.length;
}

export async function queueAdminBlast(
  _prev: BlastFormState,
  formData: FormData,
): Promise<BlastFormState> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) {
    return { ok: false, error: 'Admins only.' };
  }

  const audience = (formData.get('audience') as Audience | null) ?? 'all_approved';
  const subject = ((formData.get('subject') as string | null) ?? '').trim().slice(0, 200);
  const body = ((formData.get('body') as string | null) ?? '').trim().slice(0, 8000);

  if (!subject) return { ok: false, error: 'Subject is required.' };
  if (!body) return { ok: false, error: 'Body is required.' };

  const leagueId = await getCurrentLeagueId();
  const recipients = await resolveAudience(audience, leagueId);
  if (recipients.length === 0) {
    return {
      ok: false,
      error: `${AUDIENCE_LABELS[audience]} has no recipients right now.`,
    };
  }

  const blastId = randomUUID();
  const rows = recipients.map((r) => ({
    kind: 'admin_blast' as const,
    status: 'queued' as const,
    audience,
    to_email: r.email,
    to_user_id: r.user_id,
    subject,
    body,
    sent_by: me.id,
    blast_id: blastId,
  }));

  const res = await supabase.from('email_log').insert(rows);
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/admin');
  revalidatePath('/admin/email');
  return {
    ok: true,
    queued: recipients.length,
    message: `Queued ${recipients.length} message${recipients.length === 1 ? '' : 's'} to ${AUDIENCE_LABELS[audience]}. Resend will send when the API key is configured.`,
  };
}

export { AUDIENCE_LABELS };

export async function queueProShopEmail({
  to,
  subject,
  body,
  eventId,
}: {
  to: string;
  subject: string;
  body: string;
  eventId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) {
    return { ok: false, error: 'Admins only.' };
  }
  if (!to.trim()) return { ok: false, error: 'No recipient.' };

  const res = await supabase.from('email_log').insert({
    kind: 'pro_shop_confirmation',
    status: 'queued',
    audience: 'one',
    to_email: to,
    subject,
    body,
    event_id: eventId,
    sent_by: me.id,
  });
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/admin/email');
  return { ok: true };
}
