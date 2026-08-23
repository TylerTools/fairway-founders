/**
 * Shared types for the NMI payment module. Pure types + the small ports
 * (`PaymentProvider`, `OrderRepo`) the orchestrator in `charge-order.ts`
 * depends on — no Next/Supabase/Clerk imports here, so this file (and
 * everything that only depends on it) stays unit-testable in plain Node.
 */

/** What's being purchased. Deliberately NOT a raw string id + free-text
 *  amount — the server re-derives the price from `kind` + the referenced
 *  row, so a caller can never smuggle in an arbitrary amount/description. */
export type PurchasableItemRef =
  | { kind: 'event_rsvp'; eventId: string }
  | { kind: 'sponsorship'; sponsorshipId: string };

/** Only the two currently-supported transaction outcomes at the gateway,
 *  plus 'error' for anything NMI itself flags as a processing error. Sale
 *  is auth+capture in one step — there is no separate 'authorized' state
 *  and no refund/void/recurring outcome anywhere in this module (AC-011). */
export type GatewayOutcome = 'approved' | 'declined' | 'error';

/** Normalized result of one gateway call or reconciliation lookup. Never
 *  carries anything beyond a safe reference id + a safe, pre-written
 *  message — no raw NMI payload ever flows past this boundary. */
export interface GatewayResult {
  outcome: GatewayOutcome;
  transactionId: string | null;
  responseCode: string | null;
  message: string;
}

export interface GatewayChargeParams {
  amountCents: number;
  /** Tokenized payment method reference (e.g. a Collect.js token) — never
   *  raw PAN/CVV/expiration. */
  paymentToken: string;
  /** Also sent to NMI as `orderid` — the stable per-attempt idempotency key
   *  (see charge-order.ts for how it's derived). */
  orderId: string;
  orderDescription: string;
  correlationId: string;
}

/** Outcome of attempting a gateway call at the transport level — separate
 *  from GatewayOutcome, which only exists once we actually have a result. */
export type GatewayCallOutcome =
  | { kind: 'result'; result: GatewayResult }
  | { kind: 'timeout' }
  | { kind: 'network_error'; message: string };

/** Result of asking the gateway "does a transaction already exist for this
 *  order id?" — the reconciliation path that keeps retries from double
 *  charging. Three-valued on purpose: a confirmed absence ('not_found') is
 *  very different from "we couldn't tell" ('ambiguous'). */
export type ReconciliationLookup =
  | { kind: 'found'; result: GatewayResult }
  | { kind: 'not_found' }
  | { kind: 'ambiguous' };

export interface PaymentProvider {
  authorizeAndCapture(params: GatewayChargeParams): Promise<GatewayCallOutcome>;
  findByOrderId(orderId: string): Promise<ReconciliationLookup>;
}

/** Minimal projection of an `orders` row — just what the orchestrator needs
 *  to decide what to do next. The Supabase-backed repo (order-repo.ts) maps
 *  the full DB row down to this; a test can fake it with a plain object. */
export interface OrderRecord {
  id: string;
  /** Stable per-order key (the DB's `orders.idempotency_key`). The gateway
   *  `orderid` sent per attempt is derived from this + the attempt number —
   *  see charge-order.ts. */
  idempotencyKey: string;
  status: 'pending' | 'paid' | 'failed' | 'other';
  amountCents: number;
  attemptCount: number;
  transactionId: string | null;
}

export interface GetOrCreatePendingOrderParams {
  userId: string;
  leagueId: string;
  item: PurchasableItemRef;
  amountCents: number;
}

export interface ApplyGatewayResultParams {
  order: OrderRecord;
  outcome: GatewayOutcome | 'pending_reconciliation';
  transactionId?: string | null;
  responseCode?: string | null;
  safeFailureMessage?: string | null;
  correlationId: string;
}

export interface OrderRepo {
  getOrCreatePendingOrder(params: GetOrCreatePendingOrderParams): Promise<OrderRecord>;
  applyGatewayResult(params: ApplyGatewayResultParams): Promise<OrderRecord>;
}

export type PaymentOutcome = GatewayOutcome | 'pending_reconciliation';

export interface ChargeOrderDeps {
  provider: PaymentProvider;
  orderRepo: OrderRepo;
}

export interface ChargeOrderInput {
  userId: string;
  leagueId: string;
  item: PurchasableItemRef;
  amountCents: number;
  /** Tokenized payment method reference from the client (e.g. Collect.js) —
   *  never raw card data. */
  paymentToken: string;
  correlationId?: string;
}

/** The only thing that ever reaches app code / the browser. Never the raw
 *  NMI response, a stack trace, or any secret (AC-012). */
export interface SafeChargeResult {
  outcome: PaymentOutcome;
  orderId: string;
  message: string;
  transactionId?: string;
}
