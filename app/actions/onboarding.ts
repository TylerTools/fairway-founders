'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { notifyAdminsOfAccessRequest } from '@/lib/notify';

export interface OnboardingState {
  ok: boolean;
  error?: string;
}

export async function submitOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const professional_role = (formData.get('professional_role') as string | null)
    ?.trim()
    .slice(0, 120);
  const company = (formData.get('company') as string | null)?.trim().slice(0, 120);

  if (!professional_role) return { ok: false, error: 'Role is required.' };
  if (!company) return { ok: false, error: 'Company is required.' };

  const bio = (formData.get('bio') as string | null)?.slice(0, 600) ?? null;
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
    .update({
      bio,
      company,
      professional_role,
      handicap,
      helps,
      access_requested_at: new Date().toISOString(),
    })
    .eq('id', me.id);

  if (error) return { ok: false, error: error.message };

  // Notify admins now that the request has a fleshed-out profile to judge.
  await notifyAdminsOfAccessRequest({
    newUserId: me.id,
    newUserName: me.name,
  });

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin/access');
  return { ok: true };
}
