import { cookies } from 'next/headers';
import type { Database } from './database.types';

export type ViewMode = 'admin' | 'member';
export type AppRole = Database['public']['Enums']['app_role'];

const COOKIE_NAME = 'ff-view';

/**
 * The role-driven view to render for. Admins can toggle to 'member' to
 * preview the member experience; everyone else falls back to their actual role.
 */
export async function getViewMode(actualRole: AppRole | null): Promise<AppRole | null> {
  if (!actualRole) return null;
  if (actualRole !== 'admin') return actualRole;

  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (cookie === 'member') return 'member';
  return 'admin';
}

export { COOKIE_NAME as VIEW_COOKIE_NAME };
