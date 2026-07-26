import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Server Supabase client — SERVER-ONLY, SERVICE-ROLE.
 *
 * With RLS default-deny on every table, the publishable key can't do
 * anything meaningful on its own. Server actions and Server Components
 * still need full access to run their own auth via the guard layer in
 * lib/auth.ts, so this client uses the service-role key and bypasses
 * every RLS rule.
 *
 * `import 'server-only'` above makes any accidental import from a client
 * component a build error. Browser code uses `lib/supabase-client.ts`
 * (publishable key + Clerk JWT).
 *
 * Lazy proxy pattern — the client is built on first property access, not
 * at module load, so a missing env var surfaces as a clear runtime error
 * during a request rather than crashing the production build.
 */

let cached: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Server Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SERVICE_ROLE_KEY in Vercel for ALL environments ' +
        '(Production, Preview, Development).',
    );
  }
  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });
  return cached;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
}) as SupabaseClient<Database>;
