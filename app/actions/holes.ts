'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { requireCourseAdmin } from '@/lib/auth';

export interface HoleInput {
  hole: number;
  par: number;
  yards: number | null;
}

export interface SaveHolesState {
  ok: boolean;
  error?: string;
}

/**
 * Upsert per-hole par + yardage for a course. Hole data is course-level, so it's
 * reused by every round at that course. Used by the test-game setup and (later)
 * course settings.
 */
export async function saveCourseHoles(
  courseId: string,
  holes: HoleInput[],
): Promise<SaveHolesState> {
  if (!courseId) return { ok: false, error: 'No course selected.' };
  try {
    await requireCourseAdmin(courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const now = new Date().toISOString();
  const rows = holes
    .filter((h) => h.hole >= 1 && h.hole <= 18)
    .map((h) => ({
      course_id: courseId,
      hole: h.hole,
      par: Math.max(3, Math.min(6, Math.round(h.par || 4))),
      yards:
        h.yards == null || Number.isNaN(h.yards)
          ? null
          : Math.max(0, Math.round(h.yards)),
      updated_at: now,
    }));
  if (rows.length === 0) return { ok: true };

  const { error } = await supabase
    .from('course_holes')
    .upsert(rows, { onConflict: 'course_id,hole' });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/test');
  revalidatePath('/leaderboard');
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}
