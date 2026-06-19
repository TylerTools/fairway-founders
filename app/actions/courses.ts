'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import {
  isSuperAdmin,
  isLeagueAdmin,
  getMyLeagueMemberships,
} from '@/lib/auth';

async function requireLeagueAdmin(leagueId: string) {
  const me = await getAppUser();
  if (!me) throw new Error('Sign in required.');
  if (isSuperAdmin(me)) return me;
  const memberships = await getMyLeagueMemberships();
  if (!isLeagueAdmin(me, leagueId, memberships)) {
    throw new Error('League admins only.');
  }
  return me;
}

async function requireCourseAdmin(courseId: string) {
  const course = await supabase
    .from('courses')
    .select('id, league_id')
    .eq('id', courseId)
    .maybeSingle();
  if (!course.data) throw new Error('Course not found.');
  await requireLeagueAdmin(course.data.league_id);
  return course.data;
}

export interface CourseFormState {
  ok: boolean;
  error?: string;
  message?: string;
}

function textField(formData: FormData, key: string, max = 200): string | null {
  const raw = formData.get(key);
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

// ────────────────────────────────────────────────────────────────
// Courses
// ────────────────────────────────────────────────────────────────

export async function createCourse(
  leagueId: string,
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  try {
    await requireLeagueAdmin(leagueId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const name = textField(formData, 'name', 120);
  if (!name) return { ok: false, error: 'Course name is required.' };

  const res = await supabase
    .from('courses')
    .insert({
      league_id: leagueId,
      name,
      short_name: textField(formData, 'short_name', 60),
      address: textField(formData, 'address', 200),
      city: textField(formData, 'city', 80),
      state: textField(formData, 'state', 40),
      website_url: textField(formData, 'website_url', 300),
      default_pro_shop_email: textField(formData, 'default_pro_shop_email', 200),
      notes: textField(formData, 'notes', 1000),
      is_active: true,
    })
    .select('id')
    .single();

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/admin/courses');
  revalidatePath('/admin');
  return { ok: true };
}

export async function updateCourse(
  courseId: string,
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  try {
    await requireCourseAdmin(courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const name = textField(formData, 'name', 120);
  if (!name) return { ok: false, error: 'Course name is required.' };

  const res = await supabase
    .from('courses')
    .update({
      name,
      short_name: textField(formData, 'short_name', 60),
      address: textField(formData, 'address', 200),
      city: textField(formData, 'city', 80),
      state: textField(formData, 'state', 40),
      website_url: textField(formData, 'website_url', 300),
      default_pro_shop_email: textField(formData, 'default_pro_shop_email', 200),
      notes: textField(formData, 'notes', 1000),
    })
    .eq('id', courseId);

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

export async function deleteCourse(courseId: string): Promise<void> {
  await requireCourseAdmin(courseId);
  // course is referenced by events via on delete restrict; surface the
  // error if there are still events attached.
  const res = await supabase.from('courses').delete().eq('id', courseId);
  if (res.error) {
    throw new Error(
      'Cannot delete course while events are still scheduled at it.',
    );
  }
  revalidatePath('/admin/courses');
  revalidatePath('/admin');
  redirect('/admin/courses');
}

// ────────────────────────────────────────────────────────────────
// Course contacts
// ────────────────────────────────────────────────────────────────

export async function addCourseContact(
  courseId: string,
  _prev: CourseFormState,
  formData: FormData,
): Promise<CourseFormState> {
  try {
    await requireCourseAdmin(courseId);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const name = textField(formData, 'name', 120);
  if (!name) return { ok: false, error: 'Contact name is required.' };

  const isPrimary = formData.get('is_primary') === 'on';
  const linkedUserId = textField(formData, 'user_id', 64);

  if (isPrimary) {
    // Demote any current primary so the partial unique index doesn't reject.
    await supabase
      .from('course_contacts')
      .update({ is_primary: false })
      .eq('course_id', courseId)
      .eq('is_primary', true);
  }

  const res = await supabase.from('course_contacts').insert({
    course_id: courseId,
    name,
    role: textField(formData, 'role', 80),
    email: textField(formData, 'email', 200),
    phone: textField(formData, 'phone', 40),
    user_id: linkedUserId,
    is_primary: isPrimary,
    notes: textField(formData, 'notes', 600),
  });

  if (res.error) return { ok: false, error: res.error.message };

  revalidatePath(`/admin/courses/${courseId}`);
  return { ok: true };
}

export async function deleteCourseContact(
  contactId: string,
  courseId: string,
): Promise<void> {
  await requireCourseAdmin(courseId);
  // Scope the delete to the authorized course so a contactId from another
  // course can't be removed through this course's admin.
  await supabase
    .from('course_contacts')
    .delete()
    .eq('id', contactId)
    .eq('course_id', courseId);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function setPrimaryContact(
  contactId: string,
  courseId: string,
): Promise<void> {
  await requireCourseAdmin(courseId);
  const demote = await supabase
    .from('course_contacts')
    .update({ is_primary: false })
    .eq('course_id', courseId);
  if (demote.error) throw new Error(demote.error.message);
  // Scope to this course and surface failures so we never end up with no
  // primary contact after demoting the previous one.
  const promote = await supabase
    .from('course_contacts')
    .update({ is_primary: true })
    .eq('id', contactId)
    .eq('course_id', courseId);
  if (promote.error) throw new Error(promote.error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}
