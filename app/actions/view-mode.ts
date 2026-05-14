'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAppUser } from '@/lib/current-user';
import { VIEW_COOKIE_NAME, type ViewMode } from '@/lib/view-mode';

export async function setViewMode(mode: ViewMode): Promise<void> {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') return;
  const store = await cookies();
  store.set(VIEW_COOKIE_NAME, mode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
  });
  // Layout reads the cookie, so every cached page needs to re-render.
  revalidatePath('/', 'layout');
}
