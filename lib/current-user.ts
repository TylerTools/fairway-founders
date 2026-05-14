import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { supabase } from './supabase';
import type { Database } from './database.types';

export type AppUser = Database['public']['Tables']['users']['Row'];

/**
 * Resolve the signed-in Clerk user to the matching row in `users`.
 *
 * Match order:
 *   1. clerk_id (set on previous visit)
 *   2. primary email (binds a seeded founder to their Clerk account on first sign-in)
 *
 * When matched by email, we stamp clerk_id so subsequent lookups are O(1).
 * If no row exists, we create a member-level row from the Clerk profile.
 *
 * On every fetch we sync the auth-managed fields (name, email) from Clerk
 * into our row — Clerk is the source of truth for those.
 */
export async function getAppUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let row: AppUser | null = null;

  const byClerkId = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .maybeSingle();
  if (byClerkId.data) row = byClerkId.data;

  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return row;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const clerkName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    email ||
    'New member';

  if (!row && email) {
    const byEmail = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (byEmail.data) {
      const linked = await supabase
        .from('users')
        .update({ clerk_id: userId, name: clerkName })
        .eq('id', byEmail.data.id)
        .select('*')
        .single();
      if (linked.data) row = linked.data;
    }
  }

  if (!row) {
    const created = await supabase
      .from('users')
      .insert({
        clerk_id: userId,
        email: email ?? `${userId}@clerk.local`,
        name: clerkName,
        app_role: 'member',
        access_status: 'pending',
        access_requested_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    return created.data ?? null;
  }

  // Sync auth-managed fields from Clerk into our row when they drift.
  const updates: Partial<AppUser> = {};
  if (clerkName && row.name !== clerkName) updates.name = clerkName;
  if (email && row.email !== email) updates.email = email;
  if (Object.keys(updates).length > 0) {
    const refreshed = await supabase
      .from('users')
      .update(updates)
      .eq('id', row.id)
      .select('*')
      .single();
    if (refreshed.data) row = refreshed.data;
  }

  return row;
}
