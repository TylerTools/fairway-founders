'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import {
  isSuperAdmin,
  isLeagueAdmin,
  getMyLeagueMemberships,
} from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type LeagueMemberRole = Database['public']['Enums']['league_member_role'];

async function requireSuperAdmin() {
  const me = await getAppUser();
  if (!me || !isSuperAdmin(me)) throw new Error('Super admins only.');
  return me;
}

async function requireLeagueAdmin(leagueId: string) {
  const me = await getAppUser();
  if (!me) throw new Error('Sign in required.');
  if (isSuperAdmin(me)) return me;
  const memberships = await getMyLeagueMemberships();
  if (!isLeagueAdmin(me, leagueId, memberships)) {
    throw new Error('League admins only.');
  }
  return me;
}

export interface LeagueFormState {
  ok: boolean;
  error?: string;
}

function textField(formData: FormData, key: string, max = 200): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ────────────────────────────────────────────────────────────────
// Leagues
// ────────────────────────────────────────────────────────────────

export async function createLeague(
  _prev: LeagueFormState,
  formData: FormData,
): Promise<LeagueFormState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const name = textField(formData, 'name', 120);
  if (!name) return { ok: false, error: 'League name is required.' };

  let slug = textField(formData, 'slug', 80);
  if (!slug) slug = slugify(name);

  const res = await supabase
    .from('leagues')
    .insert({
      name,
      slug,
      short_name: textField(formData, 'short_name', 60),
      description: textField(formData, 'description', 1000),
    })
    .select('id')
    .single();

  if (res.error) {
    if (res.error.code === '23505') {
      return { ok: false, error: 'That slug is already taken.' };
    }
    return { ok: false, error: res.error.message };
  }

  revalidatePath('/gln');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateLeague(
  leagueId: string,
  _prev: LeagueFormState,
  formData: FormData,
): Promise<LeagueFormState> {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const name = textField(formData, 'name', 120);
  if (!name) return { ok: false, error: 'League name is required.' };

  const res = await supabase
    .from('leagues')
    .update({
      name,
      slug: textField(formData, 'slug', 80) ?? slugify(name),
      short_name: textField(formData, 'short_name', 60),
      description: textField(formData, 'description', 1000),
    })
    .eq('id', leagueId);

  if (res.error) {
    if (res.error.code === '23505') {
      return { ok: false, error: 'That slug is already taken.' };
    }
    return { ok: false, error: res.error.message };
  }

  revalidatePath('/gln');
  revalidatePath(`/gln/leagues/${leagueId}`);
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function deleteLeague(leagueId: string): Promise<void> {
  await requireSuperAdmin();
  // Courses are FK with on delete restrict; surface error if attached.
  const res = await supabase.from('leagues').delete().eq('id', leagueId);
  if (res.error) {
    throw new Error(
      'Cannot delete a league while courses still belong to it. Move or delete the courses first.',
    );
  }
  revalidatePath('/gln');
  revalidatePath('/admin');
  redirect('/gln');
}

// ────────────────────────────────────────────────────────────────
// League memberships
// ────────────────────────────────────────────────────────────────

export async function addLeagueMember(
  leagueId: string,
  userId: string,
  role: LeagueMemberRole = 'member',
): Promise<void> {
  await requireLeagueAdmin(leagueId);
  // An admin-added member is active immediately — without this the row would
  // take the column default (and could silently un-approve an existing member).
  await supabase
    .from('league_memberships')
    .upsert(
      { league_id: leagueId, user_id: userId, role, status: 'active' },
      { onConflict: 'league_id,user_id' },
    );
  revalidatePath(`/gln/leagues/${leagueId}`);
}

export async function removeLeagueMember(
  leagueId: string,
  userId: string,
): Promise<void> {
  const me = await requireLeagueAdmin(leagueId);
  if (me.id === userId && !isSuperAdmin(me)) {
    throw new Error("Can't remove yourself from a league you admin.");
  }
  await supabase
    .from('league_memberships')
    .delete()
    .eq('league_id', leagueId)
    .eq('user_id', userId);
  revalidatePath(`/gln/leagues/${leagueId}`);
}

export async function setLeagueMemberRole(
  leagueId: string,
  userId: string,
  role: LeagueMemberRole,
): Promise<void> {
  const me = await requireLeagueAdmin(leagueId);
  if (me.id === userId && role !== 'admin' && !isSuperAdmin(me)) {
    // Make sure they don't demote themselves as the only league admin.
    const adminCount = await supabase
      .from('league_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('league_id', leagueId)
      .eq('role', 'admin')
      .eq('status', 'active');
    if ((adminCount.count ?? 0) <= 1) {
      throw new Error("Can't demote the last league admin.");
    }
  }
  await supabase
    .from('league_memberships')
    .update({ role })
    .eq('league_id', leagueId)
    .eq('user_id', userId);
  revalidatePath(`/gln/leagues/${leagueId}`);
}
