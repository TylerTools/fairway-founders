'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import {
  isSuperAdmin,
  canManageLeague,
  getMyLeagueMemberships,
} from '@/lib/auth';
import { queueEmail } from '@/lib/email-queue';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

// The legacy actions below flip the PLATFORM-wide users.access_status, so they
// are GLN-admin only — a single league's admin must not toggle a member's
// global access. Per-league approval lives in approve/declineMembership.
async function requireGlnAdmin() {
  const me = await getAppUser();
  if (!me || !isSuperAdmin(me)) throw new Error('GLN admins only.');
  return me;
}

async function fetchTarget(userId: string): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  const res = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();
  return res.data ?? null;
}

// ────────────────────────────────────────────────────────────────
// Per-league membership approval (new GLN/per-league access flow)
// ────────────────────────────────────────────────────────────────

interface MembershipDecision {
  ok: boolean;
  error?: string;
}

async function fetchMembership(id: string) {
  const res = await supabase
    .from('league_memberships')
    .select('id, league_id, user_id, status, role')
    .eq('id', id)
    .maybeSingle();
  return res.data ?? null;
}

/** League admin approves a pending membership request.
 *  Flips status='active'. If the user has no other active memberships
 *  yet, also flips users.access_status='approved' so the platform-level
 *  PendingScreen turns off. Queues an email to the new member. */
export async function approveMembership(
  membershipId: string,
): Promise<MembershipDecision> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const m = await fetchMembership(membershipId);
  if (!m) return { ok: false, error: 'Request not found.' };

  const memberships = await getMyLeagueMemberships();
  if (!canManageLeague(me, m.league_id, memberships)) {
    return { ok: false, error: 'You can only approve members for your league.' };
  }
  if (m.status !== 'pending') {
    return { ok: false, error: 'Already decided.' };
  }

  // 1. Flip the membership to active.
  const upd = await supabase
    .from('league_memberships')
    .update({ status: 'active' })
    .eq('id', membershipId);
  if (upd.error) return { ok: false, error: upd.error.message };

  // 2. If the user has no OTHER active membership yet, also flip
  //    users.access_status='approved'. (We just made one active — count > 0
  //    means we ARE that first one; flip them on.)
  const activeCount = await supabase
    .from('league_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', m.user_id)
    .eq('status', 'active');
  if ((activeCount.count ?? 0) > 0) {
    await supabase
      .from('users')
      .update({
        access_status: 'approved',
        access_decided_at: new Date().toISOString(),
        access_decided_by: me.id,
      })
      .eq('id', m.user_id)
      .eq('access_status', 'pending'); // only flip if still pending
  }

  // 3. Look up the league for the email + a friendly notification.
  const leagueRes = await supabase
    .from('leagues')
    .select('name')
    .eq('id', m.league_id)
    .maybeSingle();
  const leagueName = leagueRes.data?.name ?? 'Fairway Founders';

  // 4. Email + notification (best-effort).
  const target = await fetchTarget(m.user_id);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_approved',
      toEmail: target.email,
      toUserId: target.id,
      subject: `You’re in — welcome to ${leagueName}`,
      body: [
        `Hi ${first},`,
        '',
        `Your request to join ${leagueName} is approved. RSVP for the next round here:`,
        SITE_URL + '/dashboard',
        '',
        'See you on the course.',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }
  try {
    await supabase.from('notifications').insert({
      user_id: m.user_id,
      kind: 'access_request',
      title: `You're in — welcome to ${leagueName}`,
      body: null,
      link: '/dashboard',
      created_by: me.id,
    });
  } catch {
    // best-effort
  }

  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/gln');
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** League admin declines a pending membership request.
 *  Flips status='declined'. Does NOT change users.access_status — a
 *  decline from one league shouldn't lock the user out of the platform
 *  or other leagues they're already in. */
export async function declineMembership(
  membershipId: string,
): Promise<MembershipDecision> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const m = await fetchMembership(membershipId);
  if (!m) return { ok: false, error: 'Request not found.' };

  const memberships = await getMyLeagueMemberships();
  if (!canManageLeague(me, m.league_id, memberships)) {
    return { ok: false, error: 'You can only decline members for your league.' };
  }
  if (m.status !== 'pending') {
    return { ok: false, error: 'Already decided.' };
  }

  const upd = await supabase
    .from('league_memberships')
    .update({ status: 'declined' })
    .eq('id', membershipId);
  if (upd.error) return { ok: false, error: upd.error.message };

  const leagueRes = await supabase
    .from('leagues')
    .select('name')
    .eq('id', m.league_id)
    .maybeSingle();
  const leagueName = leagueRes.data?.name ?? 'this league';

  const target = await fetchTarget(m.user_id);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_denied',
      toEmail: target.email,
      toUserId: target.id,
      subject: `About your ${leagueName} request`,
      body: [
        `Hi ${first},`,
        '',
        `Thanks for your interest in ${leagueName}. We aren’t able to add you to this league at this time.`,
        '',
        'If you think this is a mistake, reach out and we’ll take another look.',
        '',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/gln');
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Member self-requests to join a league. Creates a pending row.
 *  Called by JoinExistingLeague.tsx on /join/[slug]. */
export async function requestLeagueJoin(
  leagueId: string,
): Promise<MembershipDecision> {
  const me = await getAppUser();
  if (!me) return { ok: false, error: 'Not signed in.' };

  const existing = await supabase
    .from('league_memberships')
    .select('id, status')
    .eq('league_id', leagueId)
    .eq('user_id', me.id)
    .maybeSingle();

  if (existing.data) {
    if (existing.data.status === 'active') {
      return { ok: false, error: 'You are already a member of this league.' };
    }
    if (existing.data.status === 'pending') {
      return { ok: true }; // idempotent
    }
    // Was declined → flip back to pending. Admin will see a fresh row.
    const upd = await supabase
      .from('league_memberships')
      .update({ status: 'pending' })
      .eq('id', existing.data.id);
    if (upd.error) return { ok: false, error: upd.error.message };
  } else {
    const ins = await supabase.from('league_memberships').insert({
      league_id: leagueId,
      user_id: me.id,
      role: 'member',
      status: 'pending',
    });
    if (ins.error) return { ok: false, error: ins.error.message };
  }

  // Notify the league admins (best-effort).
  try {
    const leagueRes = await supabase
      .from('leagues')
      .select('name')
      .eq('id', leagueId)
      .maybeSingle();
    const leagueName = leagueRes.data?.name ?? 'a league';

    const adminRows = await supabase
      .from('league_memberships')
      .select('user_id')
      .eq('league_id', leagueId)
      .eq('role', 'admin')
      .eq('status', 'active');
    const adminIds = (adminRows.data ?? []).map((r) => r.user_id);

    // Also notify GLN admins so the platform owner sees new requests.
    const glnRows = await supabase
      .from('users')
      .select('id')
      .eq('app_role', 'super_admin')
      .eq('access_status', 'approved');
    for (const r of glnRows.data ?? []) {
      if (!adminIds.includes(r.id)) adminIds.push(r.id);
    }

    if (adminIds.length) {
      await supabase.from('notifications').insert(
        adminIds
          .filter((id) => id !== me.id)
          .map((id) => ({
            user_id: id,
            kind: 'access_request' as const,
            title: `${me.name} requested to join ${leagueName}`,
            body: null,
            link: '/admin/access',
            created_by: me.id,
          })),
      );
    }
  } catch {
    // best-effort
  }

  revalidatePath('/admin/access');
  revalidatePath('/me');
  revalidatePath('/', 'layout');
  return { ok: true };
}

// ────────────────────────────────────────────────────────────────
// Legacy global-access actions
// Used by /gln/access (if/when GLN admin overrides per-league flow)
// and during the M3 migration window. Kept so existing callers don't
// break. New code should use approve/declineMembership.
// ────────────────────────────────────────────────────────────────

export async function approveAccess(userId: string): Promise<void> {
  const me = await requireGlnAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'approved',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);

  const target = await fetchTarget(userId);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_approved',
      toEmail: target.email,
      toUserId: target.id,
      subject: 'You’re in — welcome to Fairway Founders',
      body: [
        `Hi ${first},`,
        '',
        'Your request to join Fairway Founders is approved. RSVP for the next round here:',
        SITE_URL + '/dashboard',
        '',
        'See you on the course.',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}

export async function denyAccess(userId: string): Promise<void> {
  const me = await requireGlnAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'denied',
      access_decided_at: new Date().toISOString(),
      access_decided_by: me.id,
    })
    .eq('id', userId);

  const target = await fetchTarget(userId);
  if (target) {
    const first = target.name.split(' ')[0] || 'there';
    await queueEmail({
      kind: 'access_denied',
      toEmail: target.email,
      toUserId: target.id,
      subject: 'About your Fairway Founders request',
      body: [
        `Hi ${first},`,
        '',
        'Thanks for your interest in Fairway Founders. We aren’t able to add you to the network at this time.',
        '',
        'If you think this is a mistake, reach out and we’ll take another look.',
        '',
        '— Fairway Founders',
      ].join('\n'),
      sentBy: me.id,
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}

export async function reopenAccess(userId: string): Promise<void> {
  await requireGlnAdmin();
  await supabase
    .from('users')
    .update({
      access_status: 'pending',
      access_decided_at: null,
      access_decided_by: null,
    })
    .eq('id', userId);
  revalidatePath('/admin');
  revalidatePath('/admin/access');
  revalidatePath('/');
}
