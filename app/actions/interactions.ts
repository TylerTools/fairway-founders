'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getCurrentLeagueId } from '@/lib/league-context';
import type { Database } from '@/lib/database.types';

export type InteractionKind = Database['public']['Enums']['interaction_kind'];

export interface MemberSearchResult {
  id: string;
  name: string;
  company: string | null;
  professional_role: string | null;
  photo_url: string | null;
}

export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  const me = await getAppUser();
  if (!me) return [];
  // Strip characters that would break the PostgREST .or() filter grammar.
  const safe = query.replace(/[,()%*]/g, ' ').trim();
  if (safe.length < 1) return [];
  const like = `%${safe}%`;
  const res = await supabase
    .from('users')
    .select('id, name, company, professional_role, photo_url')
    .eq('access_status', 'approved')
    .neq('id', me.id)
    .or(`name.ilike.${like},company.ilike.${like},professional_role.ilike.${like}`)
    .order('name', { ascending: true })
    .limit(10);
  return res.data ?? [];
}

const RECV_NOTIF: Record<
  InteractionKind,
  { kind: 'four_received' | 'link_request' | 'birdie_request'; verb: string }
> = {
  four: { kind: 'four_received', verb: 'threw you a Four' },
  link: { kind: 'link_request', verb: 'wants to log a Link (1:1) with you' },
  birdie: { kind: 'birdie_request', verb: 'wants to log a Birdie (closed business) with you' },
};

async function send(
  kind: InteractionKind,
  toUserId: string,
  note: string | null,
  valueCents: number | null,
): Promise<{ ok: boolean; error?: string }> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  if (toUserId === me.id) return { ok: false, error: "You can't log this with yourself." };

  const leagueId = await getCurrentLeagueId();
  const ins = await supabase.from('interactions').insert({
    kind,
    from_user_id: me.id,
    to_user_id: toUserId,
    status: 'pending',
    note: note?.slice(0, 500) || null,
    value_cents: kind === 'birdie' ? valueCents : null,
    league_id: leagueId,
  });
  if (ins.error) {
    // Partial-unique index on open pending requests.
    if (ins.error.code === '23505') {
      return { ok: false, error: 'You already have a pending request of this kind with them.' };
    }
    return { ok: false, error: ins.error.message };
  }

  // Best-effort notification to the recipient.
  try {
    const meta = RECV_NOTIF[kind];
    await supabase.from('notifications').insert({
      user_id: toUserId,
      kind: meta.kind,
      title: `${me.name} ${meta.verb}`,
      body: note?.slice(0, 200) || null,
      link: '/network',
      created_by: me.id,
    });
  } catch {
    // best-effort
  }

  revalidatePath('/network');
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function sendFour(toUserId: string, note?: string) {
  return send('four', toUserId, note ?? null, null);
}
export async function sendLink(toUserId: string, note?: string) {
  return send('link', toUserId, note ?? null, null);
}
export async function sendBirdie(toUserId: string, valueCents?: number, note?: string) {
  return send('birdie', toUserId, note ?? null, valueCents ?? null);
}

export interface PendingRequest {
  id: string;
  kind: InteractionKind;
  note: string | null;
  value_cents: number | null;
  created_at: string;
  from: { id: string; name: string; photo_url: string | null };
}

export async function getMyPendingRequests(): Promise<PendingRequest[]> {
  const me = await getAppUser();
  if (!me) return [];
  const res = await supabase
    .from('interactions')
    .select('id, kind, note, value_cents, created_at, from:from_user_id(id, name, photo_url)')
    .eq('to_user_id', me.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  return (res.data ?? []).map((r) => {
    const f = Array.isArray(r.from) ? r.from[0] : r.from;
    return {
      id: r.id,
      kind: r.kind,
      note: r.note,
      value_cents: r.value_cents,
      created_at: r.created_at,
      from: {
        id: f?.id ?? '',
        name: f?.name ?? 'A member',
        photo_url: f?.photo_url ?? null,
      },
    };
  });
}

export async function respondToInteraction(
  id: string,
  accept: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const row = await supabase
    .from('interactions')
    .select('id, kind, from_user_id, to_user_id, status')
    .eq('id', id)
    .maybeSingle();
  if (!row.data) return { ok: false, error: 'Request not found.' };
  if (row.data.to_user_id !== me.id) return { ok: false, error: 'Not yours to respond to.' };
  if (row.data.status !== 'pending') return { ok: false, error: 'Already responded.' };

  const upd = await supabase
    .from('interactions')
    .update({
      status: accept ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('to_user_id', me.id)
    .eq('status', 'pending');
  if (upd.error) return { ok: false, error: upd.error.message };

  // Best-effort: tell the initiator.
  try {
    const label =
      row.data.kind === 'four' ? 'Four' : row.data.kind === 'link' ? 'Link' : 'Birdie';
    await supabase.from('notifications').insert({
      user_id: row.data.from_user_id,
      kind: accept ? 'interaction_accepted' : 'interaction_declined',
      title: accept
        ? `${me.name} confirmed your ${label}`
        : `${me.name} declined your ${label}`,
      body: null,
      link: '/network',
      created_by: me.id,
    });
  } catch {
    // best-effort
  }

  revalidatePath('/network');
  revalidatePath('/', 'layout');
  revalidatePath('/roster');
  return { ok: true };
}
