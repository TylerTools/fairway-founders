import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { getSponsorsForPlacement } from '@/lib/sponsorships';
import { getCurrentLeagueId } from '@/lib/league-context';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type MemberLink = Pick<
  Database['public']['Tables']['member_links']['Row'],
  'id' | 'kind' | 'label' | 'url' | 'sort_order' | 'user_id'
>;

/**
 * Public dedicated /sponsors page — the long-form directory for any active
 * featured sponsor with the `sponsors_page` placement.
 *
 * Each sponsor renders as a full ff-card with logo, name, tagline, paragraph
 * bio, city, and their link hub (member_links rows for that user, sorted
 * by sort_order).
 */
export default async function SponsorsPage() {
  const leagueId = (await getCurrentLeagueId()) ?? undefined;
  const sponsors = await getSponsorsForPlacement('sponsors_page', leagueId);

  // Fetch member_links for all sponsor users in one round-trip.
  const userIds = sponsors.map((s) => s.userId);
  let linksByUser = new Map<string, MemberLink[]>();
  if (userIds.length > 0) {
    const res = await supabase
      .from('member_links')
      .select('id, kind, label, url, sort_order, user_id')
      .in('user_id', userIds)
      .order('sort_order', { ascending: true });
    for (const row of res.data ?? []) {
      const list = linksByUser.get(row.user_id) ?? [];
      list.push(row);
      linksByUser.set(row.user_id, list);
    }
  }

  return (
    <main className="px-6 py-12 max-w-md lg:max-w-4xl mx-auto w-full">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Brought to you by
      </p>
      <h1
        className="mt-1 text-4xl leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Our sponsors
      </h1>
      <p className="mt-2 text-sm text-[color:#5a5a4a] max-w-xl">
        The businesses behind the Fairway Founders network. Open a sponsor to
        see what they do and how to reach them.
      </p>

      {sponsors.length === 0 ? (
        <p className="mt-10 text-sm italic text-[color:var(--color-mute)] text-center">
          No sponsors live yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sponsors.map((s) => {
            const links = linksByUser.get(s.userId) ?? [];
            return (
              <article
                key={s.sponsorshipId}
                className="rounded-2xl border border-[color:#e8e2d2] bg-white ff-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-[color:#f0ebd8] flex items-center justify-center overflow-hidden">
                    {s.logoUrl ? (
                      <Image
                        src={s.logoUrl}
                        alt={`${s.company ?? s.name} logo`}
                        width={80}
                        height={80}
                        className="w-20 h-20 object-contain"
                        unoptimized
                      />
                    ) : (
                      <span
                        className="text-3xl text-[color:var(--color-mute)]"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {(s.company ?? s.name).slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xl leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {s.company ?? s.name}
                    </p>
                    {s.company && s.name !== s.company && (
                      <p className="text-xs text-[color:var(--color-mute)] mt-0.5">
                        {s.name}
                      </p>
                    )}
                    {s.tagline && (
                      <p className="mt-2 text-[13px] text-[color:#5a5a4a] leading-snug">
                        {s.tagline}
                      </p>
                    )}
                    {s.city && (
                      <p className="mt-1 text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)]">
                        {s.city}
                      </p>
                    )}
                  </div>
                </div>

                {s.bio && (
                  <p className="mt-4 text-sm text-[color:var(--color-ink)] leading-relaxed whitespace-pre-wrap">
                    {s.bio}
                  </p>
                )}

                {(links.length > 0 || s.websiteUrl) && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.websiteUrl && (
                      <a
                        href={s.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer external"
                        className="rounded-md ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase"
                      >
                        Website →
                      </a>
                    )}
                    {links.map((l) => (
                      <a
                        key={l.id}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer external"
                        className="rounded-md border border-[color:#e8e2d2] bg-white text-[color:var(--color-ink)] px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase hover:border-[color:var(--color-gold)]"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-12 text-center">
        <Link
          href="/"
          className="text-xs tracking-[0.1em] uppercase text-[color:var(--color-gold)]"
        >
          ← Home
        </Link>
      </p>
    </main>
  );
}
