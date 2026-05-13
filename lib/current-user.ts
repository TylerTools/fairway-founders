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
 */
export async function getAppUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const byClerkId = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .maybeSingle();
  if (byClerkId.data) return byClerkId.data;

  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress;
  if (email) {
    const byEmail = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (byEmail.data) {
      const linked = await supabase
        .from('users')
        .update({ clerk_id: userId })
        .eq('id', byEmail.data.id)
        .select('*')
        .single();
      if (linked.data) return linked.data;
    }
  }

  const fallbackName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    email ||
    'New member';

  const created = await supabase
    .from('users')
    .insert({
      clerk_id: userId,
      email: email ?? `${userId}@clerk.local`,
      name: fallbackName,
      app_role: 'member',
    })
    .select('*')
    .single();

  return created.data ?? null;
}
