'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getAppUser } from '@/lib/current-user';
import { pathFromPublicUrl } from '@/lib/storage-path';
import type { Database } from '@/lib/database.types';

type AppRole = Database['public']['Enums']['app_role'];

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'super_admin') throw new Error('Admins only.');
  return me;
}

export async function setUserRole(userId: string, role: AppRole): Promise<void> {
  const me = await requireAdmin();

  if (me.id === userId && role !== 'super_admin') {
    const adminCount = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('app_role', 'super_admin');
    if ((adminCount.count ?? 0) <= 1) {
      throw new Error("Can't demote the last super admin.");
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

  // Best-effort: remove this user's storage objects before the row is gone, so
  // we can still read their photo/logo URLs to derive the bucket paths. Never
  // block the delete on storage cleanup.
  try {
    const { data: target } = await supabase
      .from('users')
      .select('photo_url, logo_url')
      .eq('id', userId)
      .single();
    if (target) {
      const admin = getSupabaseAdmin();
      const photoPath = pathFromPublicUrl(target.photo_url, 'member-photos');
      const logoPath = pathFromPublicUrl(target.logo_url, 'member-logos');
      if (photoPath) await admin.storage.from('member-photos').remove([photoPath]);
      if (logoPath) await admin.storage.from('member-logos').remove([logoPath]);
    }
  } catch (e) {
    console.warn(`[admin-users] storage cleanup for ${userId} failed: ${(e as Error).message}`);
  }

  // Null out inbound self-references (NO ACTION FKs) so deleting the row can't
  // throw an FK violation when this user has decided/invited others.
  const clearedDecided = await supabase
    .from('users')
    .update({ access_decided_by: null })
    .eq('access_decided_by', userId);
  if (clearedDecided.error) {
    throw new Error(`Couldn't unlink access decisions: ${clearedDecided.error.message}`);
  }
  const clearedInvited = await supabase
    .from('users')
    .update({ invited_by: null })
    .eq('invited_by', userId);
  if (clearedInvited.error) {
    throw new Error(`Couldn't unlink invites: ${clearedInvited.error.message}`);
  }

  // Wipe dependent rows first; round history mentioning this user is lost.
  const rsvpsDel = await supabase.from('rsvps').delete().eq('user_id', userId);
  if (rsvpsDel.error) throw new Error(`Couldn't remove RSVPs: ${rsvpsDel.error.message}`);
  const fmDel = await supabase.from('foursome_members').delete().eq('user_id', userId);
  if (fmDel.error) throw new Error(`Couldn't remove group memberships: ${fmDel.error.message}`);
  const userDel = await supabase.from('users').delete().eq('id', userId);
  if (userDel.error) throw new Error(`Couldn't delete the member: ${userDel.error.message}`);

  revalidatePath('/roster');
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  redirect('/roster');
}
