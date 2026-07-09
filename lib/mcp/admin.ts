import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/lib/current-user';

/**
 * Resolve the Clerk identity behind an MCP call to an app user and require that
 * they're a platform (GLN) admin. This is the trust boundary for every MCP tool:
 * the OAuth layer proves *who* is calling (a Clerk user id in `authInfo.extra`),
 * and this asserts they're allowed to manage the platform.
 *
 * Gated to `super_admin` — the cross-league management role. League-scoped admin
 * access could be added later per-tool.
 */
export async function requireMcpAdmin(
  clerkUserId: string | undefined,
): Promise<AppUser> {
  if (!clerkUserId) throw new Error('Unauthenticated MCP request.');
  const res = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();
  if (res.error) throw new Error(res.error.message);
  const user = res.data;
  if (!user) throw new Error('No Fairway Founders account for this identity.');
  if (user.app_role !== 'super_admin') {
    throw new Error('Admin access required — this tool is admin-only.');
  }
  return user;
}

/** Pull the Clerk user id that `verifyClerkToken` stashes on the auth info. */
export function clerkUserIdFrom(authInfo: unknown): string | undefined {
  const extra = (authInfo as { extra?: { userId?: unknown } } | undefined)?.extra;
  return typeof extra?.userId === 'string' ? extra.userId : undefined;
}
