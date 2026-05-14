'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import type { Database } from '@/lib/database.types';

type AppRole = Database['public']['Enums']['app_role'];

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');
  return me;
}

export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  const me = await requireAdmin();

  if (me.id === userId && role !== 'admin') {
    const adminCount = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('app_role', 'admin');
    if ((adminCount.count ?? 0) <= 1) {
      throw new Error("Can't demote the last admin.");
    }
  }

  await supabase.from('users').update({ app_role: role }).eq('id', userId);
  revalidatePath(`/roster/${userId}`);
  revalidatePath('/roster');
  revalidatePath('/admin');
}

export async function banUser(userId: string): Promise<void> {
  const me = await requireAdmin();
  if (me.id === userId) throw new Error("Can't ban yourself.");
  await supabase
    .from('users')
    .update({
      access_status: 'denied',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);
  revalidatePath(`/roster/${userId}`);
  revalidatePath('/roster');
  revalidatePath('/admin');
  revalidatePath('/admin/access');
}

export async function unbanUser(userId: string): Promise<void> {
  const me = await requireAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'approved',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);
  revalidatePath(`/roster/${userId}`);
  revalidatePath('/roster');
  revalidatePath('/admin');
  revalidatePath('/admin/access');
}

export async function deleteUser(userId: string): Promise<void> {
  const me = await requireAdmin();
  if (me.id === userId) throw new Error("Can't delete yourself.");

  // Wipe dependent rows first; round history mentioning this user is lost.
  await supabase.from('rsvps').delete().eq('user_id', userId);
  await supabase.from('foursome_members').delete().eq('user_id', userId);
  await supabase.from('users').delete().eq('id', userId);

  revalidatePath('/roster');
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  redirect('/roster');
}
