'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import type { Database } from '@/lib/database.types';

type FeedbackKind = Database['public']['Enums']['feedback_kind'];
type FeedbackStatus = Database['public']['Enums']['feedback_status'];

export interface FeedbackFormState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function submitFeedback(
  _prev: FeedbackFormState,
  formData: FormData,
): Promise<FeedbackFormState> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Sign in to submit feedback.' };

  const kind = (formData.get('kind') as FeedbackKind | null) ?? 'feedback';
  const subjectRaw = formData.get('subject') as string | null;
  const bodyRaw = formData.get('body') as string | null;

  const body = bodyRaw?.trim() ?? '';
  if (!body) return { ok: false, error: 'Tell us a little something.' };
  if (body.length > 2000) {
    return { ok: false, error: 'Please keep it under 2000 characters.' };
  }

  const res = await supabase.from('feedback').insert({
    kind,
    body,
    subject: subjectRaw?.trim() ? subjectRaw.trim().slice(0, 200) : null,
    user_id: me.id,
  });
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/admin');
  revalidatePath('/admin/feedback');
  return {
    ok: true,
    message:
      kind === 'issue'
        ? 'Bug filed. We&rsquo;ll look at it.'
        : 'Thanks — feedback noted.',
  };
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
): Promise<void> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');

  await supabase.from('feedback').update({ status }).eq('id', id);
  revalidatePath('/admin');
  revalidatePath('/admin/feedback');
}
