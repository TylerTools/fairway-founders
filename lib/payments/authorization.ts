import 'server-only';
import { supabase } from '../supabase.ts';
import { isSuperAdmin } from '../auth.ts';
import type { AppUser } from '../current-user.ts';
import type { PurchasableItemRef } from './types.ts';
import type { PricedItem } from './pricing.ts';

export class AuthorizationError extends Error {}

/**
 * Is `me` allowed to pay for this specific item? Checked AFTER pricing so
 * the decision is against the same row that set the price (AC-004).
 *
 *  - sponsorship: only the sponsorship's own member (or a super admin).
 *  - event_rsvp: any active member of the event's league (or super admin) —
 *    the RSVP-specific eligibility rules live with the RSVP flow itself;
 *    this only guards the charge.
 */
export async function assertUserAuthorizedForItem(
  me: AppUser,
  item: PurchasableItemRef,
  priced: PricedItem,
): Promise<void> {
  if (isSuperAdmin(me)) return;

  if (item.kind === 'sponsorship') {
    if (priced.ownerUserId !== me.id) {
      throw new AuthorizationError('You can only pay for your own sponsorship.');
    }
    return;
  }

  const membership = await supabase
    .from('league_memberships')
    .select('id')
    .eq('user_id', me.id)
    .eq('league_id', priced.leagueId)
    .eq('status', 'active')
    .maybeSingle();
  if (!membership.data) {
    throw new AuthorizationError("You're not a member of this event's league.");
  }
}
