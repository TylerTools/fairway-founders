'use client';

import { useEffect } from 'react';

/**
 * Stamps the `ff-intended-league` cookie on mount so the next
 * authenticated request can pair this Clerk sign-up with the right
 * league. The server-side hook in `getAppUser()` reads the cookie
 * when it creates the `users` row and inserts a pending membership
 * for the matching league, then clears the cookie.
 *
 * Short TTL (10 min) — long enough to complete a Clerk modal flow,
 * short enough to avoid stamping a stale intention onto a later
 * unrelated sign-up. SameSite=lax because the Clerk modal sometimes
 * navigates through Clerk's domain before bouncing back.
 */
export default function SetIntendedLeague({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.cookie = `ff-intended-league=${encodeURIComponent(
      slug,
    )}; path=/; max-age=600; samesite=lax`;
  }, [slug]);
  return null;
}
