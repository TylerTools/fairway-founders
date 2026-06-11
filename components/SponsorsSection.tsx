import Link from 'next/link';
import Image from 'next/image';
import { getSponsorsForPlacement } from '@/lib/sponsorships';

/**
 * Quiet logo wall for the signed-out homepage.
 *
 * Pulls all active featured sponsors with the homepage_section placement,
 * regardless of league (the public homepage isn't league-aware yet).
 * Renders nothing when empty — never an empty grid as scroll padding.
 *
 * Each logo links to the sponsor's website_url when present, falling back
 * to /sponsors so the visitor can still discover the long-form listing.
 */
export default async function SponsorsSection() {
  const sponsors = await getSponsorsForPlacement('homepage_section');
  if (sponsors.length === 0) return null;

  return (
    <section
      className="px-6 sm:px-10 lg:px-14 py-14 lg:py-16"
      style={{ background: 'var(--ff-cream)' }}
    >
      <div className="max-w-5xl mx-auto">
        <p
          className="font-bold uppercase"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ff-taupe)',
          }}
        >
          Brought to you by
        </p>
        <h2
          className="mt-2.5 leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            color: 'var(--ff-pine)',
          }}
        >
          Our founding sponsors
        </h2>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sponsors.map((s) => {
            const Tile = (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-[color:#e8e2d2] bg-white ff-card px-4 py-6 hover:border-[color:var(--color-gold)]">
                <div className="w-16 h-16 rounded-md bg-[color:#f0ebd8] flex items-center justify-center overflow-hidden">
                  {s.logoUrl ? (
                    <Image
                      src={s.logoUrl}
                      alt={`${s.company ?? s.name} logo`}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="text-xl text-[color:var(--color-mute)]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {(s.company ?? s.name).slice(0, 1)}
                    </span>
                  )}
                </div>
                <p
                  className="text-center text-sm leading-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--ff-pine)' }}
                >
                  {s.company ?? s.name}
                </p>
              </div>
            );
            return s.websiteUrl ? (
              <a
                key={s.sponsorshipId}
                href={s.websiteUrl}
                target="_blank"
                rel="noopener noreferrer external"
              >
                {Tile}
              </a>
            ) : (
              <Link key={s.sponsorshipId} href={`/sponsors`}>
                {Tile}
              </Link>
            );
          })}
        </div>

        <p className="mt-7 text-center">
          <Link
            href="/sponsors"
            className="text-xs tracking-[0.1em] uppercase font-semibold"
            style={{ color: 'var(--ff-gold)' }}
          >
            See all sponsors →
          </Link>
        </p>
      </div>
    </section>
  );
}
