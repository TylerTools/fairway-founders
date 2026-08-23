import 'server-only';
import { supabase } from '../supabase.ts';
import type { PurchasableItemRef } from './types.ts';

/** Safe to show to the member — never leaks schema/internal detail beyond
 *  "this isn't chargeable right now". */
export class PricingError extends Error {}

export interface PricedItem {
  amountCents: number;
  leagueId: string;
  description: string;
  /** Set only for items scoped to a single owning member (sponsorship) —
   *  used by authorization.ts to enforce "pay for your own". */
  ownerUserId?: string;
}

/**
 * Independently loads the authoritative price for an item from Supabase.
 * The client NEVER supplies amount or description — only which item it
 * wants to pay for (AC-003).
 */
export async function loadAuthoritativePrice(item: PurchasableItemRef): Promise<PricedItem> {
  if (item.kind === 'event_rsvp') {
    const res = await supabase
      .from('events')
      .select('fee_cents, course:course_id(league_id, name)')
      .eq('id', item.eventId)
      .maybeSingle();
    if (!res.data) throw new PricingError('Event not found.');
    const course = Array.isArray(res.data.course) ? res.data.course[0] : res.data.course;
    if (!course?.league_id) throw new PricingError('Event has no league.');
    if (!res.data.fee_cents || res.data.fee_cents <= 0) {
      throw new PricingError('This event does not require payment.');
    }
    return {
      amountCents: res.data.fee_cents,
      leagueId: course.league_id,
      description: `Event fee — ${course.name ?? 'round'}`,
    };
  }

  const res = await supabase
    .from('sponsorships')
    .select('amount_cents, status, league_id, user_id')
    .eq('id', item.sponsorshipId)
    .maybeSingle();
  if (!res.data) throw new PricingError('Sponsorship not found.');
  if (res.data.status !== 'active') {
    throw new PricingError('Sponsorship is not approved for payment yet.');
  }
  if (!res.data.amount_cents || res.data.amount_cents <= 0) {
    throw new PricingError('Sponsorship has no price set.');
  }
  if (!res.data.league_id) throw new PricingError('Sponsorship has no league.');
  return {
    amountCents: res.data.amount_cents,
    leagueId: res.data.league_id,
    description: 'Sponsorship',
    ownerUserId: res.data.user_id,
  };
}
