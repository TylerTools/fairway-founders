/**
 * The orchestrator: given an order (already priced + authorized by the
 * caller — see index.ts) and a tokenized payment method, submit exactly
 * one gateway attempt and never let a timeout/network error turn into a
 * second charge.
 *
 * No Next/Supabase/Clerk imports — `provider` and `orderRepo` are injected,
 * so this whole file (the part with the actual money-safety logic) is unit
 * testable with fakes, in plain Node, with no network or database.
 *
 * Idempotency key design: `orders.idempotency_key` is stable for the life
 * of the order, but the value sent to NMI as `orderid` per attempt is
 * `${idempotencyKey}:${attemptNumber}`. That matters: if attempt 1 is
 * declined, attempt 2 (e.g. a different card) must NOT reconcile against
 * attempt 1's declined transaction and short-circuit forever — it gets its
 * own key. But retries of the SAME in-flight attempt (a timeout/ambiguous
 * outcome, where we never learned whether NMI actually processed it) reuse
 * that attempt's key, so reconciliation always finds it instead of
 * resubmitting. `attemptCount` only advances once an attempt reaches a
 * terminal outcome (approved/declined/error) — an ambiguous outcome leaves
 * it unchanged on purpose, so the next call resumes the same attempt.
 */
import type {
  ApplyGatewayResultParams,
  ChargeOrderDeps,
  ChargeOrderInput,
  GatewayOutcome,
  OrderRecord,
  PurchasableItemRef,
  SafeChargeResult,
} from './types.ts';
import { logPaymentEvent } from './redact.ts';

export type { ChargeOrderDeps, ChargeOrderInput } from './types.ts';

const GENERIC_ERROR_MESSAGE = 'We could not process your payment. Please try again in a moment.';
const PENDING_RECONCILIATION_MESSAGE =
  'Your payment is still being confirmed. Check back shortly before trying a new charge.';
const ALREADY_PAID_MESSAGE = 'Payment already completed.';

function attemptOrderId(order: OrderRecord): string {
  return `${order.idempotencyKey}:${order.attemptCount + 1}`;
}

function describeItem(item: PurchasableItemRef): string {
  return item.kind === 'sponsorship'
    ? `Sponsorship ${item.sponsorshipId}`
    : `Event fee ${item.eventId}`;
}

function toSafeResult(
  orderId: string,
  outcome: GatewayOutcome,
  message: string,
  transactionId?: string | null,
): SafeChargeResult {
  return {
    outcome,
    orderId,
    // Never forward an unmapped/raw message for a gateway 'error' — only
    // 'approved'/'declined' carry pre-written, safe-to-show text.
    message: outcome === 'error' ? GENERIC_ERROR_MESSAGE : message,
    transactionId: transactionId ?? undefined,
  };
}

export async function chargeOrder(
  input: ChargeOrderInput,
  deps: ChargeOrderDeps,
): Promise<SafeChargeResult> {
  const correlationId = input.correlationId ?? `pay_${crypto.randomUUID()}`;

  const order = await deps.orderRepo.getOrCreatePendingOrder({
    userId: input.userId,
    leagueId: input.leagueId,
    item: input.item,
    amountCents: input.amountCents,
  });

  logPaymentEvent('charge_order.start', {
    correlationId,
    orderId: order.id,
    status: order.status,
    attemptCount: order.attemptCount,
  });

  if (order.status === 'paid') {
    // Never re-submit an order that's already settled.
    return {
      outcome: 'approved',
      orderId: order.id,
      message: ALREADY_PAID_MESSAGE,
      transactionId: order.transactionId ?? undefined,
    };
  }

  const gatewayOrderId = attemptOrderId(order);

  const apply = (params: Omit<ApplyGatewayResultParams, 'order' | 'correlationId'>) =>
    deps.orderRepo.applyGatewayResult({ ...params, order, correlationId });

  // Reconcile-first: if this exact attempt already reached NMI (we crashed
  // or timed out on a previous call before persisting the result), find
  // that outcome instead of submitting a second charge under the same key.
  const priorAttempt = await deps.provider.findByOrderId(gatewayOrderId);
  if (priorAttempt.kind === 'found') {
    const applied = await apply({
      outcome: priorAttempt.result.outcome,
      transactionId: priorAttempt.result.transactionId,
      responseCode: priorAttempt.result.responseCode,
      safeFailureMessage: priorAttempt.result.outcome === 'approved' ? null : priorAttempt.result.message,
    });
    logPaymentEvent('charge_order.reconciled_before_submit', {
      correlationId,
      orderId: order.id,
      outcome: priorAttempt.result.outcome,
    });
    return toSafeResult(applied.id, priorAttempt.result.outcome, priorAttempt.result.message, priorAttempt.result.transactionId);
  }

  const callOutcome = await deps.provider.authorizeAndCapture({
    amountCents: order.amountCents,
    paymentToken: input.paymentToken,
    orderId: gatewayOrderId,
    orderDescription: describeItem(input.item),
    correlationId,
  });

  if (callOutcome.kind === 'result') {
    const { result } = callOutcome;
    const applied = await apply({
      outcome: result.outcome,
      transactionId: result.transactionId,
      responseCode: result.responseCode,
      safeFailureMessage: result.outcome === 'approved' ? null : result.message,
    });
    logPaymentEvent('charge_order.submitted', {
      correlationId,
      orderId: order.id,
      outcome: result.outcome,
    });
    return toSafeResult(applied.id, result.outcome, result.message, result.transactionId);
  }

  // Timeout or network error: we genuinely don't know if NMI received the
  // sale. Never resubmit blindly — reconcile by the same gatewayOrderId.
  logPaymentEvent('charge_order.submit_ambiguous', {
    correlationId,
    orderId: order.id,
    reason: callOutcome.kind,
  });

  const reconciled = await deps.provider.findByOrderId(gatewayOrderId);

  if (reconciled.kind === 'found') {
    const applied = await apply({
      outcome: reconciled.result.outcome,
      transactionId: reconciled.result.transactionId,
      responseCode: reconciled.result.responseCode,
      safeFailureMessage: reconciled.result.outcome === 'approved' ? null : reconciled.result.message,
    });
    logPaymentEvent('charge_order.reconciled_after_ambiguous', {
      correlationId,
      orderId: order.id,
      outcome: reconciled.result.outcome,
    });
    return toSafeResult(applied.id, reconciled.result.outcome, reconciled.result.message, reconciled.result.transactionId);
  }

  if (reconciled.kind === 'not_found') {
    // NMI has no record under this key — the sale never landed. Safe to
    // conclude this attempt failed (a future retry gets a fresh attempt
    // number/key); this is NOT "maybe charged, maybe not".
    const applied = await apply({
      outcome: 'error',
      safeFailureMessage: 'Gateway unreachable; no transaction was recorded.',
    });
    logPaymentEvent('charge_order.confirmed_not_submitted', { correlationId, orderId: order.id });
    return toSafeResult(applied.id, 'error', GENERIC_ERROR_MESSAGE, null);
  }

  // Reconciliation itself was inconclusive. Leave the order pending under
  // the SAME attempt (attempt_count untouched) so the next call — manual
  // retry or a reconciliation job — resumes this exact attempt rather than
  // minting a new charge.
  await apply({ outcome: 'pending_reconciliation', safeFailureMessage: 'Reconciliation pending.' });
  logPaymentEvent('charge_order.pending_reconciliation', { correlationId, orderId: order.id });
  return {
    outcome: 'pending_reconciliation',
    orderId: order.id,
    message: PENDING_RECONCILIATION_MESSAGE,
  };
}
