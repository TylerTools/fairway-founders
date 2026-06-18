import { supabase } from './supabase';

/**
 * Best-effort fan-out helpers. Called from server code (current-user
 * resolution, feedback submission, etc.). Errors are swallowed so the
 * parent operation still succeeds even if notification fan-out fails.
 */

export async function notifyAdminsOfAccessRequest(opts: {
  newUserId: string;
  newUserName: string;
}): Promise<void> {
  try {
    const adminsRes = await supabase
      .from('users')
      .select('id')
      .eq('app_role', 'super_admin')
      .eq('access_status', 'approved')
      .neq('id', opts.newUserId);
    const admins = adminsRes.data ?? [];
    if (admins.length === 0) return;
    await supabase.from('notifications').insert(
      admins.map((a) => ({
        user_id: a.id,
        kind: 'access_request' as const,
        title: `${opts.newUserName} requested access`,
        body: null,
        link: '/admin/access',
        created_by: opts.newUserId,
      })),
    );
  } catch {
    // best-effort
  }
}

/**
 * A new member joined via someone's referral link (auto-approved). Notify the
 * league's admins plus super admins, for visibility — these joins skip the
 * approval queue, so this is the only signal an admin gets.
 */
export async function notifyAdminsOfReferralJoin(opts: {
  newUserId: string;
  newUserName: string;
  inviterName: string;
  leagueId: string | null;
}): Promise<void> {
  try {
    const adminIds = new Set<string>();

    const supers = await supabase
      .from('users')
      .select('id')
      .eq('app_role', 'super_admin')
      .eq('access_status', 'approved');
    for (const a of supers.data ?? []) adminIds.add(a.id);

    if (opts.leagueId) {
      const leagueAdmins = await supabase
        .from('league_memberships')
        .select('user_id')
        .eq('league_id', opts.leagueId)
        .eq('role', 'admin')
        .eq('status', 'active');
      for (const a of leagueAdmins.data ?? []) adminIds.add(a.user_id);
    }

    adminIds.delete(opts.newUserId);
    if (adminIds.size === 0) return;

    await supabase.from('notifications').insert(
      [...adminIds].map((id) => ({
        user_id: id,
        kind: 'access_request' as const,
        title: `${opts.newUserName} joined via ${opts.inviterName}'s invite`,
        body: null,
        link: '/admin/access',
        created_by: opts.newUserId,
      })),
    );
  } catch {
    // best-effort
  }
}

export async function notifyAdminsOfFeedback(opts: {
  fromUserId: string | null;
  fromUserName: string;
  kind: 'feedback' | 'issue';
  subject: string | null;
}): Promise<void> {
  try {
    let q = supabase
      .from('users')
      .select('id')
      .eq('app_role', 'super_admin')
      .eq('access_status', 'approved');
    if (opts.fromUserId) q = q.neq('id', opts.fromUserId);
    const adminsRes = await q;
    const admins = adminsRes.data ?? [];
    if (admins.length === 0) return;
    const label = opts.kind === 'issue' ? 'reported an issue' : 'left feedback';
    const title = opts.subject
      ? `${opts.fromUserName} ${label}: ${opts.subject}`
      : `${opts.fromUserName} ${label}`;
    await supabase.from('notifications').insert(
      admins.map((a) => ({
        user_id: a.id,
        kind: 'feedback' as const,
        title: title.slice(0, 140),
        body: null,
        link: '/admin/feedback',
        created_by: opts.fromUserId,
      })),
    );
  } catch {
    // best-effort
  }
}
