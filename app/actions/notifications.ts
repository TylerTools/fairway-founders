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

  // Hide expired notifications (broadcasts die after 24h).
  const notExpired = `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
  const [recentRes, unreadRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, kind, title, body, link, created_at, read_at')
      .eq('user_id', me.id)
      .or(notExpired)
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', me.id)
      .is('read_at', null)
      .or(notExpired),
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
  if (!me || me.app_role !== 'super_admin') {
    return { ok: false, error: 'Admins only.' };
  }

  const title = (formData.get('title') as string | null)?.trim().slice(0, 140);
  const body = (formData.get('body') as string | null)?.trim().slice(0, 2000) || null;
  const link = (formData.get('link') as string | null)?.trim().slice(0, 500) || null;
  const audience =
    (formData.get('audience') as string | null) === 'round' ? 'round' : 'all';
  const eventId = (formData.get('event_id') as string | null) || null;

  if (!title) return { ok: false, error: 'Title is required.' };

  // Resolve recipients. "round" = only the players currently in that round's
  // groups; "all" = every approved member.
  let recipientIds: string[] = [];
  if (audience === 'round') {
    if (!eventId) return { ok: false, error: 'No round selected to notify.' };
    const foursomesRes = await supabase
      .from('foursomes')
      .select('id')
      .eq('event_id', eventId);
    const fids = (foursomesRes.data ?? []).map((f) => f.id);
    if (fids.length > 0) {
      const fmRes = await supabase
        .from('foursome_members')
        .select('user_id')
        .in('foursome_id', fids);
      recipientIds = [...new Set((fmRes.data ?? []).map((m) => m.user_id))];
    }
    recipientIds = recipientIds.filter((id) => id !== me.id);
    if (recipientIds.length === 0) {
      return { ok: false, error: 'No players in this round yet — generate groups first.' };
    }
  } else {
    const audienceRes = await supabase
      .from('users')
      .select('id')
      .eq('access_status', 'approved')
      .neq('id', me.id);
    recipientIds = (audienceRes.data ?? []).map((u) => u.id);
    if (recipientIds.length === 0) {
      return { ok: false, error: 'No approved members to notify.' };
    }
  }

  // Broadcasts are transient — they disappear from the bell after 24 hours.
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const rows = recipientIds.map((id) => ({
    user_id: id,
    kind: 'broadcast' as const,
    title,
    body,
    link,
    created_by: me.id,
    expires_at: expiresAt,
  }));

  const ins = await supabase.from('notifications').insert(rows);
  if (ins.error) return { ok: false, error: ins.error.message };

  revalidatePath('/', 'layout');
  const scope = audience === 'round' ? 'players in this round' : 'members';
  return {
    ok: true,
    message: `Sent to ${recipientIds.length} ${scope} · disappears in 24h.`,
  };
}

