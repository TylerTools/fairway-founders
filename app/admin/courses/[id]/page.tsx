import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import {
  isSuperAdmin,
  isLeagueAdmin,
  getMyLeagueMemberships,
} from '@/lib/auth';
import CourseSettingsForm from './CourseSettingsForm';
import ContactList from './ContactList';

export const dynamic = 'force-dynamic';

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin') redirect('/dashboard');

  const courseRes = await supabase
    .from('courses')
    .select('*, league:league_id(id, name, short_name)')
    .eq('id', id)
    .maybeSingle();
  if (!courseRes.data) notFound();
  const course = courseRes.data;
  const league = Array.isArray(course.league) ? course.league[0] : course.league;
  if (!league) notFound();

  const memberships = await getMyLeagueMemberships();
  const canManage =
    isSuperAdmin(me) || isLeagueAdmin(me, league.id, memberships);
  if (!canManage) redirect('/dashboard');

  const contactsRes = await supabase
    .from('course_contacts')
    .select('id, name, role, email, phone, is_primary, user_id, notes')
    .eq('course_id', id)
    .order('is_primary', { ascending: false })
    .order('name');
  const contacts = contactsRes.data ?? [];

  const eventsRes = await supabase
    .from('events')
    .select('id, date, course_config, fee_cents, status')
    .eq('course_id', id)
    .order('date');
  const events = eventsRes.data ?? [];

  // Members in this league are candidates for "link this contact to a user
  // so they can sign in and get course-staff access"
  const membersRes = await supabase
    .from('league_memberships')
    .select('user:user_id(id, name, email)')
    .eq('league_id', league.id);
  const memberOptions: { id: string; name: string; email: string }[] = [];
  for (const row of membersRes.data ?? []) {
    const u = Array.isArray(row.user) ? row.user[0] : row.user;
    if (u) memberOptions.push({ id: u.id, name: u.name, email: u.email });
  }
  memberOptions.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-5xl mx-auto w-full">
      <Link
        href="/admin/courses"
        className="text-xs text-[color:var(--color-gold)]"
      >
        ← Courses
      </Link>
      <p className="mt-4 text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        {league.short_name ?? league.name}
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {course.name}
      </h1>
      {(course.city || course.state) && (
        <p className="text-xs text-[color:var(--color-mute)] mt-1">
          {[course.city, course.state].filter(Boolean).join(', ')}
        </p>
      )}

      <div className="mt-6 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-6 space-y-6 lg:space-y-0">
        {/* LEFT — course settings + contacts */}
        <div className="space-y-6">
          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Course settings
            </p>
            <CourseSettingsForm course={course} />
          </section>

          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Pro shop & contacts
            </p>
            <ContactList
              courseId={course.id}
              contacts={contacts}
              memberOptions={memberOptions}
            />
          </section>
        </div>

        {/* RIGHT — events at this course */}
        <div className="space-y-6">
          <section>
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Events at this course
            </p>
            {events.length === 0 ? (
              <p className="text-sm text-[color:var(--color-mute)] italic">
                None yet. Schedule an event from the Admin page for now.
              </p>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => {
                  const d = new Date(e.date);
                  return (
                    <li
                      key={e.id}
                      className="rounded-lg border border-[color:#e8e2d2] bg-white ff-card px-3 py-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {d.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
                          {e.course_config} · ${(e.fee_cents / 100).toFixed(0)} ·{' '}
                          {e.status}
                        </p>
                      </div>
                      <Link
                        href={`/admin?event=${e.id}`}
                        className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)]"
                      >
                        Manage →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
