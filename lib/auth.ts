import { cache } from 'react';
import { supabase } from './supabase';
import { getAppUser, type AppUser } from './current-user';
import type { Database } from './database.types';

export type LeagueMembership =
  Database['public']['Tables']['league_memberships']['Row'];
export type LeagueMemberRole =
  Database['public']['Enums']['league_member_role'];
export type LeagueMembershipStatus =
  Database['public']['Enums']['league_membership_status'];

/**
 * Fetch the current user's league memberships, cached per request.
 * Server components and server actions can call this freely.
 */
export const getMyLeagueMemberships = cache(
  async (): Promise<LeagueMembership[]> => {
    const me = await getAppUser();
    if (!me) return [];
    const res = await supabase
      .from('league_memberships')
      .select('*')
      .eq('user_id', me.id);
    return res.data ?? [];
  },
);

/**
 * Course IDs where the current user is listed as a course contact
 * (course-staff link). Cached per request.
 */
export const getMyCourseStaffCourseIds = cache(
  async (): Promise<string[]> => {
    const me = await getAppUser();
    if (!me) return [];
    const res = await supabase
      .from('course_contacts')
      .select('course_id')
      .eq('user_id', me.id);
    return (res.data ?? []).map((r) => r.course_id);
  },
);

// ────────────────────────────────────────────────────────────────
// Capability checks — all synchronous given an AppUser + lookups
// ────────────────────────────────────────────────────────────────

export function isSuperAdmin(me: AppUser | null): boolean {
  return !!me && me.app_role === 'super_admin';
}

/** GLN admin = the super_admin of the platform itself. Renamed alias —
 *  the database enum value stays 'super_admin' so existing data and
 *  migrations don't churn, but UI copy + new helpers say "GLN admin"
 *  to match the two-tier mental model. */
export function isGlnAdmin(me: AppUser | null): boolean {
  return isSuperAdmin(me);
}

export function isLeagueAdmin(
  me: AppUser | null,
  leagueId: string,
  memberships: LeagueMembership[],
): boolean {
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  return memberships.some(
    (m) =>
      m.league_id === leagueId &&
      m.role === 'admin' &&
      m.status === 'active',
  );
}

/** Canonical guard for any per-league admin action — courses, events,
 *  sponsorships, members, the cockpit itself. GLN admins always pass;
 *  league admins pass for their specific league. */
export function canManageLeague(
  me: AppUser | null,
  leagueId: string,
  memberships: LeagueMembership[],
): boolean {
  return isLeagueAdmin(me, leagueId, memberships);
}

export function hasAnyLeagueAdmin(
  me: AppUser | null,
  memberships: LeagueMembership[],
): boolean {
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  return memberships.some(
    (m) => m.role === 'admin' && m.status === 'active',
  );
}

export function isCourseStaff(
  me: AppUser | null,
  courseId: string,
  courseStaffCourseIds: string[],
): boolean {
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  return courseStaffCourseIds.includes(courseId);
}

export function isAnyCourseStaff(
  me: AppUser | null,
  courseStaffCourseIds: string[],
): boolean {
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  return courseStaffCourseIds.length > 0;
}

// ────────────────────────────────────────────────────────────────
// Convenience: route-guard helpers that fetch + check in one call
// ────────────────────────────────────────────────────────────────

/** True if the current user can access ANY admin surface (used for
 *  nav-tab visibility — finer-grained guards inside each surface use
 *  canManageLeague(currentLeagueId) or canAccessGln). */
export async function canAccessAdmin(): Promise<boolean> {
  const me = await getAppUser();
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  const memberships = await getMyLeagueMemberships();
  return hasAnyLeagueAdmin(me, memberships);
}

/** True only for GLN admins. The guard for /gln/* and every cross-league
 *  or platform-wide action (creating leagues, promoting to GLN admin,
 *  cross-league reports). */
export async function canAccessGln(): Promise<boolean> {
  const me = await getAppUser();
  return isGlnAdmin(me);
}

/** True if the current user can access the course-ops view. */
export async function canAccessCourseOps(): Promise<boolean> {
  const me = await getAppUser();
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  const memberships = await getMyLeagueMemberships();
  if (hasAnyLeagueAdmin(me, memberships)) return true;
  const staffCourses = await getMyCourseStaffCourseIds();
  return staffCourses.length > 0;
}
