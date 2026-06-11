import type { Database } from './database.types';

export type SponsorPlacement = Database['public']['Enums']['sponsor_placement'];

/** The four in-app surfaces an approved featured sponsor can be promoted onto. */
export const ALL_PLACEMENTS: SponsorPlacement[] = [
  'roster_pin',
  'dashboard_strip',
  'homepage_section',
  'sponsors_page',
];

export const PLACEMENT_LABEL: Record<SponsorPlacement, string> = {
  roster_pin: 'Roster pin',
  dashboard_strip: 'Dashboard strip',
  homepage_section: 'Homepage section',
  sponsors_page: 'Sponsors page',
};

export const PLACEMENT_BLURB: Record<SponsorPlacement, string> = {
  roster_pin: 'Pinned to the top of the member directory',
  dashboard_strip: 'Strip on the signed-in member dashboard',
  homepage_section: 'Logo on the signed-out homepage',
  sponsors_page: 'Long-form listing on the dedicated sponsors page',
};
