import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { lastName } from '@/lib/schedule';
import PrintTrigger from './PrintTrigger';

export const dynamic = 'force-dynamic';

export default async function CartLabelsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const me = await getAppUser();
  if (!me || (me.app_role !== 'admin' && me.app_role !== 'course')) redirect('/');

  const { event: requestedEvent } = await searchParams;

  let eventRes;
  if (requestedEvent) {
    eventRes = await supabase
      .from('events')
      .select('*')
      .eq('id', requestedEvent)
      .maybeSingle();
  } else {
    eventRes = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();
  }
  const event = eventRes.data;
  if (!event) {
    return (
      <main className="px-6 py-12 text-center">
        <p className="text-sm text-[color:#5a5a4a]">No event selected.</p>
      </main>
    );
  }

  const foursomeRes = await supabase
    .from('foursomes')
    .select(
      'id, hole, tier, group_index, foursome_members(cart_number, user:user_id(name))',
    )
    .eq('event_id', event.id)
    .order('group_index');
  const foursomes = foursomeRes.data ?? [];

  const carts: {
    number: number;
    names: string[];
    hole: number;
    tier: 'A' | 'B' | 'C';
    hasTier: boolean;
  }[] = [];
  for (const f of foursomes) {
    const cartMap = new Map<number, string[]>();
    for (const mem of f.foursome_members ?? []) {
      const u = Array.isArray(mem.user) ? mem.user[0] : mem.user;
      if (!u) continue;
      const list = cartMap.get(mem.cart_number) ?? [];
      list.push(u.name);
      cartMap.set(mem.cart_number, list);
    }
    for (const [number, names] of [...cartMap.entries()].sort(([a], [b]) => a - b)) {
      carts.push({
        number,
        names,
        hole: f.hole,
        tier: f.tier,
        hasTier: f.tier !== 'A',
      });
    }
  }

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (carts.length === 0) {
    return (
      <main className="px-6 py-12 text-center">
        <p className="text-sm text-[color:#5a5a4a]">
          No foursomes generated yet — nothing to print.
        </p>
      </main>
    );
  }

  return (
    <>
      <style>{`
        body { background: #fff; }
        .ff-print-controls { padding: 24px; text-align: center; }
        .ff-print-page {
          width: 100%;
          min-height: 7.5in;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          color: #1a3a2e;
          padding: 0.5in 0;
          border-bottom: 2px dashed #c9a961;
        }
        .ff-print-page:last-child { border-bottom: none; }
        .ff-brand { width: 100%; }
        .ff-brand-line {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 22pt;
          font-weight: 600;
          letter-spacing: 0.2em;
        }
        .ff-brand-sub {
          font-family: 'Inter', sans-serif;
          font-size: 11pt;
          color: #8a8576;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 4pt;
        }
        .ff-center { display: flex; flex-direction: column; align-items: center; }
        .ff-cart-label {
          font-family: 'Inter', sans-serif;
          font-size: 28pt;
          font-weight: 600;
          letter-spacing: 0.4em;
          color: #c9a961;
        }
        .ff-cart-num {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 180pt;
          font-weight: 700;
          line-height: 0.85;
        }
        .ff-names {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ff-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 54pt;
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: 0.02em;
        }
        .ff-amp {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 32pt;
          font-style: italic;
          color: #c9a961;
          line-height: 1.1;
        }
        .ff-solo {
          font-family: 'Inter', sans-serif;
          font-size: 14pt;
          color: #8a8576;
          font-style: italic;
          margin-top: 8pt;
        }
        .ff-meta {
          font-family: 'Inter', sans-serif;
          font-size: 13pt;
          color: #5a5a4a;
          letter-spacing: 0.08em;
        }
        @media print {
          @page { size: letter landscape; margin: 0.4in; }
          .ff-no-print { display: none !important; }
          .ff-print-page {
            page-break-after: always;
            break-after: page;
            border-bottom: none;
            height: 7.5in;
            min-height: 7.5in;
          }
          .ff-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="ff-no-print ff-print-controls">
        <a
          href={`/admin`}
          className="text-xs tracking-[0.1em] uppercase text-[color:var(--color-mute)] mr-4"
        >
          ← Admin
        </a>
        <PrintTrigger count={carts.length} />
      </div>

      {carts.map((cart) => (
        <div key={`${cart.hole}-${cart.number}`} className="ff-print-page">
          <div className="ff-brand">
            <div className="ff-brand-line">FAIRWAY FOUNDERS</div>
            <div className="ff-brand-sub">{dateStr}</div>
          </div>
          <div className="ff-center">
            <div className="ff-cart-label">CART</div>
            <div className="ff-cart-num">{cart.number}</div>
          </div>
          <div className="ff-names">
            {cart.names.map((n, i) => (
              <span key={i}>
                <div className="ff-name">{lastName(n)}</div>
                {i < cart.names.length - 1 && <div className="ff-amp">&amp;</div>}
              </span>
            ))}
            {cart.names.length === 1 && <div className="ff-solo">— solo cart —</div>}
          </div>
          <div className="ff-meta">
            Hole {cart.hole}
            {cart.hasTier ? ` · Tier ${cart.tier}` : ''} &nbsp;·&nbsp; 2:30 PM Shotgun &nbsp;·&nbsp;
            Legacy Golf Club
          </div>
        </div>
      ))}
    </>
  );
}
