import Link from 'next/link';
import Image from 'next/image';
import {
  getSponsorsForPlacement,
  type SponsorPlacement,
} from '@/lib/sponsorships';

/**
 * Horizontal strip of active sponsors for a given placement.
 *
 * Renders nothing when no sponsors are promoted to this placement — empty
 * states would just be brand-distracting noise on the dashboard.
 *
 * Used on /dashboard (placement="dashboard_strip") today; same component
 * can mount anywhere we want a horizontal sponsor row.
 */
export default async function SponsorStrip({
  placement,
  leagueId,
}: {
  placement: SponsorPlacement;
  leagueId?: string;
}) {
  const sponsors = await getSponsorsForPlacement(placement, leagueId);
  if (sponsors.length === 0) return null;

  return (
    <section className="mt-6">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Brought to you by
      </p>
      <div className="mt-2 -mx-6 px-6 overflow-x-auto">
        <div className="flex gap-3 pb-2 min-w-fit">
          {sponsors.map((s) => {
            const href = s.websiteUrl || `/roster/${s.userId}`;
            const isExternal = !!s.websiteUrl;
            const body = (
              <>
                <div className="w-12 h-12 shrink-0 rounded-md bg-[color:#f0ebd8] flex items-center justify-center overflow-hidden">
                  {s.logoUrl ? (
                    <Image
                      src={s.logoUrl}
                      alt={`${s.company ?? s.name} logo`}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="text-base text-[color:var(--color-mute)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {(s.company ?? s.name).slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 max-w-[220px]">
                  <p
                    className="text-sm leading-tight truncate"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {s.company ?? s.name}
                  </p>
                  {s.tagline && (
                    <p className="text-[11px] text-[color:#5a5a4a] leading-snug truncate">
                      {s.tagline}
                    </p>
                  )}
                </div>
                <span className="text-[color:var(--color-gold)] text-xs shrink-0">→</span>
              </>
            );
            const cardClass =
              'flex items-center gap-3 w-72 shrink-0 rounded-xl border border-[color:#e8e2d2] bg-white ff-card px-3 py-3 hover:border-[color:var(--color-gold)]';
            return isExternal ? (
              <a
                key={s.sponsorshipId}
                href={href}
                target="_blank"
                rel="noopener noreferrer external"
                className={cardClass}
              >
                {body}
              </a>
            ) : (
              <Link key={s.sponsorshipId} href={href} className={cardClass}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
