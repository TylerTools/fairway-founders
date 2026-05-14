'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser, type AppUser } from '@/lib/current-user';

export interface ProfileFormState {
  ok: boolean;
  error?: string;
}

export interface AppProfileSnapshot {
  bio: string | null;
  company: string | null;
  professional_role: string | null;
  handicap: number | null;
  helps: string[];
}

export async function getMyAppProfile(): Promise<AppProfileSnapshot | null> {
  const me: AppUser | null = await getAppUser();
  if (!me) return null;
  return {
    bio: me.bio,
    company: me.company,
    professional_role: me.professional_role,
    handicap: me.handicap != null ? Number(me.handicap) : null,
    helps: me.helps ?? [],
  };
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const bio = (formData.get('bio') as string | null)?.slice(0, 600) ?? null;
  const company = (formData.get('company') as string | null)?.slice(0, 120) ?? null;
  const professional_role =
    (formData.get('professional_role') as string | null)?.slice(0, 120) ?? null;
  const handicapRaw = formData.get('handicap') as string | null;
  const helpsRaw = (formData.get('helps') as string | null) ?? '';

  let handicap: number | null = null;
  if (handicapRaw && handicapRaw.trim() !== '') {
    const parsed = parseFloat(handicapRaw);
    if (Number.isNaN(parsed)) return { ok: false, error: 'Handicap must be a number.' };
    handicap = Math.max(0, Math.min(54, parsed));
  }

  const helps = helpsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const { error } = await supabase
    .from('users')
    .update({ bio, company, professional_role, handicap, helps })
    .eq('id', me.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath('/profile');
  revalidatePath('/roster');
  return { ok: true };
}
