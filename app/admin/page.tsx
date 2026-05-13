import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import {
  COURSE_OPTIONS,
  fmtMoney,
  liveStatus,
  lastName,
} from '@/lib/schedule';
import AdminRsvpList from './AdminRsvpList';
import GenerateButton from './GenerateButton';

export default async function AdminHome() {
  const me = await getAppUser();
  if (!me || me.app_role !== 'admin') redirect('/');

  const eventRes = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  const event = eventRes.data;

  if (!event) {
    return (
      <main className="px-6 py-8 max-w-md mx-auto">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
          Admin console
        </p>
        <h1
          className="mt-2 text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          No event yet.
        </h1>
        <p className="mt-3 text-sm text-[color:#5a5a4a]">
          Event creation comes in the next milestone.
        </p>
      </main>
    );
  }

  const status = liveStatus(event);

  // All members for the RSVP list
  const membersRes = await supabase
    .from('users')
    .select('id, name, professional_role')
    .order('name');
  const members = membersRes.data ?? [];

  // RSVPs for this event
  const rsvpRes = await supabase
    .from('rsvps')
    .select('user_id')
    .eq('event_id', event.id);
  const rsvpedIds = (rsvpRes.data ?? []).map((r) => r.user_id);

  // Foursomes for display
  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, foursome_members(cart_number, user:user_id(id, name, professional_role))',
    )
    .eq('event_id', event.id)
    .order('group_index');
  type FoursomeRow = NonNullable<typeof foursomeRes.data>[number];
  const foursomes: FoursomeRow[] = foursomeRes.data ?? [];

  const eventDate = new Date(event.date);
  const dateStr = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Admin console
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {dateStr}
      </h1>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-mute)] mt-1">
        Status · {status} · {COURSE_OPTIONS[event.course_config].label} ·{' '}
        {fmtMoney(event.fee_cents)}/player
      </p>

      <section className="mt-6">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          Groups
        </p>
        <GenerateButton
          eventId={event.id}
          rsvpCount={rsvpedIds.length}
          hasFoursomes={foursomes.length > 0}
        />
      </section>

      {foursomes.length > 0 && (
        <section className="mt-6 space-y-2.5">
          {foursomes.map((f) => {
            const cartMap = new Map<number, string[]>();
            for (const mem of f.foursome_members ?? []) {
              const u = Array.isArray(mem.user) ? mem.user[0] : mem.user;
              if (!u) continue;
              const list = cartMap.get(mem.cart_number) ?? [];
              list.push(u.name);
              cartMap.set(mem.cart_number, list);
            }
            return (
              <div
                key={f.id}
                className="rounded-xl border border-[color:#e8e2d2] bg-white overflow-hidden"
              >
                <div className="bg-[color:var(--color-navy)] text-[color:var(--color-cream)] px-4 py-2.5 flex justify-between items-center">
                  <p
                    className="text-sm font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Group {f.group_index + 1}
                  </p>
                  <p className="text-[10px] font-bold tracking-[0.1em] text-[color:var(--color-gold)]">
                    HOLE {f.hole}
                    {f.tier !== 'A' ? ` · TIER ${f.tier}` : ''}
                  </p>
                </div>
                {[...cartMap.entries()]
                  .sort(([a], [b]) => a - b)
                  .map(([cartNum, names]) => (
                    <div
                      key={cartNum}
                      className="px-4 py-2 border-t border-[color:#f0ebd8] flex justify-between text-sm"
                    >
                      <span className="font-semibold text-[color:var(--color-gold)] w-16">
                        Cart {cartNum}
                      </span>
                      <span className="text-right flex-1">
                        {names.map((n) => lastName(n)).join(' & ')}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
        </section>
      )}

      <section className="mt-8">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          RSVPs · {rsvpedIds.length} of {members.length}
        </p>
        <div className="rounded-xl border border-[color:#e8e2d2] bg-white">
          <AdminRsvpList
            eventId={event.id}
            members={members}
            rsvpedIds={rsvpedIds}
          />
        </div>
      </section>
    </main>
  );
}
