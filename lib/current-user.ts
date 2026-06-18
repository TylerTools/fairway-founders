import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { supabase } from './supabase';
import { notifyAdminsOfReferralJoin } from './notify';
import { queueEmail } from './email-queue';
import type { Database } from './database.types';

export type AppUser = Database['public']['Tables']['users']['Row'];

const INTENDED_LEAGUE_COOKIE = 'ff-intended-league';
const REFERRED_BY_COOKIE = 'ff-referred-by';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

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

  // Referral hook (runs FIRST so it can read the intended-league cookie before
  // maybePairIntendedLeague clears it): a brand-new user who arrived through a
  // member's invite link is attributed to that inviter and auto-approved into
  // the inviter's league — a referral is a trusted invite.
  await maybeApplyReferral(row, createdJustNow);

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

/**
 * Read the `ff-referred-by` cookie (stamped by /join/[slug]?ref=CODE). If it
 * resolves to an approved member and we just created this user, attribute the
 * referral and auto-approve the new member straight into a league:
 *   - stamp users.invited_by (the source of truth for referral credit),
 *   - flip access_status='approved' (a referral skips the approval queue),
 *   - give them an ACTIVE membership in the inviter's league (preferring the
 *     league slug embedded in the link, else the inviter's first active league),
 *   - notify admins + queue a welcome email.
 *
 * Only fires for brand-new users (createdJustNow) so credit can't be re-earned.
 * Best-effort — any error is swallowed; the user still has a working account.
 */
async function maybeApplyReferral(
  user: AppUser,
  createdJustNow: boolean,
): Promise<void> {
  if (!createdJustNow) return;
  try {
    const store = await cookies();
    const code = store.get(REFERRED_BY_COOKIE)?.value;
    if (!code) return;

    // Resolve code → inviter. Must be a real, approved member, and not self.
    const inviterRes = await supabase
      .from('users')
      .select('id, name, access_status')
      .eq('referral_code', code)
      .maybeSingle();
    const inviter = inviterRes.data;
    if (!inviter || inviter.id === user.id || inviter.access_status !== 'approved') {
      store.delete(REFERRED_BY_COOKIE);
      return;
    }

    // Attribute + auto-approve the new member.
    await supabase
      .from('users')
      .update({
        invited_by: inviter.id,
        access_status: 'approved',
        access_decided_at: new Date().toISOString(),
        access_decided_by: inviter.id,
      })
      .eq('id', user.id);

    // Which league do they land in? Prefer the slug from the referral link
    // (still in the cookie at this point), else the inviter's first active one.
    let leagueId: string | null = null;
    const intendedSlug = store.get(INTENDED_LEAGUE_COOKIE)?.value;
    if (intendedSlug) {
      const lr = await supabase
        .from('leagues')
        .select('id')
        .eq('slug', intendedSlug)
        .maybeSingle();
      leagueId = lr.data?.id ?? null;
    }
    if (!leagueId) {
      const inv = await supabase
        .from('league_memberships')
        .select('league_id')
        .eq('user_id', inviter.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      leagueId = inv.data?.league_id ?? null;
    }

    if (leagueId) {
      const existing = await supabase
        .from('league_memberships')
        .select('id, status')
        .eq('league_id', leagueId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing.data) {
        if (existing.data.status !== 'active') {
          await supabase
            .from('league_memberships')
            .update({ status: 'active' })
            .eq('id', existing.data.id);
        }
      } else {
        await supabase.from('league_memberships').insert({
          league_id: leagueId,
          user_id: user.id,
          role: 'member',
          status: 'active',
        });
      }
    }

    // Tell admins (these joins bypass the approval inbox) + welcome the member.
    await notifyAdminsOfReferralJoin({
      newUserId: user.id,
      newUserName: user.name,
      inviterName: inviter.name,
      leagueId,
    });

    const first = user.name.split(' ')[0] || 'there';
    const inviterFirst = inviter.name.split(' ')[0] || 'a member';
    await queueEmail({
      kind: 'access_approved',
      toEmail: user.email,
      toUserId: user.id,
      subject: 'You’re in — welcome to Fairway Founders',
      body: [
        `Hi ${first},`,
        '',
        `${inviterFirst} invited you to Fairway Founders, and you’re in. RSVP for the next round here:`,
        SITE_URL + '/dashboard',
        '',
        'See you on the course.',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: inviter.id,
    });

    store.delete(REFERRED_BY_COOKIE);
  } catch {
    // best-effort
  }
}
