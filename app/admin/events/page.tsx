import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { canAccessAdmin } from '@/lib/auth';
import { getCurrentLeague } from '@/lib/league-context';
import { COURSE_OPTIONS, fmtMoney, liveStatus } from '@/lib/schedule';
import NewEventForm from '../NewEventForm';

export const dynamic = 'force-dynamic';

export default async function AdminEventsList() {
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin' || !(await canAccessAdmin())) redirect('/dashboard');

  const league = await getCurrentLeague();
  if (!league) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <p className="text-sm text-[color:#5a5a4a]">
          You aren&rsquo;t in any league yet.
        </p>
      </main>
    );
  }

  // Courses in current league (for new-event picker + filtering events)
  const coursesRes = await supabase
    .from('courses')
    .select('id, name, short_name, default_pro_shop_email')
    .eq('league_id', league.id)
    .order('name');
  const courses = coursesRes.data ?? [];
  const courseIds = courses.map((c) => c.id);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  // Events in this league: scope by course_id ∈ courses of current league.
  // Selecting opens_at + closes_at so liveStatus() can compute the live state.
  const eventsRes = courseIds.length
    ? await supabase
        .from('events')
        .select(
          'id, date, opens_at, closes_at, status, course_config, fee_cents, course_id',
        )
        .in('course_id', courseIds)
        .order('date', { ascending: true })
    : { data: [] as Array<{
        id: string;
        date: string;
        opens_at: string;
        closes_at: string;
        status: 'locked' | 'open' | 'closed' | 'past';
        course_config: 'front' | 'back' | 'both';
        fee_cents: number;
        course_id: string;
      }> };
  const events = eventsRes.data ?? [];

  // RSVP counts per event in one query
  const rsvpCounts = new Map<string, number>();
  if (events.length) {
    const rsvpRes = await supabase
      .from('rsvps')
      .select('event_id')
      .in(
        'event_id',
        events.map((e) => e.id),
      );
    for (const row of rsvpRes.data ?? []) {
      rsvpCounts.set(row.event_id, (rsvpCounts.get(row.event_id) ?? 0) + 1);
    }
  }

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past = events.filter((e) => new Date(e.date).getTime() < now).reverse();

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-4xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <p className="mt-4 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        {league.short_name ?? league.name} · Events
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1
          className="text-3xl leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          All events
        </h1>
        <NewEventForm
          courses={courses.map((c) => ({
            id: c.id,
            name: c.name,
            default_pro_shop_email: c.default_pro_shop_email,
          }))}
        />
      </div>
      <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)]">
        {upcoming.length} upcoming · {past.length} past · {courses.length} course
        {courses.length === 1 ? '' : 's'}
      </p>

      <Group title="Upcoming" emptyCopy="No upcoming events scheduled.">
        {upcoming.map((e) => (
          <EventRow
            key={e.id}
            event={e}
            courseName={courseById.get(e.course_id)?.name ?? '—'}
            rsvps={rsvpCounts.get(e.id) ?? 0}
          />
        ))}
      </Group>

      {past.length > 0 && (
        <Group title="Past" emptyCopy="">
          {past.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              courseName={courseById.get(e.course_id)?.name ?? '—'}
              rsvps={rsvpCounts.get(e.id) ?? 0}
              dimmed
            />
          ))}
        </Group>
      )}
    </main>
  );
}

function Group({
  title,
  emptyCopy,
  children,
}: {
  title: string;
  emptyCopy: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : !!children;
  return (
    <section className="mt-7">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {hasChildren ? (
          children
        ) : (
          <p className="text-sm text-[color:var(--color-mute)] italic">
            {emptyCopy}
          </p>
        )}
      </div>
    </section>
  );
}

function EventRow({
  event,
  courseName,
  rsvps,
  dimmed,
}: {
  event: {
    id: string;
    date: string;
    opens_at: string;
    closes_at: string;
    status: 'locked' | 'open' | 'closed' | 'past';
    course_config: 'front' | 'back' | 'both';
    fee_cents: number;
  };
  courseName: string;
  rsvps: number;
  dimmed?: boolean;
}) {
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  // liveStatus() reads opens_at/closes_at/date; we don't have the rest of the
  // EventRow shape here, but it doesn't need them — cast through the read-only
  // partial we actually populated.
  const status = liveStatus(
    event as unknown as Parameters<typeof liveStatus>[0],
  );
  return (
    <Link
      href={`/admin?event=${event.id}`}
      className={`block rounded-xl border border-[color:#e8e2d2] bg-white ff-card px-4 py-3 hover:border-[color:var(--color-gold)] ${
        dimmed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p
            className="text-lg leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dateStr}
          </p>
          <p className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] mt-1 truncate">
            {courseName} · {COURSE_OPTIONS[event.course_config].label} ·{' '}
            {fmtMoney(event.fee_cents)}/player
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            {rsvps} RSVP{rsvps === 1 ? '' : 's'}
          </span>
          <span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-navy)]">
            {status}
          </span>
          <span className="text-[color:var(--color-gold)] text-sm">→</span>
        </div>
      </div>
    </Link>
  );
}
