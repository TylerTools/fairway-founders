import { redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessGln } from '@/lib/auth';
import { getClubValue } from '@/app/actions/analytics';

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Cross-league GLN value rollup. Same shape as /admin/value but unscoped —
 * every league's members, business, events, etc. aggregated. Used by GLN
 * admins to see the platform's total weight (for sponsor pitches at the
 * GLN level rather than at a single league).
 */
export default async function GlnValuePage() {
  if (!(await canAccessGln())) redirect('/admin');
  const v = await getClubValue(null);
  if (!v) redirect('/');

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <Link href="/gln" className="text-xs text-[color:var(--color-gold)]">
        ← GLN console
      </Link>
      <p className="mt-3 text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Platform
      </p>
      <h1 className="mt-1 text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
        Network value
      </h1>
      <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
        State of Golf Links Network across every league. The big-picture story
        for platform-level sponsors.
      </p>

      <Section title="Members across all leagues">
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

      <Section title="Business generated (all-time, all leagues)">
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

      <Section title="Traffic we send members (30d, all leagues)">
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
