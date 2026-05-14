'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import type { Database } from '@/lib/database.types';

type NotificationKind = Database['public']['Enums']['notification_kind'];

export interface MyNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationsSnapshot {
  recent: MyNotification[];
  unreadCount: number;
}

const RECENT_LIMIT = 20;

export async function getMyNotifications(): Promise<NotificationsSnapshot> {
  const me = await getAppUser();
  if (!me) return { recent: [], unreadCount: 0 };

  const [recentRes, unreadRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, kind, title, body, link, created_at, read_at')
      .eq('user_id', me.id)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', me.id)
      .is('read_at', null),
  ]);

  return {
    recent: recentRes.data ?? [],
    unreadCount: unreadRes.count ?? 0,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  const me = await getAppUser();
  if (!me) return;
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', me.id)
    .is('read_at', null);
  revalidatePath('/', 'layout');
}

export async function markAllNotificationsRead(): Promise<void> {
  const me = await getAppUser();
  if (!me) return;
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', me.id)
    .is('read_at', null);
  revalidatePath('/', 'layout');
}

export interface BroadcastState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function sendBroadcast(
  _prev: BroadcastState,
  formData: FormData,
): Promise<BroadcastState> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') {
    return { ok: false, error: 'Admins only.' };
  }

  const title = (formData.get('title') as string | null)?.trim().slice(0, 140);
  const body = (formData.get('body') as string | null)?.trim().slice(0, 2000) || null;
  const link = (formData.get('link') as string | null)?.trim().slice(0, 500) || null;

  if (!title) return { ok: false, error: 'Title is required.' };

  const audienceRes = await supabase
    .from('users')
    .select('id')
    .eq('access_status', 'approved');
  const recipients = audienceRes.data ?? [];
  if (recipients.length === 0) {
    return { ok: false, error: 'No approved members to notify.' };
  }

  const rows = recipients.map((u) => ({
    user_id: u.id,
    kind: 'broadcast' as const,
    title,
    body,
    link,
    created_by: me.id,
  }));

  const ins = await supabase.from('notifications').insert(rows);
  if (ins.error) return { ok: false, error: ins.error.message };

  revalidatePath('/', 'layout');
  return { ok: true, message: `Sent to ${recipients.length} members.` };
}

