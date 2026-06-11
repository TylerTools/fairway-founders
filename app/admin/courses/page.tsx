import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import {
  isSuperAdmin,
  isLeagueAdmin,
  getMyLeagueMemberships,
} from '@/lib/auth';
import { getCurrentLeague } from '@/lib/league-context';
import NewCourseForm from './NewCourseForm';

export const dynamic = 'force-dynamic';

export default async function CoursesIndex() {
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin') redirect('/dashboard');

  const league = await getCurrentLeague();
  if (!league) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <p className="text-sm text-[color:#5a5a4a]">
          You aren&rsquo;t in any league yet. Ask a super admin to add you.
        </p>
      </main>
    );
  }

  const memberships = await getMyLeagueMemberships();
  const canManage =
    isSuperAdmin(me) || isLeagueAdmin(me, league.id, memberships);
  if (!canManage) redirect('/dashboard');

  const coursesRes = await supabase
    .from('courses')
    .select('id, name, short_name, city, state, is_active, default_pro_shop_email')
    .eq('league_id', league.id)
    .order('name');
  const courses = coursesRes.data ?? [];

  // Event counts per course
  const ids = courses.map((c) => c.id);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const evtRes = await supabase
      .from('events')
      .select('course_id')
      .in('course_id', ids);
    for (const e of evtRes.data ?? []) {
      const id = e.course_id;
      if (!id) continue;
      counts[id] = (counts[id] ?? 0) + 1;
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
            {league.short_name ?? league.name}
          </p>
          <h1
            className="mt-1 text-3xl leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Courses
          </h1>
          <p className="text-[11px] text-[color:var(--color-mute)] mt-1">
            {courses.length} course{courses.length === 1 ? '' : 's'} in this
            league
          </p>
        </div>
        <NewCourseForm leagueId={league.id} />
      </div>

      {courses.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[color:var(--color-mute)] italic">
          No courses yet.
        </p>
      ) : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/admin/courses/${c.id}`}
              className={`rounded-xl border bg-white ff-card p-4 hover:border-[color:var(--color-gold)] ${
                c.is_active
                  ? 'border-[color:#e8e2d2]'
                  : 'border-[color:#e8e2d2] opacity-60'
              }`}
            >
              <p
                className="text-lg font-semibold leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {c.name}
              </p>
              {(c.city || c.state) && (
                <p className="text-xs text-[color:var(--color-mute)] mt-0.5">
                  {[c.city, c.state].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between text-[11px] text-[color:var(--color-mute)]">
                <span>
                  {counts[c.id] ?? 0} event
                  {(counts[c.id] ?? 0) === 1 ? '' : 's'}
                </span>
                {c.default_pro_shop_email && (
                  <span className="truncate ml-2">{c.default_pro_shop_email}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
