import 'server-only';
import { getAppUser } from '../current-user.ts';
import { chargeOrder } from './charge-order.ts';
import { NmiProvider } from './provider.ts';
import { SupabaseOrderRepo } from './order-repo.ts';
import { loadAuthoritativePrice, PricingError } from './pricing.ts';
import { assertUserAuthorizedForItem, AuthorizationError } from './authorization.ts';
import type { PurchasableItemRef, SafeChargeResult } from './types.ts';

function nmiConfig() {
  const securityKey = process.env.NMI_SECURITY_KEY;
  if (!securityKey) {
    throw new Error(
      'NMI_SECURITY_KEY is not set. Configure the private NMI security key in ' +
        'Vercel (server-side env var — never NEXT_PUBLIC_*).',
    );
  }
  return {
    securityKey,
    baseUrl: process.env.NMI_API_BASE_URL || undefined,
    timeoutMs: process.env.NMI_TIMEOUT_MS ? Number(process.env.NMI_TIMEOUT_MS) : undefined,
  };
}

/**
 * The one entry point app code (server actions) should call to charge the
 * signed-in member for a purchasable item.
 *
 * Order of operations matters: resolve the Clerk session -> independently
 * price the item from Supabase -> authorize the caller against that priced
 * item -> only then submit to NMI. `item` is the only thing the caller
 * supplies about WHAT to charge; amount and description always come from
 * this server-side lookup, never from the caller.
 */
export async function chargeCurrentUserForItem(
  item: PurchasableItemRef,
  paymentToken: string,
): Promise<SafeChargeResult> {
  const me = await getAppUser();
  if (!me) throw new AuthorizationError('Sign in required.');

  const priced = await loadAuthoritativePrice(item);
  await assertUserAuthorizedForItem(me, item, priced);

  return chargeOrder(
    {
      userId: me.id,
      leagueId: priced.leagueId,
      item,
      amountCents: priced.amountCents,
      paymentToken,
    },
    {
      provider: new NmiProvider(nmiConfig()),
      orderRepo: new SupabaseOrderRepo(),
    },
  );
}

export { PricingError, AuthorizationError };
export type { PurchasableItemRef, SafeChargeResult } from './types.ts';
