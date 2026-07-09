import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { isGlnAdmin } from '@/lib/auth';
import LeagueSettingsForm from '@/app/admin/leagues/[id]/LeagueSettingsForm';
import MemberManager from '@/app/admin/leagues/[id]/MemberManager';

export const dynamic = 'force-dynamic';

/**
 * GLN admin detail view for a single league. Same content as the prior
 * /admin/leagues/[id] surface, just under /gln/* with the GLN admin guard.
 *
 * Reuses LeagueSettingsForm + MemberManager from the existing admin tree —
 * those components stay where they live; only the page wrapper moved.
 */
export default async function GlnLeagueDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getAppUser();
  if (!me) redirect('/');
  if (!isGlnAdmin(me)) redirect('/admin');

  const leagueRes = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!leagueRes.data) notFound();
  const league = leagueRes.data;

  const membersRes = await supabase
    .from('league_memberships')
    .select(
      'id, role, joined_at, user:user_id(id, name, email, professional_role, company)',
    )
    .eq('league_id', id)
    .eq('status', 'active');
  const memberships: {
    id: string;
    role: 'member' | 'admin';
    joined_at: string;
    user: {
      id: string;
      name: string;
      email: string;
      professional_role: string | null;
      company: string | null;
    };
  }[] = [];
  for (const row of membersRes.data ?? []) {
    const u = Array.isArray(row.user) ? row.user[0] : row.user;
    if (!u) continue;
    memberships.push({ ...row, user: u });
  }
  memberships.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
    return a.user.name.localeCompare(b.user.name);
  });

  const coursesRes = await supabase
    .from('courses')
    .select('id, name, is_active')
    .eq('league_id', id)
    .order('name');
  const courses = coursesRes.data ?? [];

  // Candidates for the "Add member" picker: every approved OR pending user
  // not already an active member of this league. Pending users are shown so
  // orphan sign-ups (no /join/[slug] cookie → no membership row) can be
  // rescued from here as well.
  const memberUserIds = new Set(memberships.map((m) => m.user.id));
  const allUsersRes = await supabase
    .from('users')
    .select('id, name, email, access_status')
    .in('access_status', ['approved', 'pending'])
    .order('name');
  const candidates = (allUsersRes.data ?? [])
    .filter((u) => !memberUserIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      pending: u.access_status === 'pending',
    }));

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <Link
        href="/gln"
        className="text-xs text-[color:var(--color-gold)]"
      >
        ← GLN console
      </Link>
      <p className="mt-4 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        League
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {league.name}
      </h1>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-mute)] mt-1">
        {league.slug} · {memberships.length} member
        {memberships.length === 1 ? '' : 's'} · {courses.length} course
        {courses.length === 1 ? '' : 's'}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-6 space-y-6 lg:space-y-0">
        <div className="space-y-6">
          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              League settings
            </p>
            <LeagueSettingsForm league={league} />
          </section>

          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Courses
            </p>
            {courses.length === 0 ? (
              <p className="text-sm text-[color:var(--color-mute)] italic">
                No courses yet.{' '}
                <Link
                  href="/admin/courses"
                  className="text-[color:var(--color-gold)] underline"
                >
                  Add one
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-[color:#e8e2d2] bg-white ff-card px-3 py-2 flex justify-between items-center"
                  >
                    <span className="text-sm font-semibold">{c.name}</span>
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
                    >
                      Manage →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Members
            </p>
            <MemberManager
              leagueId={league.id}
              memberships={memberships}
              candidates={candidates}
              myUserId={me.id}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
