import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { isSuperAdmin } from '@/lib/auth';
import NewLeagueForm from './NewLeagueForm';

export const dynamic = 'force-dynamic';

export default async function LeaguesIndex() {
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin' || !isSuperAdmin(me)) redirect('/admin');

  const leaguesRes = await supabase
    .from('leagues')
    .select('id, name, short_name, slug, description')
    .order('name');
  const leagues = leaguesRes.data ?? [];

  // counts for the cards
  const ids = leagues.map((l) => l.id);
  const counts: Record<string, { courses: number; members: number }> = {};
  if (ids.length) {
    const c = await supabase.from('courses').select('league_id').in('league_id', ids);
    for (const r of c.data ?? []) {
      counts[r.league_id] ??= { courses: 0, members: 0 };
      counts[r.league_id].courses += 1;
    }
    const m = await supabase
      .from('league_memberships')
      .select('league_id')
      .in('league_id', ids);
    for (const r of m.data ?? []) {
      counts[r.league_id] ??= { courses: 0, members: 0 };
      counts[r.league_id].members += 1;
    }
  }

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <div className="mt-4 flex justify-between items-start gap-3 flex-wrap">
        <div>
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
            Super admin
          </p>
          <h1
            className="mt-1 text-3xl leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Leagues
          </h1>
          <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
            {leagues.length} league{leagues.length === 1 ? '' : 's'} total
          </p>
        </div>
        <NewLeagueForm />
      </div>

      {leagues.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[color:var(--color-mute)] italic">
          No leagues yet.
        </p>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          {leagues.map((l) => (
            <Link
              key={l.id}
              href={`/admin/leagues/${l.id}`}
              className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 hover:border-[color:var(--color-gold)]"
            >
              <p
                className="text-lg font-semibold leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {l.name}
              </p>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mt-0.5">
                {l.slug}
              </p>
              {l.description && (
                <p className="text-xs text-[color:#5a5a4a] mt-2 line-clamp-2">
                  {l.description}
                </p>
              )}
              <div className="mt-3 flex justify-between text-[11px] text-[color:var(--color-mute)]">
                <span>
                  {counts[l.id]?.courses ?? 0} course
                  {(counts[l.id]?.courses ?? 0) === 1 ? '' : 's'}
                </span>
                <span>
                  {counts[l.id]?.members ?? 0} member
                  {(counts[l.id]?.members ?? 0) === 1 ? '' : 's'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
