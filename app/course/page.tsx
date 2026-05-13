import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { COURSE_OPTIONS, fmtMoney, lastName, liveStatus } from '@/lib/schedule';

export default async function CourseOpsPage() {
  const me = await getAppUser();
  if (!me || (me.app_role !== 'admin' && me.app_role !== 'course')) {
    redirect('/');
  }

  const eventRes = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();
  const event = eventRes.data;

  if (!event) {
    return (
      <main className="px-6 py-12 max-w-md mx-auto w-full text-center">
        <p className="text-sm text-[color:#5a5a4a]">No event scheduled.</p>
      </main>
    );
  }

  const status = liveStatus(event);
  const cfg = COURSE_OPTIONS[event.course_config];

  const rsvpRes = await supabase
    .from('rsvps')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event.id);
  const playerCount = rsvpRes.count ?? 0;

  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, foursome_members(cart_number, user:user_id(name))',
    )
    .eq('event_id', event.id)
    .order('hole');
  const foursomes = foursomeRes.data ?? [];
  const totalCarts = foursomes.reduce((acc, f) => {
    const cartNums = new Set((f.foursome_members ?? []).map((m) => m.cart_number));
    return acc + cartNums.size;
  }, 0);

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Course operations
      </p>
      <h1
        className="mt-1 text-3xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {dateStr}
      </h1>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[color:var(--color-mute)] mt-1">
        2:30 PM Shotgun · Legacy Golf Club · {status}
      </p>

      <section className="mt-6 rounded-xl border border-[color:#e8e2d2] bg-white overflow-hidden">
        <div className="bg-[color:var(--color-navy)] text-[color:var(--color-cream)] px-5 py-3.5">
          <p className="text-[10px] tracking-[0.15em] text-[color:var(--color-gold)] font-semibold">
            EVENT SUMMARY
          </p>
        </div>
        <div className="grid grid-cols-2">
          <Stat label="Players" value={playerCount} sub="confirmed" />
          <Stat
            label="Carts"
            value={totalCarts}
            sub={cfg.label}
            border="left"
          />
          <Stat label="Layout" value={cfg.label} sub={`Holes ${cfg.range}`} border="top" />
          <Stat
            label="Total"
            value={fmtMoney(event.fee_cents * playerCount)}
            sub={`${fmtMoney(event.fee_cents)} × ${playerCount}`}
            border="left top"
          />
        </div>
      </section>

      {foursomes.length > 0 && (
        <section className="mt-6 space-y-2">
          <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
            Hole assignments
          </p>
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
                <div className="px-4 py-2.5 bg-[color:var(--color-cream)] border-b border-[color:#e8e2d2] flex justify-between">
                  <span className="text-[11px] font-bold tracking-[0.1em]">
                    HOLE {f.hole}
                    {f.tier !== 'A' ? ` · TIER ${f.tier}` : ''}
                  </span>
                </div>
                {[...cartMap.entries()]
                  .sort(([a], [b]) => a - b)
                  .map(([cartNum, names]) => (
                    <div
                      key={cartNum}
                      className="flex justify-between px-4 py-2 border-t border-[color:#f0ebd8] text-sm first:border-t-0"
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
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  border = '',
}: {
  label: string;
  value: number | string;
  sub: string;
  border?: string;
}) {
  const cls = [
    'px-4 py-3.5',
    border.includes('left') ? 'border-l border-[color:#e8e2d2]' : '',
    border.includes('top') ? 'border-t border-[color:#e8e2d2]' : '',
  ].join(' ');
  return (
    <div className={cls}>
      <p className="text-[9px] font-bold tracking-[0.15em] text-[color:var(--color-mute)] uppercase">
        {label}
      </p>
      <p
        className="mt-0.5 text-xl font-semibold leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      <p className="text-[10px] text-[color:var(--color-mute)] mt-0.5">{sub}</p>
    </div>
  );
}
