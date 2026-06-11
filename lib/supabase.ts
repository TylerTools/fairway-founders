import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Lazy Supabase client.
 *
 * The previous version called createClient() at module load time, which
 * crashed the production build with "supabaseUrl is required" whenever a
 * Vercel environment was missing NEXT_PUBLIC_SUPABASE_URL — e.g. when the
 * Preview env scope wasn't checked in the project settings.
 *
 * Build's "collect page data" step loads every route module. Now that
 * supabase exists as a proxy, importing this file does no work; the real
 * client is created on first property access (e.g. `supabase.from(...)`).
 * So the build never executes createClient() at module-eval time, which
 * means missing env vars surface at runtime with a clear error instead of
 * a confusing stack trace during build.
 *
 * Callers don't change — `import { supabase }` keeps working everywhere.
 */

let cached: SupabaseClient<Database> | null = null;

function getClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel for ALL environments ' +
        '(Production, Preview, Development).',
    );
  }
  cached = createClient<Database>(url, publishableKey, {
    auth: { persistSession: false },
  });
  return cached;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
}) as SupabaseClient<Database>;
