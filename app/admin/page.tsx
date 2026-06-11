import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { canAccessAdmin, isSuperAdmin } from '@/lib/auth';
import { selectEvent } from '@/lib/events';
import { getCurrentLeague, getMyLeagues } from '@/lib/league-context';
import { COURSE_OPTIONS, fmtMoney, liveStatus } from '@/lib/schedule';
import AdminRsvpList from './AdminRsvpList';
import GenerateButton from './GenerateButton';
import AdminFoursomes, { type AdminFoursomePayload } from './AdminFoursomes';
import EventSettingsForm from './EventSettingsForm';
import NewEventForm from './NewEventForm';
import BroadcastComposer from './BroadcastComposer';
import CalendarStrip from '@/components/CalendarStrip';
import LeagueSwitcher from '@/components/LeagueSwitcher';

export const dynamic = 'force-dynamic';

/**
 * Admin League Cockpit.
 *
 * Top frame: WORKING IN label + big league name + inline switcher (multi-league only).
 * KPI strip: six tiles linking to the relevant detail pages, with gold pills on
 *   any non-zero action-required count (sponsorship requests, access requests,
 *   new feedback).
 * Now Playing: the current event scoped under the league — generate, email,
 *   print, RSVPs, foursomes, event settings. All event-management content that
 *   used to be the whole page lives here.
 * League management: sub-section cards for Courses, Sponsorships, Inboxes,
 *   Club value report. Plus the BroadcastComposer at the bottom.
 */
export default async function AdminCockpit({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const me = await getAppUser();
  if (!me) redirect('/');
  const view = await getViewMode(me.app_role);
  if (view !== 'admin' || !(await canAccessAdmin())) redirect('/dashboard');

  const league = await getCurrentLeague();
  if (!league) {
    return (
      <main className="px-6 py-12 max-w-md lg:max-w-3xl mx-auto text-center">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Admin
        </p>
        <h1
          className="mt-2 text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No league yet.
        </h1>
        <p className="mt-3 text-sm text-[color:#5a5a4a]">
          Ask a super admin to add you to a league before managing here.
        </p>
        {isSuperAdmin(me) && (
          <Link
            href="/admin/leagues"
            className="mt-6 inline-block rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2.5 text-xs font-semibold tracking-[0.08em] uppercase"
          >
            Create a league
          </Link>
        )}
      </main>
    );
  }

  const myLeagues = await getMyLeagues();
  const { event: requestedId } = await searchParams;
  const { event, events } = await selectEvent(requestedId);

  // Counts in parallel — every KPI tile and league header stat
  const [
    coursesRes,
    membersCountRes,
    pendingSponsorshipRes,
    pendingAccessRes,
    newFeedbackRes,
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('id, name, default_pro_shop_email, is_active')
      .eq('league_id', league.id)
      .order('name'),
    supabase
      .from('league_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('league_id', league.id),
    supabase
      .from('sponsorships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'requested')
      .eq('league_id', league.id),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('access_status', 'pending'),
    supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ]);

  const courses = coursesRes.data ?? [];
  const activeCourses = courses.filter((c) => c.is_active);
  const courseOptions = activeCourses.map((c) => ({
    id: c.id,
    name: c.name,
    default_pro_shop_email: c.default_pro_shop_email,
  }));
  const membersCount = membersCountRes.count ?? 0;
  const pendingSponsorshipCount = pendingSponsorshipRes.count ?? 0;
  const pendingAccessCount = pendingAccessRes.count ?? 0;
  const newFeedbackCount = newFeedbackRes.count ?? 0;

  const upcomingEventsCount = events.filter(
    (e) => new Date(e.date).getTime() >= Date.now(),
  ).length;

  // Members + RSVPs + foursomes (only when an event is selected)
  let membersForRsvp: Array<{
    id: string;
    name: string;
    professional_role: string | null;
  }> = [];
  let rsvpedIds: string[] = [];
  let foursomes: AdminFoursomePayload[] = [];
  let totalCarts = 0;

  if (event) {
    const [membersRes, rsvpRes, foursomeRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, professional_role')
        .order('name'),
      supabase.from('rsvps').select('user_id').eq('event_id', event.id),
      supabase
        .from('foursomes')
        .select(
          'id, hole, tier, group_index, foursome_members(cart_number, user:user_id(id, name, professional_role))',
        )
        .eq('event_id', event.id)
        .order('group_index'),
    ]);
    membersForRsvp = membersRes.data ?? [];
    rsvpedIds = (rsvpRes.data ?? []).map((r) => r.user_id);
    foursomes = (foursomeRes.data ?? []).map((f) => {
      const cartMap = new Map<
        number,
        { id: string; name: string; professional_role: string | null }[]
      >();
      for (const mem of f.foursome_members ?? []) {
        const u = Array.isArray(mem.user) ? mem.user[0] : mem.user;
        if (!u) continue;
        const list = cartMap.get(mem.cart_number) ?? [];
        list.push(u);
        cartMap.set(mem.cart_number, list);
      }
      return {
        id: f.id,
        hole: f.hole,
        tier: f.tier,
        group_index: f.group_index,
        carts: [...cartMap.entries()]
          .sort(([a], [b]) => a - b)
          .map(([cart_number, mems]) => ({ cart_number, members: mems })),
      };
    });
    totalCarts = foursomes.reduce((a, f) => a + f.carts.length, 0);
  }

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-6xl mx-auto w-full">
      {/* ── League frame ─────────────────────────────────────────── */}
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Working in
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1
          className="text-3xl lg:text-4xl leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {league.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <LeagueSwitcher
            variant="inline"
            current={{
              id: league.id,
              name: league.name,
              short_name: league.short_name,
            }}
            options={myLeagues.map((l) => ({
              id: l.id,
              name: l.name,
              short_name: l.short_name,
            }))}
          />
          {isSuperAdmin(me) && (
            <Link
              href="/gln"
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-gold)] bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase hover:opacity-90"
            >
              GLN console →
            </Link>
          )}
        </div>
      </div>
      <p className="mt-1 text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)]">
        {league.short_name ?? league.name} · {membersCount} member
        {membersCount === 1 ? '' : 's'} · {activeCourses.length} course
        {activeCourses.length === 1 ? '' : 's'} · {upcomingEventsCount} event
        {upcomingEventsCount === 1 ? '' : 's'} upcoming
      </p>

      {/* ── KPI strip ────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-6 gap-2">
        <KpiTile
          href="/admin/events"
          label="Events upcoming"
          value={upcomingEventsCount}
        />
        <KpiTile href="/admin/courses" label="Courses" value={activeCourses.length} />
        <KpiTile
          href={
            isSuperAdmin(me) ? `/gln/leagues/${league.id}` : '/admin/courses'
          }
          label="Members"
          value={membersCount}
        />
        <KpiTile
          href="/admin/sponsorships"
          label="Sponsorship reqs"
          value={pendingSponsorshipCount}
          highlight={pendingSponsorshipCount > 0}
        />
        <KpiTile
          href="/admin/access"
          label="Access requests"
          value={pendingAccessCount}
          highlight={pendingAccessCount > 0}
        />
        <KpiTile
          href="/admin/feedback"
          label="Feedback inbox"
          value={newFeedbackCount}
          highlight={newFeedbackCount > 0}
        />
      </div>

      {/* ── League management sub-section cards ──────────────────── */}
      <section className="mt-8">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          League management
        </p>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SectionCard
            href="/admin/courses"
            title="Courses"
            blurb={
              activeCourses.length === 0
                ? 'No courses yet — add the first one'
                : `${activeCourses.length} active course${
                    activeCourses.length === 1 ? '' : 's'
                  } · pro-shop contacts, default emails, settings`
            }
          />
          <SectionCard
            href="/admin/events"
            title="Events"
            blurb={`${upcomingEventsCount} upcoming · all rounds across courses in this league`}
          />
          <SectionCard
            href="/admin/sponsorships"
            title="Sponsorships"
            blurb={
              pendingSponsorshipCount > 0
                ? `${pendingSponsorshipCount} pending in this league · review + promote to placements`
                : 'This league’s sponsors · review, promote to placements'
            }
            highlight={pendingSponsorshipCount > 0}
          />
          <SectionCard
            href="/admin/access"
            title="Inboxes"
            blurb={`${pendingAccessCount} access · ${newFeedbackCount} feedback`}
            highlight={pendingAccessCount + newFeedbackCount > 0}
          />
          <SectionCard
            href="/admin/value"
            title="Club value report"
            blurb="Members, business generated, traffic — for pitching sponsors"
          />
        </div>
      </section>

      {/* ── Now Playing event ────────────────────────────────────── */}
      <section className="mt-10">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          {event ? 'Now playing' : 'No event scheduled'}
        </p>
        {event ? (
          <div className="mt-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5 lg:p-6">
            <CalendarStrip events={events} selectedId={event.id} />

            <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
              <h2
                className="text-2xl lg:text-3xl leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </h2>
              <NewEventForm courses={courseOptions} />
            </div>
            <p className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] mt-1">
              {liveStatus(event)} · {COURSE_OPTIONS[event.course_config].label}{' '}
              · {fmtMoney(event.fee_cents)}/player
            </p>

            {/* Event action row */}
            <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-2">
              <GenerateButton
                eventId={event.id}
                rsvpCount={rsvpedIds.length}
                hasFoursomes={foursomes.length > 0}
              />
              <Link
                href={`/admin/email?event=${event.id}`}
                className="rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] text-center py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase"
              >
                Email pro shop
              </Link>
              {foursomes.length > 0 && (
                <Link
                  href={`/print/cart-labels?event=${event.id}`}
                  target="_blank"
                  className="rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] text-center py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase"
                >
                  Print cart labels · {totalCarts}
                </Link>
              )}
            </div>

            {/* RSVPs */}
            <div className="mt-6">
              <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                RSVPs · {rsvpedIds.length} of {membersForRsvp.length}
              </p>
              <div className="mt-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card">
                <AdminRsvpList
                  eventId={event.id}
                  members={membersForRsvp}
                  rsvpedIds={rsvpedIds}
                />
              </div>
            </div>

            {/* Foursomes */}
            {foursomes.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                  Foursomes
                </p>
                <div className="mt-2">
                  <AdminFoursomes eventId={event.id} foursomes={foursomes} />
                </div>
              </div>
            )}

            {/* Event settings (collapsed by default — it's a power-user surface) */}
            <details className="mt-6 group">
              <summary className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)] cursor-pointer hover:text-[color:var(--color-navy)] list-none flex items-center gap-1.5">
                <span className="group-open:rotate-90 transition-transform">
                  ›
                </span>
                Event settings
              </summary>
              <div className="mt-3">
                <EventSettingsForm event={event} />
              </div>
            </details>
          </div>
        ) : (
          <div className="mt-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-6 text-center">
            <p className="text-sm text-[color:#5a5a4a]">
              No event scheduled. Add a course first if you haven&rsquo;t already,
              then schedule a round.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <NewEventForm courses={courseOptions} />
              {courses.length === 0 && (
                <Link
                  href="/admin/courses"
                  className="rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-4 py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase"
                >
                  Add a course
                </Link>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Broadcast composer ──────────────────────────────────── */}
      <section className="mt-10">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Broadcast
        </p>
        <div className="mt-3">
          <BroadcastComposer />
        </div>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Inline tiles + cards
// ─────────────────────────────────────────────────────────────────

function KpiTile({
  href,
  label,
  value,
  highlight,
}: {
  href: string;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-[color:#e8e2d2] bg-white ff-card px-4 py-3 hover:border-[color:var(--color-gold)]"
    >
      <p
        className={`text-2xl leading-none ${
          highlight ? 'text-[color:var(--color-gold)]' : 'text-[color:var(--color-navy)]'
        }`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="mt-1 text-[9px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)] leading-tight">
        {label}
      </p>
    </Link>
  );
}

function SectionCard({
  href,
  title,
  blurb,
  highlight,
}: {
  href: string;
  title: string;
  blurb: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border bg-white ff-card px-5 py-4 hover:border-[color:var(--color-gold)] ${
        highlight ? 'border-[color:var(--color-gold)]' : 'border-[color:#e8e2d2]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-lg leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </p>
          <p className="mt-1 text-[12px] text-[color:#5a5a4a] leading-relaxed">
            {blurb}
          </p>
        </div>
        <span className="text-[color:var(--color-gold)] shrink-0 text-base">→</span>
      </div>
    </Link>
  );
}
