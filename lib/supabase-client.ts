'use client';

import { useAuth } from '@clerk/nextjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import type { Database } from './database.types';

/**
 * Browser Supabase client — CLIENT-ONLY.
 *
 * Uses the publishable key + a fresh Clerk-signed JWT on every request
 * (Supabase v2 `accessToken` hook). Combined with RLS default-deny on every
 * table and narrow SELECT policies for the tables client code actually needs,
 * a stolen publishable key by itself cannot read/write anything.
 *
 * Server code MUST NOT use this — it belongs in a hook and depends on Clerk's
 * client-side session. Server actions and Server Components use
 * `lib/supabase.ts` (service-role).
 *
 * PREREQUISITE: Supabase project must have Clerk configured as a Third-Party
 * Auth provider (Dashboard → Authentication → Third-Party Auth). Otherwise
 * `auth.jwt()` in RLS returns null and every read is denied.
 */
export function useSupabaseClient(): SupabaseClient<Database> {
  const { getToken, isLoaded } = useAuth();
  // Recreate only when Clerk finishes loading — before that, getToken is a no-op.
  return useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new Error(
        'Client Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and ' +
          'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      );
    }
    return createClient<Database>(url, publishableKey, {
      auth: { persistSession: false },
      accessToken: async () => (await getToken()) ?? null,
    });
    // getToken from useAuth is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);
}
