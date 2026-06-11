import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { supabase } from './supabase';
import type { Database } from './database.types';

export type AppUser = Database['public']['Tables']['users']['Row'];

const INTENDED_LEAGUE_COOKIE = 'ff-intended-league';

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
 * On every fetch we sync the auth-managed fields (email) from Clerk into our
 * row — Clerk is the source of truth for that.
 *
 * Onboarding hook: when we CREATE a brand-new users row, we also read the
 * `ff-intended-league` cookie (stamped by /join/[slug]) and insert a pending
 * `league_memberships` row for that league. Same hook also fires for an
 * existing Clerk user who newly signs in via /join/[slug] but doesn't yet
 * have a membership for that league.
 */
export async function getAppUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  let row: AppUser | null = null;
  let createdJustNow = false;

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
        last_active_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    row = created.data ?? null;
    createdJustNow = !!row;
  }

  if (!row) return null;

  // Onboarding hook: pair this user with the league they came in through.
  // Fires when (a) we just created the row, OR (b) they signed in fresh on
  // a /join/[slug] page and don't yet have a membership for that league.
  await maybePairIntendedLeague(row.id, createdJustNow);

  // Sync auth-managed fields from Clerk into our row when they drift.
  const updates: Partial<AppUser> = {};
  // Name is owned by the member's app profile (/me) — don't pull it from Clerk
  // on each load or it would clobber edits. Email stays Clerk-owned (the login).
  if (email && row.email !== email) updates.email = email;
  // Throttled activity stamp (for active-member / growth metrics).
  const lastActiveMs = row.last_active_at ? new Date(row.last_active_at).getTime() : 0;
  if (Date.now() - lastActiveMs > 15 * 60 * 1000) {
    updates.last_active_at = new Date().toISOString();
  }
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

/**
 * Read the `ff-intended-league` cookie. If it points at a real league and the
 * user doesn't yet have a membership for it, insert a pending row. Clear the
 * cookie so we don't re-fire on future loads.
 *
 * Best-effort — any DB error is swallowed because the user can still request
 * a league from /me later.
 */
async function maybePairIntendedLeague(
  userId: string,
  createdJustNow: boolean,
): Promise<void> {
  try {
    const store = await cookies();
    const slug = store.get(INTENDED_LEAGUE_COOKIE)?.value;
    if (!slug) return;

    // Resolve slug → league.id
    const leagueRes = await supabase
      .from('leagues')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    const leagueId = leagueRes.data?.id;
    if (!leagueId) {
      // Cookie points at a stale slug; clear it.
      store.delete(INTENDED_LEAGUE_COOKIE);
      return;
    }

    // Existing membership? If active, nothing to do. If pending/declined,
    // leave alone — the league admin decides. Only insert when there is
    // truly no membership row yet.
    const existing = await supabase
      .from('league_memberships')
      .select('id, status')
      .eq('league_id', leagueId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!existing.data) {
      await supabase.from('league_memberships').insert({
        league_id: leagueId,
        user_id: userId,
        role: 'member',
        status: 'pending',
      });
    } else if (createdJustNow) {
      // Shouldn't happen — we just created the user — but harmless.
    }

    store.delete(INTENDED_LEAGUE_COOKIE);
  } catch {
    // best-effort
  }
}
