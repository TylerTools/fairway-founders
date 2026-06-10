'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { canAccessAdmin } from '@/lib/auth';
import { queueEmail } from '@/lib/email-queue';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || !(await canAccessAdmin())) throw new Error('Admins only.');
  return me;
}

async function fetchTarget(userId: string): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  const res = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();
  return res.data ?? null;
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

  const target = await fetchTarget(userId);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_approved',
      toEmail: target.email,
      toUserId: target.id,
      subject: 'You’re in — welcome to Fairway Founders',
      body: [
        `Hi ${first},`,
        '',
        'Your request to join Fairway Founders is approved. RSVP for the next round here:',
        SITE_URL + '/dashboard',
        '',
        'See you on the course.',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }

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

  const target = await fetchTarget(userId);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_denied',
      toEmail: target.email,
      toUserId: target.id,
      subject: 'About your Fairway Founders request',
      body: [
        `Hi ${first},`,
        '',
        'Thanks for your interest in Fairway Founders. We aren’t able to add you to the network at this time.',
        '',
        'If you think this is a mistake, reach out and we’ll take another look.',
        '',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }

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
