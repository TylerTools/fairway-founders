import { cookies } from 'next/headers';
import type { Database } from './database.types';

export type ViewMode = 'admin' | 'member';
export type AppRole = Database['public']['Enums']['app_role'];

const COOKIE_NAME = 'ff-view';

/**
 * The UI view a user is currently inhabiting. Only super_admins can toggle
 * to 'member' to preview the member experience; everyone else is always
 * in 'member' view.
 */
export async function getViewMode(actualRole: AppRole | null): Promise<ViewMode> {
  if (actualRole !== 'super_admin') return 'member';

  const store = await cookies();
  const cookie = store.get(COOKIE_NAME)?.value;
  if (cookie === 'member') return 'member';
  return 'admin';
}

export { COOKIE_NAME as VIEW_COOKIE_NAME };
