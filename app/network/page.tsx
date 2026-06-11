import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/current-user';
import { getMyPendingRequests } from '@/app/actions/interactions';
import RequestsInbox from './RequestsInbox';
import LogInteraction from './LogInteraction';

export default async function NetworkPage() {
  const me = await getAppUser();
  if (!me) redirect('/');

  const pending = await getMyPendingRequests();

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <h1 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        Network
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        Track the business you give and get. Throw a <strong>Four</strong> (a referral),
        log a <strong>Link</strong> (a 1:1), or a <strong>Birdie</strong> (closed business).
        The other person confirms it, and it counts on both your profiles.
      </p>

      <section className="mt-6">
        <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-3">
          Pending for you
          {pending.length > 0 && (
            <span className="text-[color:var(--color-gold)]"> · {pending.length}</span>
          )}
        </p>
        <RequestsInbox initial={pending} />
      </section>

      <section className="mt-7">
        <LogInteraction />
      </section>
    </main>
  );
}
