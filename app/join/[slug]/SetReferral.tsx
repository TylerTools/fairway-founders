'use client';

import { useEffect } from 'react';

/**
 * Stamps the `ff-referred-by` cookie on mount when a visitor lands on
 * /join/[slug]?ref=CODE. The server-side hook in getAppUser() reads it
 * the first time the user is created and attributes the referral (sets
 * users.invited_by) + auto-approves them into the inviter's league.
 *
 * Same short TTL + SameSite as the intended-league cookie — long enough
 * to finish a Clerk modal flow, short enough not to misattribute a later
 * unrelated sign-up.
 */
export default function SetReferral({ code }: { code: string }) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.cookie = `ff-referred-by=${encodeURIComponent(
      code,
    )}; path=/; max-age=600; samesite=lax`;
  }, [code]);
  return null;
}
