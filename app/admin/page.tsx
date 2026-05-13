import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/current-user';

export default async function AdminHome() {
  const appUser = await getAppUser();
  if (!appUser || appUser.app_role !== 'admin') redirect('/');

  return (
    <main className="flex-1 px-6 py-12 max-w-3xl mx-auto w-full">
      <p className="text-xs tracking-[0.2em] uppercase text-[color:var(--color-mute)]">
        Admin console
      </p>
      <h1
        className="mt-3 text-4xl leading-tight tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Welcome, {appUser.name.split(' ')[0]}.
      </h1>
      <p className="mt-4 text-base text-[color:var(--color-ink)]/80 leading-relaxed">
        This is where you&rsquo;ll configure the event, manage the RSVP list,
        generate groups, swap players, enter scores, and trigger the pro-shop
        confirmation. Coming up next milestone.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Section title="Event settings" body="Course layout, fee, pro-shop email." />
        <Section title="RSVPs" body="See who's in for this week and toggle attendance." />
        <Section title="Groups" body="Run the algorithm, review, swap players, lock in." />
        <Section title="Round day" body="Print cart labels, draft pro-shop email, enter scores." />
      </div>
    </main>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-gold)]/30 bg-white/60 p-5">
      <div
        className="text-lg"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </div>
      <p className="mt-1 text-sm text-[color:var(--color-mute)]">{body}</p>
    </div>
  );
}
