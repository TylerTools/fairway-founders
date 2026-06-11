import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { isGlnAdmin } from '@/lib/auth';
import NewLeagueForm from '@/app/admin/leagues/NewLeagueForm';
import GlnAdminsPanel from './GlnAdminsPanel';

export const dynamic = 'force-dynamic';

/**
 * GLN console home. Cross-league overview for the platform-level admin
 * (Golf Links Network). GLN admins only — league admins are stopped here
 * and only see their league's cockpit at /admin.
 *
 * Three sections:
 *   1. KPI strip — cross-league rollups (leagues, members, events,
 *      sponsorships, business closed)
 *   2. Leagues grid — each league as a card; click → /gln/leagues/[id]
 *      Inline NewLeagueForm to add one.
 *   3. GLN admins — list of current super_admins + promote/demote.
 */
export default async function GlnHome() {
  const me = await getAppUser();
  if (!me) redirect('/');
  if (!isGlnAdmin(me)) redirect('/admin');

  // Cross-league rollups in parallel.
  const [
    leaguesRes,
    membersRes,
    coursesRes,
    upcomingEventsRes,
    activeSponsRes,
    businessRes,
    glnAdminsRes,
  ] = await Promise.all([
    supabase
      .from('leagues')
      .select('id, name, short_name, slug, description')
      .order('name'),
    supabase
      .from('league_memberships')
      .select('user_id, league_id')
      .eq('status', 'active'),
    supabase.from('courses').select('league_id').eq('is_active', true),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('date', new Date().toISOString()),
    supabase
      .from('sponsorships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('interactions')
      .select('value_cents')
      .eq('status', 'accepted')
      .eq('kind', 'birdie'),
    supabase
      .from('users')
      .select('id, name, email, last_active_at')
      .eq('app_role', 'super_admin')
      .order('name'),
  ]);

  const leagues = leaguesRes.data ?? [];
  const distinctMembers = new Set(
    (membersRes.data ?? []).map((r) => r.user_id),
  ).size;
  const totalUpcoming = upcomingEventsRes.count ?? 0;
  const totalActiveSponsors = activeSponsRes.count ?? 0;
  const totalBusinessCents = (businessRes.data ?? []).reduce(
    (s, r) => s + (r.value_cents ?? 0),
    0,
  );
  const glnAdmins = glnAdminsRes.data ?? [];

  // Per-league counts for the grid.
  const memberCounts = new Map<string, number>();
  for (const r of membersRes.data ?? []) {
    memberCounts.set(r.league_id, (memberCounts.get(r.league_id) ?? 0) + 1);
  }
  const courseCounts = new Map<string, number>();
  for (const r of coursesRes.data ?? []) {
    courseCounts.set(r.league_id, (courseCounts.get(r.league_id) ?? 0) + 1);
  }

  // Candidates for the "promote to GLN admin" picker: every approved member
  // who isn't already a GLN admin.
  const candidatesRes = await supabase
    .from('users')
    .select('id, name, email')
    .eq('access_status', 'approved')
    .neq('app_role', 'super_admin')
    .order('name');
  const promoteCandidates = candidatesRes.data ?? [];

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Platform
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1
          className="text-3xl lg:text-4xl leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Golf Links Network
        </h1>
        <NewLeagueForm />
      </div>
      <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)]">
        {leagues.length} league{leagues.length === 1 ? '' : 's'} ·{' '}
        {distinctMembers} active member{distinctMembers === 1 ? '' : 's'} ·{' '}
        {glnAdmins.length} GLN admin{glnAdmins.length === 1 ? '' : 's'}
      </p>

      {/* KPI strip — cross-league totals */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-2">
        <KpiTile label="Leagues" value={leagues.length} />
        <KpiTile label="Active members" value={distinctMembers} />
        <KpiTile label="Events upcoming" value={totalUpcoming} />
        <KpiTile label="Active sponsors" value={totalActiveSponsors} />
        <KpiTile
          label="Business closed"
          value={`$${(totalBusinessCents / 100).toLocaleString('en-US', {
            maximumFractionDigits: 0,
          })}`}
        />
      </div>

      {/* Leagues grid */}
      <section className="mt-10">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Leagues
        </p>
        {leagues.length === 0 ? (
          <p className="mt-3 text-sm italic text-[color:var(--color-mute)]">
            No leagues yet — add the first one above.
          </p>
        ) : (
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {leagues.map((l) => {
              const m = memberCounts.get(l.id) ?? 0;
              const c = courseCounts.get(l.id) ?? 0;
              return (
                <Link
                  key={l.id}
                  href={`/gln/leagues/${l.id}`}
                  className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 hover:border-[color:var(--color-gold)]"
                >
                  <p
                    className="text-lg leading-tight"
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
                      {m} member{m === 1 ? '' : 's'}
                    </span>
                    <span>
                      {c} course{c === 1 ? '' : 's'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* GLN admins */}
      <section className="mt-10">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          GLN admins
        </p>
        <p className="mt-1 text-xs text-[color:var(--color-mute)]">
          Platform-level admins — they can manage every league, create or
          delete leagues, and promote others to this role.
        </p>
        <div className="mt-3">
          <GlnAdminsPanel
            admins={glnAdmins.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              last_active_at: u.last_active_at ?? null,
            }))}
            candidates={promoteCandidates.map((u) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))}
            myUserId={me.id}
          />
        </div>
      </section>

      <p className="mt-12 text-center">
        <Link
          href="/admin"
          className="text-xs tracking-[0.1em] uppercase text-[color:var(--color-gold)]"
        >
          ← League cockpit
        </Link>
      </p>
    </main>
  );
}

function KpiTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card px-4 py-3">
      <p
        className="text-2xl leading-none text-[color:var(--color-navy)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="mt-1 text-[9px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)] leading-tight">
        {label}
      </p>
    </div>
  );
}
