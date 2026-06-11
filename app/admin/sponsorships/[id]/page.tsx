import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { canAccessAdmin } from '@/lib/auth';
import { getSponsorReport } from '@/app/actions/sponsorships';
import Avatar from '@/components/Avatar';
import AmountEditor from './AmountEditor';
import PlacementEditor from './PlacementEditor';

const KIND_LABEL = { featured: 'Featured listing', round: 'Round sponsor' } as const;

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';
}

export default async function SponsorReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await canAccessAdmin())) redirect('/');
  const { id } = await params;
  const r = await getSponsorReport(id);
  if (!r) notFound();

  const ctr = r.listingViews > 0 ? Math.round((r.siteClicks / r.listingViews) * 100) : 0;

  return (
    <main className="px-6 py-8 max-w-md lg:max-w-2xl mx-auto w-full">
      <Link href="/admin/sponsorships" className="text-xs text-[color:var(--color-gold)]">
        ← Sponsorships
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <Avatar size={56} photoUrl={r.member.photo_url} rounded="xl" />
        <div className="min-w-0">
          <h1 className="text-2xl leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {r.member.name}
          </h1>
          {r.member.company && (
            <p className="text-sm text-[color:var(--color-mute)]">{r.member.company}</p>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-[color:var(--color-mute)]">
        {KIND_LABEL[r.kind]} · {fmtDate(r.startsAt)} – {fmtDate(r.endsAt)} · {r.status}
      </p>

      <Section title="Listing performance">
        <StatGrid
          items={[
            { n: r.listingViews, label: 'Views' },
            { n: r.uniqueViewers, label: 'Unique people' },
            { n: r.siteClicks, label: 'Site clicks' },
            { n: `${ctr}%`, label: 'Click-through' },
            { n: r.vcardSaves, label: 'vCard saves' },
          ]}
        />
      </Section>

      <Section title="Business received through the club">
        <StatGrid
          items={[
            { n: r.foursReceived, label: 'Referrals (Fours)' },
            { n: r.linksMade, label: '1:1s (Links)' },
            { n: r.birdiesClosed, label: 'Closed (Birdies)' },
            { n: money(r.businessReceivedCents), label: 'Business $' },
          ]}
        />
      </Section>

      <Section title="Club context (same window)">
        <StatGrid
          items={[
            { n: money(r.clubClosedBusinessCents), label: 'Club closed business' },
            { n: r.clubConnections, label: 'Connections formed' },
          ]}
        />
      </Section>

      <div className="mt-3 rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
        <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
          Sponsor spend
        </p>
        <AmountEditor id={id} initialCents={r.amountCents} />
        {r.amountCents != null && r.amountCents > 0 && (
          <p className="mt-2 text-xs text-[color:#5a5a4a]">
            {money(r.businessReceivedCents)} business received on {money(r.amountCents)}{' '}
            sponsored
            {r.businessReceivedCents > 0
              ? ` · ${(r.businessReceivedCents / r.amountCents).toFixed(1)}× direct return`
              : ''}
            .
          </p>
        )}
      </div>

      <div className="mt-3">
        <PlacementEditor
          id={id}
          initial={r.placements}
          status={r.status}
        />
      </div>
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
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white p-4 grid grid-cols-3 gap-y-4 gap-x-2">
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
