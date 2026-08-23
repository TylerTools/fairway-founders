/**
 * NMI implementation of the `PaymentProvider` port. Translates the raw
 * transport layer (nmi-client.ts) into the normalized result types
 * charge-order.ts works with, and owns the safe user-facing messages —
 * NMI's own `responsetext` is processor-specific and never forwarded
 * verbatim to the browser (AC-012).
 */
import {
  nmiSale,
  nmiQueryByOrderId,
  type NmiClientConfig,
} from './nmi-client.ts';
import type {
  GatewayCallOutcome,
  GatewayChargeParams,
  GatewayResult,
  PaymentProvider,
  ReconciliationLookup,
} from './types.ts';

const APPROVED_MESSAGE = 'Payment approved.';
const DECLINED_MESSAGE = 'Your card was declined. Please try a different card.';
const ERROR_MESSAGE = 'We could not process your payment. Please try again.';

/** NMI's `response` field: 1 = approved, 2 = declined, 3 = error. Anything
 *  else is treated as an error — we never guess an approval. */
function mapSaleFields(fields: Record<string, string>): GatewayResult {
  const transactionId = fields.transactionid || null;
  const responseCode = fields.response_code || null;
  if (fields.response === '1') {
    return { outcome: 'approved', transactionId, responseCode, message: APPROVED_MESSAGE };
  }
  if (fields.response === '2') {
    return { outcome: 'declined', transactionId, responseCode, message: DECLINED_MESSAGE };
  }
  return { outcome: 'error', transactionId, responseCode, message: ERROR_MESSAGE };
}

/** NMI query.php's `condition` vocabulary for a settled/settling sale vs. a
 *  failed one. Anything unrecognized is deliberately NOT mapped — the
 *  caller treats an unmapped condition as ambiguous rather than guessing. */
function mapCondition(condition: string | null): 'approved' | 'declined' | null {
  if (!condition) return null;
  const normalized = condition.toLowerCase();
  if (normalized === 'complete' || normalized === 'pendingsettlement') return 'approved';
  if (normalized === 'failed') return 'declined';
  return null;
}

export class NmiProvider implements PaymentProvider {
  private readonly config: NmiClientConfig;

  constructor(config: NmiClientConfig) {
    this.config = config;
  }

  async authorizeAndCapture(params: GatewayChargeParams): Promise<GatewayCallOutcome> {
    const outcome = await nmiSale(
      {
        amountCents: params.amountCents,
        paymentToken: params.paymentToken,
        orderId: params.orderId,
        orderDescription: params.orderDescription,
      },
      this.config,
    );
    if (outcome.kind === 'timeout') return { kind: 'timeout' };
    if (outcome.kind === 'network_error') {
      return { kind: 'network_error', message: outcome.message };
    }
    return { kind: 'result', result: mapSaleFields(outcome.fields) };
  }

  async findByOrderId(orderId: string): Promise<ReconciliationLookup> {
    const outcome = await nmiQueryByOrderId(orderId, this.config);
    if (outcome.kind !== 'ok') return { kind: 'ambiguous' };
    if (!outcome.result) return { kind: 'not_found' };

    const mapped = mapCondition(outcome.result.condition);
    if (!mapped) return { kind: 'ambiguous' };

    return {
      kind: 'found',
      result: {
        outcome: mapped,
        transactionId: outcome.result.transactionId,
        responseCode: outcome.result.responseCode,
        message: mapped === 'approved' ? APPROVED_MESSAGE : DECLINED_MESSAGE,
      },
    };
  }
}
