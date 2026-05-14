'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import type { Database } from '@/lib/database.types';

type CourseConfig = Database['public']['Enums']['course_config'];

export interface EventFormState {
  ok: boolean;
  error?: string;
}

async function requireAdmin() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') throw new Error('Admins only.');
  return me;
}

function parseLocalDate(value: string): Date {
  // <input type="datetime-local"> emits a value like "2026-05-14T14:30" with NO timezone.
  // Treat it as ET (-04:00 in EDT, -05:00 in EST). For May–Nov we use -04:00.
  // We append the offset string explicitly so the resulting Date is correct in UTC.
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) throw new Error('Invalid date.');
  const [, y, mo, d, h, mi] = m;
  // EDT (UTC-4) covers most of the golf season; if you ever play outside this
  // window, edit the offset on the event row directly.
  const iso = `${y}-${mo}-${d}T${h}:${mi}:00-04:00`;
  return new Date(iso);
}

function defaultWindows(eventDate: Date): { opensAt: Date; closesAt: Date } {
  // RSVP opens 6 days before at noon, closes Tuesday before at 6 PM ET.
  const opensAt = new Date(eventDate);
  opensAt.setUTCDate(opensAt.getUTCDate() - 6);
  opensAt.setUTCHours(16, 0, 0, 0); // 12pm ET = 16:00 UTC EDT
  const closesAt = new Date(eventDate);
  closesAt.setUTCDate(closesAt.getUTCDate() - 2);
  closesAt.setUTCHours(22, 0, 0, 0); // 6pm ET = 22:00 UTC EDT
  return { opensAt, closesAt };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const dateRaw = formData.get('date') as string | null;
  const courseConfig = (formData.get('course_config') as CourseConfig) ?? 'front';
  const feeDollarsRaw = formData.get('fee_dollars') as string | null;
  const proShopEmail = (formData.get('pro_shop_email') as string | null) ?? null;

  if (!dateRaw) return { ok: false, error: 'Date is required.' };

  let date: Date;
  try {
    date = parseLocalDate(dateRaw);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const fee_cents = Math.max(0, Math.round(parseFloat(feeDollarsRaw ?? '0') * 100));
  const { opensAt, closesAt } = defaultWindows(date);

  const res = await supabase
    .from('events')
    .insert({
      date: date.toISOString(),
      opens_at: opensAt.toISOString(),
      closes_at: closesAt.toISOString(),
      course_config: courseConfig,
      fee_cents,
      pro_shop_email: proShopEmail || null,
      status: 'locked',
    })
    .select('id')
    .single();

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const courseConfig = (formData.get('course_config') as CourseConfig) ?? 'front';
  const feeDollarsRaw = formData.get('fee_dollars') as string | null;
  const proShopEmail = (formData.get('pro_shop_email') as string | null) ?? null;

  const fee_cents = Math.max(0, Math.round(parseFloat(feeDollarsRaw ?? '0') * 100));

  // If the date field is present, update it; otherwise keep existing.
  const updates: Database['public']['Tables']['events']['Update'] = {
    course_config: courseConfig,
    fee_cents,
    pro_shop_email: proShopEmail || null,
  };

  const dateRaw = formData.get('date') as string | null;
  if (dateRaw) {
    try {
      const date = parseLocalDate(dateRaw);
      const { opensAt, closesAt } = defaultWindows(date);
      updates.date = date.toISOString();
      updates.opens_at = opensAt.toISOString();
      updates.closes_at = closesAt.toISOString();
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  const res = await supabase.from('events').update(updates).eq('id', eventId);
  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/course');
  revalidatePath('/leaderboard');
  return { ok: true };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await requireAdmin();
  await supabase.from('events').delete().eq('id', eventId);
  revalidatePath('/');
  revalidatePath('/admin');
  redirect('/admin');
}
