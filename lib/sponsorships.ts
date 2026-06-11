import { supabase } from './supabase';
import { cache } from 'react';
import type { SponsorPlacement } from './sponsorship-placements';

export type { SponsorPlacement };

/** A sponsor as it renders on a public-facing surface. Everything optional
 *  on the user is nullable in the DB; downstream surfaces decide what to
 *  show (logo-only for the homepage; full bio + link hub for /sponsors). */
export interface PlacedSponsor {
  sponsorshipId: string;
  userId: string;
  name: string;
  company: string | null;
  tagline: string | null;
  bio: string | null;
  city: string | null;
  logoUrl: string | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  approvedAt: string | null; // sort key — most recent approval first
}

/**
 * Pull active featured sponsors with the given placement in their array,
 * optionally scoped to a league. Filters out sponsorships whose ends_at has
 * already passed (read-time expiry, no cron needed).
 *
 * Sorted by starts_at desc so a newly-promoted sponsor appears first on
 * whichever surface they were placed on.
 */
export const getSponsorsForPlacement = cache(
  async (
    placement: SponsorPlacement,
    leagueId?: string,
  ): Promise<PlacedSponsor[]> => {
    const nowIso = new Date().toISOString();
    // Postgres GIN index on placements supports the @> containment check;
    // expressed as the `cs` (contains) Postgrest operator.
    let query = supabase
      .from('sponsorships')
      .select(
        `id, starts_at, ends_at, league_id, user_id,
         user:user_id(name, company, tagline, bio, city, logo_url, photo_url, website_url)`,
      )
      .eq('status', 'active')
      .eq('kind', 'featured')
      .contains('placements', [placement])
      .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      .order('starts_at', { ascending: false });

    if (leagueId) {
      // Either explicitly assigned to this league, or league_id is null
      // (legacy / cross-league sponsors fall back to showing everywhere).
      query = query.or(`league_id.eq.${leagueId},league_id.is.null`);
    }

    const res = await query;
    return (res.data ?? []).map((r) => {
      const u = Array.isArray(r.user) ? r.user[0] : r.user;
      return {
        sponsorshipId: r.id,
        userId: r.user_id,
        name: u?.name ?? 'Sponsor',
        company: u?.company ?? null,
        tagline: u?.tagline ?? null,
        bio: u?.bio ?? null,
        city: u?.city ?? null,
        logoUrl: u?.logo_url ?? null,
        photoUrl: u?.photo_url ?? null,
        websiteUrl: u?.website_url ?? null,
        approvedAt: r.starts_at,
      };
    });
  },
);
