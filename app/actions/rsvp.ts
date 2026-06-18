'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';

export async function toggleRsvp(eventId: string): Promise<void> {
  const me = await getAppUser();
  if (!me) throw new Error('Not signed in.');

  const existing = await supabase
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', me.id)
    .maybeSingle();

  if (existing.data) {
    await supabase.from('rsvps').delete().eq('id', existing.data.id);
  } else {
    await supabase.from('rsvps').insert({ event_id: eventId, user_id: me.id });
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

/**
 * Set (or clear, with null) the member's requested cart partner for an event.
 * Best-effort preference only — the foursome algorithm favors it but never
 * guarantees it. Requires an existing RSVP; the request lives on that row and
 * is dropped automatically when the member un-RSVPs.
 */
export async function setCartPartnerRequest(
  eventId: string,
  partnerUserId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };
  if (partnerUserId === me.id) {
    return { ok: false, error: "You can't request to ride with yourself." };
  }

  const existing = await supabase
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', me.id)
    .maybeSingle();
  if (!existing.data) {
    return { ok: false, error: 'RSVP first, then pick a cart partner.' };
  }

  const upd = await supabase
    .from('rsvps')
    .update({ requested_cart_partner_id: partnerUserId })
    .eq('id', existing.data.id);
  if (upd.error) return { ok: false, error: upd.error.message };

  revalidatePath('/');
  return { ok: true };
}

export async function adminToggleRsvp(eventId: string, userId: string): Promise<void> {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) throw new Error('Admins only.');

  const existing = await supabase
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.data) {
    await supabase.from('rsvps').delete().eq('id', existing.data.id);
  } else {
    await supabase.from('rsvps').insert({ event_id: eventId, user_id: userId });
  }

  revalidatePath('/admin');
  revalidatePath('/');
}
