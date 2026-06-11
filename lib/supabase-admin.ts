import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Service-role Supabase client. SERVER-ONLY.
 *
 * The service-role key bypasses every RLS rule on every table, so this module
 * must never be imported from a Client Component — the `server-only` import
 * above makes a client import a build error. Use it solely for privileged
 * server work that the publishable-key client can't do, e.g. writing to
 * Storage buckets (Storage RLS denies the anon key by default).
 *
 * Lazy, like lib/supabase.ts: the client is built on first use, not at module
 * load, so a missing env var surfaces as a clear runtime error rather than a
 * build-time crash. `SUPABASE_SERVICE_ROLE_KEY` is provisioned outside the repo
 * (.env.local + Vercel).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Service-role Supabase client unavailable. Set NEXT_PUBLIC_SUPABASE_URL ' +
        'and SUPABASE_SERVICE_ROLE_KEY in .env.local (and Vercel) before using ' +
        'server-side Storage writes.',
    );
  }
  cached = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cached;
}
