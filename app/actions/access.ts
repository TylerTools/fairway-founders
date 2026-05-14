'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');
  return me;
}

export async function approveAccess(userId: string): Promise<void> {
  const me = await requireAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'approved',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}

export async function denyAccess(userId: string): Promise<void> {
  const me = await requireAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'denied',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}

export async function reopenAccess(userId: string): Promise<void> {
  await requireAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'pending',
      access_decided_at: null,
      access_decided_by: null,
    })
    .eq('id', userId);
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}
