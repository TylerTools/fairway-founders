import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { COURSE_OPTIONS, fmtMoney, liveStatus } from '@/lib/schedule';
import AdminRsvpList from './AdminRsvpList';
import GenerateButton from './GenerateButton';
import AdminFoursomes, { type AdminFoursomePayload } from './AdminFoursomes';

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
      </main>
    );
  }

  const status = liveStatus(event);

  const membersRes = await supabase
    .from('users')
    .select('id, name, professional_role')
    .order('name');
  const members = membersRes.data ?? [];

  const rsvpRes = await supabase
    .from('rsvps')
    .select('user_id')
    .eq('event_id', event.id);
  const rsvpedIds = (rsvpRes.data ?? []).map((r) => r.user_id);

  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, foursome_members(cart_number, user:user_id(id, name, professional_role))',
    )
    .eq('event_id', event.id)
    .order('group_index');
  const foursomeRows = foursomeRes.data ?? [];

  const foursomes: AdminFoursomePayload[] = foursomeRows.map((f) => {
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

  const totalCarts = foursomes.reduce((a, f) => a + f.carts.length, 0);

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
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
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href={`/print/cart-labels?event=${event.id}`}
              target="_blank"
              className="rounded-lg border border-[color:var(--color-gold)] text-center py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase bg-white text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
            >
              🖨 Cart Labels ({totalCarts})
            </Link>
            <Link
              href={`/admin/email?event=${event.id}`}
              className="rounded-lg border border-[color:var(--color-gold)] text-center py-2.5 text-[11px] font-semibold tracking-[0.08em] uppercase bg-white text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
            >
              ✉ Email Pro Shop
            </Link>
          </div>
          <section className="mt-6">
            <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
              Foursomes
            </p>
            <AdminFoursomes eventId={event.id} foursomes={foursomes} />
          </section>
        </>
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
