'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
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

/** Resolve an audience selector into a concrete list of recipients. */
async function resolveAudience(audience: Audience): Promise<Recipient[]> {
  if (audience === 'one') return [];

  if (audience === 'all_approved') {
    const res = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'approved');
    return (res.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
  }

  if (audience === 'all_admins') {
    const res = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'approved')
      .eq('app_role', 'admin');
    return (res.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
  }

  if (audience === 'pending_applicants') {
    const res = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'pending');
    return (res.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
  }

  if (audience === 'this_week_rsvps' || audience === 'this_week_no_rsvps') {
    // Pick the soonest non-past event.
    const now = new Date().toISOString();
    const evt = await supabase
      .from('events')
      .select('id')
      .gte('date', now)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!evt.data) return [];

    const rsvps = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', evt.data.id);
    const rsvpIds = new Set((rsvps.data ?? []).map((r) => r.user_id));

    if (audience === 'this_week_rsvps') {
      if (rsvpIds.size === 0) return [];
      const users = await supabase
        .from('users')
        .select('id, email')
        .in('id', [...rsvpIds]);
      return (users.data ?? []).map((u) => ({ user_id: u.id, email: u.email }));
    }

    // this_week_no_rsvps = approved members who haven't RSVPed
    const approved = await supabase
      .from('users')
      .select('id, email')
      .eq('access_status', 'approved');
    return (approved.data ?? [])
      .filter((u) => !rsvpIds.has(u.id))
      .map((u) => ({ user_id: u.id, email: u.email }));
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
  if (!me || me.app_role !== 'admin') return 0;
  const recipients = await resolveAudience(audience);
  return recipients.length;
}

export async function queueAdminBlast(
  _prev: BlastFormState,
  formData: FormData,
): Promise<BlastFormState> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') {
    return { ok: false, error: 'Admins only.' };
  }

  const audience = (formData.get('audience') as Audience | null) ?? 'all_approved';
  const subject = ((formData.get('subject') as string | null) ?? '').trim().slice(0, 200);
  const body = ((formData.get('body') as string | null) ?? '').trim().slice(0, 8000);

  if (!subject) return { ok: false, error: 'Subject is required.' };
  if (!body) return { ok: false, error: 'Body is required.' };

  const recipients = await resolveAudience(audience);
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
