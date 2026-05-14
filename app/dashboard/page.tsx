import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { selectEvent } from '@/lib/events';
import { COURSE_OPTIONS, liveStatus, fmtMoney } from '@/lib/schedule';
import Countdown from '@/components/Countdown';
import RsvpToggle from '@/components/RsvpToggle';
import Avatar from '@/components/Avatar';
import CalendarStrip from '@/components/CalendarStrip';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const me = await getAppUser();
  if (!me) redirect('/');
  const viewRole = await getViewMode(me.app_role);
  const showAdminChrome = viewRole === 'admin';

  const { event: requestedId } = await searchParams;
  const { event, events } = await selectEvent(requestedId);

  if (!event) {
    return (
      <main className="px-6 py-20 text-center">
        <h1
          className="text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No round on the books.
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-mute)]">
          An admin needs to schedule the next event.
        </p>
      </main>
    );
  }

  const status = liveStatus(event);
  const courseLabel = COURSE_OPTIONS[event.course_config].label;

  const r = await supabase
    .from('rsvps')
    .select('id')
    .eq('event_id', event.id)
    .eq('user_id', me.id)
    .maybeSingle();
  const rsvped = !!r.data;

  let myFoursome:
    | {
        hole: number;
        tier: 'A' | 'B' | 'C';
        hasTier: boolean;
        carts: {
          number: number;
          members: {
            id: string;
            name: string;
            bio: string | null;
            professional_role: string | null;
            company: string | null;
          }[];
        }[];
      }
    | null = null;

  const fmRes = await supabase
    .from('foursome_members')
    .select(
      'cart_number, foursome:foursome_id(id, hole, tier, event_id, foursome_members(cart_number, user:user_id(id, name, bio, professional_role, company)))',
    )
    .eq('user_id', me.id);

  const myEntry = (fmRes.data ?? []).find((row) => {
    const f = Array.isArray(row.foursome) ? row.foursome[0] : row.foursome;
    return f && f.event_id === event.id;
  });
  if (myEntry) {
    const f = Array.isArray(myEntry.foursome) ? myEntry.foursome[0] : myEntry.foursome;
    if (f) {
      const tier = f.tier as 'A' | 'B' | 'C';
      const cartMap = new Map<
        number,
        {
          name: string;
          id: string;
          bio: string | null;
          professional_role: string | null;
          company: string | null;
        }[]
      >();
      for (const mem of f.foursome_members ?? []) {
        const u = Array.isArray(mem.user) ? mem.user[0] : mem.user;
        if (!u) continue;
        const list = cartMap.get(mem.cart_number) ?? [];
        list.push(u);
        cartMap.set(mem.cart_number, list);
      }
      myFoursome = {
        hole: f.hole,
        tier,
        hasTier: tier !== 'A',
        carts: [...cartMap.entries()]
          .sort(([a], [b]) => a - b)
          .map(([number, members]) => ({ number, members })),
      };
    }
  }

  const countRes = await supabase
    .from('rsvps')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id);
  const rsvpCount = countRes.count ?? 0;

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <CalendarStrip events={events} selectedId={event.id} />

      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        {dateStr}
      </p>
      <h1
        className="mt-1 text-3xl leading-tight tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Tee off{' '}
        <span
          className="italic text-[color:var(--color-gold)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          at half-past two
        </span>
      </h1>
      <p className="mt-1 text-sm text-[color:#5a5a4a]">
        Legacy Golf Club · {courseLabel} scramble · shotgun start
      </p>
      <p className="text-xs text-[color:var(--color-mute)] mt-1">
        Green fee ·{' '}
        <strong className="text-[color:var(--color-ink)]">
          {fmtMoney(event.fee_cents)} per player
        </strong>{' '}
        (paid at the pro shop)
      </p>

      <div className="mt-5 rounded-xl border border-[color:#e8e2d2] bg-white p-5">
        {status === 'open' ? (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
                  RSVP closes in
                </p>
                <p
                  className="text-2xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Countdown to={event.closes_at} />
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[color:#7c9885] mt-2 animate-pulse" />
            </div>
            <RsvpToggle
              eventId={event.id}
              rsvped={rsvped}
              feeCents={event.fee_cents}
            />
          </>
        ) : status === 'locked' ? (
          <div className="text-center">
            <p className="text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
              RSVP opens
            </p>
            <p
              className="text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Countdown to={event.opens_at} /> from now
            </p>
          </div>
        ) : status === 'closed' ? (
          <div className="text-center">
            <p className="text-[11px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
              RSVP closed
            </p>
            <p
              className="text-xl italic text-[color:var(--color-gold)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Foursomes are set
            </p>
          </div>
        ) : (
          <div className="text-center text-sm text-[color:var(--color-mute)]">
            This round is in the books.
          </div>
        )}
        <p className="mt-3 text-center text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          {rsvpCount} confirmed
        </p>
      </div>

      {myFoursome ? (
        <section className="mt-6">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
            Your group
          </p>
          <div className="rounded-xl border border-[color:#e8e2d2] bg-white overflow-hidden">
            <div className="bg-[color:var(--color-navy)] text-[color:var(--color-cream)] px-5 py-3.5 flex justify-between items-center">
              <div>
                <p className="text-[10px] tracking-[0.15em] font-semibold text-[color:var(--color-gold)]">
                  STARTING HOLE
                </p>
                <p
                  className="text-2xl font-semibold leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Hole {myFoursome.hole}
                  {myFoursome.hasTier ? ` · Tier ${myFoursome.tier}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] tracking-[0.15em] font-semibold text-[color:var(--color-gold)]">
                  SHOTGUN
                </p>
                <p
                  className="text-lg"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  2:30 PM
                </p>
              </div>
            </div>
            {myFoursome.carts.map((cart, ci) => (
              <div key={cart.number}>
                <div
                  className={`px-5 py-2 bg-[color:var(--color-cream)] text-[10px] font-bold tracking-[0.15em] text-[color:#5a5a4a] flex justify-between ${
                    ci > 0 ? 'border-t border-[color:#e8e2d2]' : ''
                  }`}
                >
                  <span>CART {cart.number}</span>
                  {cart.members.length === 1 && (
                    <span className="italic font-normal tracking-normal normal-case text-[color:var(--color-mute)]">
                      solo
                    </span>
                  )}
                </div>
                {cart.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex gap-3.5 p-4 border-t border-[color:#f0ebd8]"
                  >
                    <Avatar size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {m.name}
                        {m.id === me.id && (
                          <span className="text-[color:var(--color-gold)] font-normal"> (you)</span>
                        )}
                      </p>
                      <p className="text-xs text-[color:var(--color-mute)] mb-1">
                        {m.professional_role} · {m.company}
                      </p>
                      {m.bio && (
                        <p className="text-xs text-[color:#5a5a4a] leading-snug">{m.bio}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : status === 'open' && rsvped ? (
        <div className="mt-6 rounded-xl bg-[color:var(--color-navy)] text-[color:var(--color-cream)] p-5 text-center">
          <p
            className="text-base"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Groups drop at cutoff
          </p>
          <p className="text-xs text-[color:#a8a596] mt-1">
            Algorithm pairs carts + assigns holes
          </p>
        </div>
      ) : null}

      {showAdminChrome && me.app_role === 'admin' && (
        <p className="mt-6 text-center text-xs">
          <Link
            href={`/admin?event=${event.id}`}
            className="text-[color:var(--color-gold)] underline"
          >
            Go to admin console →
          </Link>
        </p>
      )}
    </main>
  );
}
