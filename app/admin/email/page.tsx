import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getAppUser } from '@/lib/current-user';
import { getViewMode } from '@/lib/view-mode';
import { buildProShopEmail, type ProShopFoursome } from '@/lib/pro-shop-email';
import EmailDraftActions from './EmailDraftActions';

export const dynamic = 'force-dynamic';

export default async function EmailDraftPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const me = await getAppUser();
  const view = await getViewMode(me?.app_role ?? null);
  if (!me || (view !== 'admin' && view !== 'course')) redirect('/');

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

  const foursomes: ProShopFoursome[] = (foursomeRes.data ?? []).map((f) => ({
    hole: f.hole,
    tier: f.tier,
    hasTier: f.tier !== 'A',
    memberNames: (f.foursome_members ?? [])
      .map((m) => {
        const u = Array.isArray(m.user) ? m.user[0] : m.user;
        return u?.name ?? '';
      })
      .filter(Boolean),
  }));

  const playerCount = foursomes.reduce((a, f) => a + f.memberNames.length, 0);
  const cartCount = (foursomeRes.data ?? []).reduce((acc, f) => {
    const cartNums = new Set((f.foursome_members ?? []).map((m) => m.cart_number));
    return acc + cartNums.size;
  }, 0);

  if (foursomes.length === 0) {
    return (
      <main className="px-6 py-12 max-w-md mx-auto text-center">
        <Link
          href="/admin"
          className="text-xs text-[color:var(--color-gold)]"
        >
          ← Admin
        </Link>
        <p className="mt-6 text-sm text-[color:#5a5a4a]">
          Generate groups before drafting the pro-shop email.
        </p>
      </main>
    );
  }

  const draft = buildProShopEmail({ event, foursomes, playerCount, cartCount });

  return (
    <main className="px-6 py-8 max-w-md mx-auto w-full">
      <Link
        href="/admin"
        className="text-xs text-[color:var(--color-gold)]"
      >
        ← Admin
      </Link>
      <p className="mt-4 text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
        Pro Shop Email
      </p>
      <h1
        className="mt-1 text-2xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Tee time confirmation
      </h1>

      <div className="mt-5 rounded-xl border border-[color:#e8e2d2] bg-white p-4 space-y-3">
        <Field label="To">{draft.to ?? '(no pro-shop email set on the event)'}</Field>
        <Field label="Subject">{draft.subject}</Field>
        <Field label="Body">
          <pre className="whitespace-pre-wrap text-[11.5px] leading-relaxed font-mono text-[color:#1a3a2e] bg-[color:var(--color-cream)] p-3 rounded-md border border-[color:#e8e2d2]">
            {draft.body}
          </pre>
        </Field>
      </div>

      <EmailDraftActions
        to={draft.to}
        subject={draft.subject}
        body={draft.body}
        eventId={event.id}
      />

      <p className="mt-4 text-[11px] text-[color:var(--color-mute)] italic text-center">
        Server-side send via Resend lands once an API key is provisioned. For
        now, &ldquo;Open in email&rdquo; uses your default mail client.
      </p>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
