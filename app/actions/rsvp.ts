'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';

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

export async function adminToggleRsvp(eventId: string, userId: string): Promise<void> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');

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
