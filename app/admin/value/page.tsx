import { redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessAdmin } from '@/lib/auth';
import { getClubValue } from '@/app/actions/analytics';

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default async function ClubValuePage() {
  if (!(await canAccessAdmin())) redirect('/');
  const v = await getClubValue();
  if (!v) redirect('/');

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <Link href="/admin" className="text-xs text-[color:var(--color-gold)]">
        ← Admin
      </Link>
      <h1 className="mt-3 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        Club value
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        The state of the club — for pitching sponsors. Cumulative totals, plus traffic
        and activity over the last 30 days.
      </p>

      <Section title="Members">
        <StatGrid
          items={[
            { n: v.members, label: 'Members' },
            { n: v.activeMembers, label: 'Active (30d)' },
            { n: `+${v.newMembers30d}`, label: 'New (30d)' },
          ]}
        />
        {v.leagues.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {v.leagues.map((l) => (
              <span
                key={l.label}
                className="text-[10px] tracking-[0.08em] uppercase font-semibold bg-[color:#f0ebd8] text-[color:#5a5a4a] rounded-full px-2.5 py-1"
              >
                {l.label} · {l.members}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Business generated (all-time)">
        <StatGrid
          items={[
            { n: money(v.closedBusinessCents), label: 'Closed business' },
            { n: v.deals, label: 'Deals (Birdies)' },
            { n: v.fours, label: 'Referrals (Fours)' },
            { n: v.links, label: '1:1s (Links)' },
            { n: v.connections, label: 'Connections' },
            { n: v.roundsPlayed, label: 'Rounds played' },
          ]}
        />
      </Section>

      <Section title="Traffic we send members (30d)">
        <StatGrid
          items={[
            { n: v.profileViews30d, label: 'Profile views' },
            { n: v.siteClicks30d, label: 'Site clicks' },
            { n: v.vcardSaves30d, label: 'vCard saves' },
          ]}
        />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <p className="text-[11px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] mb-2">
        {title}
      </p>
      {children}
    </section>
  );
}

function StatGrid({ items }: { items: { n: number | string; label: string }[] }) {
  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 grid grid-cols-3 gap-y-4 gap-x-2">
      {items.map((it) => (
        <div key={it.label} className="text-center">
          <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            {it.n}
          </p>
          <p className="text-[9px] tracking-[0.1em] uppercase text-[color:var(--color-mute)] leading-tight">
            {it.label}
          </p>
        </div>
      ))}
    </div>
  );
}
