'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { requireCourseAdmin, requireEventAdmin } from '@/lib/auth';
import type { Json } from '@/lib/database.types';

export interface TeeActionState {
  ok: boolean;
  error?: string;
}

/** Create or update a course tee (name + per-hole base yardages). */
export async function upsertTee(input: {
  courseId: string;
  teeId?: string;
  name: string;
  sortOrder?: number;
  yardages: Record<number, number>;
}): Promise<TeeActionState> {
  try {
    await requireCourseAdmin(input.courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Tee needs a name.' };

  const payload = {
    course_id: input.courseId,
    name,
    sort_order: input.sortOrder ?? 0,
    yardages: input.yardages as unknown as Json,
    updated_at: new Date().toISOString(),
  };
  const res = input.teeId
    ? await supabase
        .from('course_tees')
        .update(payload)
        .eq('id', input.teeId)
        .select('id')
    : await supabase.from('course_tees').insert(payload).select('id');
  if (res.error) return { ok: false, error: res.error.message };
  revalidatePath('/admin/courses');
  revalidatePath('/admin/test');
  return { ok: true };
}

export async function deleteTee(
  courseId: string,
  teeId: string,
): Promise<TeeActionState> {
  try {
    await requireCourseAdmin(courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const { error } = await supabase.from('course_tees').delete().eq('id', teeId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/courses');
  revalidatePath('/admin/test');
  return { ok: true };
}

/**
 * Set a round's tee setup: the default tee everyone plays, any per-group
 * overrides, and per-tee yardage tweaks for the day's pin placements.
 */
export async function setRoundTees(input: {
  eventId: string;
  defaultTeeId: string | null;
  groupTees?: { foursomeId: string; teeId: string | null }[];
  roundYardages?: Record<string, Record<number, number>>;
}): Promise<TeeActionState> {
  try {
    await requireEventAdmin(input.eventId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const patch: { default_tee_id: string | null; round_yardages?: Json } = {
    default_tee_id: input.defaultTeeId,
  };
  if (input.roundYardages) {
    patch.round_yardages = input.roundYardages as unknown as Json;
  }
  const e1 = await supabase.from('events').update(patch).eq('id', input.eventId);
  if (e1.error) return { ok: false, error: e1.error.message };

  for (const g of input.groupTees ?? []) {
    const gu = await supabase
      .from('foursomes')
      .update({ tee_id: g.teeId })
      .eq('id', g.foursomeId);
    if (gu.error) return { ok: false, error: gu.error.message };
  }

  revalidatePath('/leaderboard');
  revalidatePath('/admin');
  return { ok: true };
}
