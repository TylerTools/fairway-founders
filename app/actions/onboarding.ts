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

  const str = (k: string, max: number) =>
    ((formData.get(k) as string | null)?.trim().slice(0, max) || null) ?? null;

  const professional_role = str('professional_role', 120);
  const company = str('company', 120);

  if (!professional_role) return { ok: false, error: 'Role is required.' };
  if (!company) return { ok: false, error: 'Company is required.' };

  const name = str('name', 120);
  const bio = str('bio', 600);
  const goals = str('goals', 600);
  const industry = str('industry', 120);
  const city = str('city', 120);

  const handicapRaw = formData.get('handicap') as string | null;
  let handicap: number | null = null;
  if (handicapRaw && handicapRaw.trim() !== '') {
    const parsed = parseFloat(handicapRaw);
    if (Number.isNaN(parsed)) return { ok: false, error: 'Handicap must be a number.' };
    handicap = Math.max(0, Math.min(54, parsed));
  }

  // Chip fields arrive as repeated form entries; fall back to a comma string.
  const arr = (k: string) => {
    const many = formData.getAll(k).map((v) => String(v).trim());
    const base = many.length > 1 || (many[0] ?? '').includes(',')
      ? many.flatMap((v) => v.split(','))
      : many;
    return [...new Set(base.map((s) => s.trim()).filter(Boolean))].slice(0, 8);
  };
  const helps = arr('helps');
  const seeking = arr('seeking');

  const { error } = await supabase
    .from('users')
    .update({
      name: name ?? me.name,
      bio,
      company,
      professional_role,
      industry,
      city,
      goals,
      handicap,
      helps,
      seeking,
      onboarded_at: new Date().toISOString(),
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
