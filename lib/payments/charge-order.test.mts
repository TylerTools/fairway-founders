import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chargeOrder } from './charge-order.ts';
import type {
  ChargeOrderInput,
  GatewayCallOutcome,
  GatewayChargeParams,
  OrderRecord,
  PaymentProvider,
  ReconciliationLookup,
} from './types.ts';

/** In-memory fake of the Supabase-backed order repo, mirroring the real
 *  attempt_count / status semantics from order-repo.ts. */
class FakeOrderRepo {
  order: OrderRecord;
  applyCalls: Array<{ outcome: string }> = [];

  constructor(initial: Partial<OrderRecord> = {}) {
    this.order = {
      id: 'order_1',
      idempotencyKey: 'ord_test',
      status: 'pending',
      amountCents: 5000,
      attemptCount: 0,
      transactionId: null,
      ...initial,
    };
  }

  async getOrCreatePendingOrder(): Promise<OrderRecord> {
    return this.order;
  }

  async applyGatewayResult(params: {
    outcome: string;
    transactionId?: string | null;
    responseCode?: string | null;
  }): Promise<OrderRecord> {
    this.applyCalls.push({ outcome: params.outcome });
    const isTerminal = params.outcome !== 'pending_reconciliation';
    this.order = {
      ...this.order,
      status: params.outcome === 'approved' ? 'paid' : isTerminal ? 'failed' : 'pending',
      attemptCount: isTerminal ? this.order.attemptCount + 1 : this.order.attemptCount,
      transactionId: params.transactionId ?? this.order.transactionId,
    };
    return this.order;
  }
}

/** Fake provider: scripted responses per call, in order; records the
 *  orderId (== gatewayOrderId) it was called with each time. */
class FakeProvider implements PaymentProvider {
  authorizeCalls: GatewayChargeParams[] = [];
  findCalls: string[] = [];
  private authorizeScript: GatewayCallOutcome[];
  private findScript: ReconciliationLookup[];

  constructor(opts: { authorize?: GatewayCallOutcome[]; find?: ReconciliationLookup[] }) {
    this.authorizeScript = opts.authorize ?? [];
    this.findScript = opts.find ?? [];
  }

  async authorizeAndCapture(params: GatewayChargeParams): Promise<GatewayCallOutcome> {
    this.authorizeCalls.push(params);
    const next = this.authorizeScript.shift();
    if (!next) throw new Error('FakeProvider.authorizeAndCapture called more times than scripted');
    return next;
  }

  async findByOrderId(orderId: string): Promise<ReconciliationLookup> {
    this.findCalls.push(orderId);
    const next = this.findScript.shift();
    return next ?? { kind: 'not_found' };
  }
}

const BASE_INPUT: ChargeOrderInput = {
  userId: 'user_1',
  leagueId: 'league_1',
  item: { kind: 'sponsorship', sponsorshipId: 'spons_1' },
  amountCents: 5000,
  paymentToken: 'tok_abc',
};

test('approved: a fresh order is submitted once and marked paid', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [
      { kind: 'result', result: { outcome: 'approved', transactionId: 'txn_1', responseCode: '100', message: 'Payment approved.' } },
    ],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'approved');
  assert.equal(result.transactionId, 'txn_1');
  assert.equal(repo.order.status, 'paid');
  assert.equal(repo.order.attemptCount, 1);
  assert.equal(provider.authorizeCalls.length, 1);
});

test('declined: order is marked failed with a safe message', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [
      { kind: 'result', result: { outcome: 'declined', transactionId: 'txn_2', responseCode: '200', message: 'Your card was declined. Please try a different card.' } },
    ],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'declined');
  assert.equal(repo.order.status, 'failed');
  assert.equal(repo.order.attemptCount, 1);
});

test('gateway error: caller gets the generic safe message, never a raw one', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [
      { kind: 'result', result: { outcome: 'error', transactionId: null, responseCode: '300', message: 'Some raw processor text' } },
    ],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'error');
  assert.doesNotMatch(result.message, /raw processor text/i);
  assert.equal(repo.order.status, 'failed');
});

test('timeout then reconciliation finds the transaction: reports approved, does not resubmit', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [{ kind: 'timeout' }],
    find: [
      { kind: 'not_found' }, // pre-submit check: nothing yet, proceed
      { kind: 'found', result: { outcome: 'approved', transactionId: 'txn_3', responseCode: '100', message: 'Payment approved.' } }, // post-timeout reconciliation
    ],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'approved');
  assert.equal(result.transactionId, 'txn_3');
  assert.equal(provider.authorizeCalls.length, 1); // never resubmitted
  assert.equal(repo.order.status, 'paid');
});

test('timeout then ambiguous reconciliation: stays pending, attempt not consumed', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [{ kind: 'timeout' }],
    find: [{ kind: 'not_found' }, { kind: 'ambiguous' }],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'pending_reconciliation');
  assert.equal(repo.order.status, 'pending');
  assert.equal(repo.order.attemptCount, 0); // ambiguous never advances the attempt
});

test('timeout then confirmed not_found: fails safely without ever double-submitting', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [{ kind: 'timeout' }],
    find: [{ kind: 'not_found' }, { kind: 'not_found' }],
  });

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'error');
  assert.equal(repo.order.status, 'failed');
  assert.equal(provider.authorizeCalls.length, 1);
});

test('duplicate/idempotent retry: an already-paid order is never resubmitted', async () => {
  const repo = new FakeOrderRepo({ status: 'paid', attemptCount: 1, transactionId: 'txn_existing' });
  const provider = new FakeProvider({}); // no scripted calls — must not be invoked

  const result = await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });

  assert.equal(result.outcome, 'approved');
  assert.equal(result.transactionId, 'txn_existing');
  assert.equal(provider.authorizeCalls.length, 0);
  assert.equal(provider.findCalls.length, 0);
});

test('retry after a decline uses a fresh attempt key, not the declined one', async () => {
  const repo = new FakeOrderRepo();
  const provider = new FakeProvider({
    authorize: [
      { kind: 'result', result: { outcome: 'declined', transactionId: 'txn_declined', responseCode: '200', message: 'declined' } },
    ],
  });
  await chargeOrder(BASE_INPUT, { provider, orderRepo: repo });
  assert.equal(repo.order.attemptCount, 1);
  const firstAttemptOrderId = provider.authorizeCalls[0].orderId;

  // Second attempt (e.g. a different card) against the same order.
  const provider2 = new FakeProvider({
    authorize: [
      { kind: 'result', result: { outcome: 'approved', transactionId: 'txn_second', responseCode: '100', message: 'approved' } },
    ],
    find: [{ kind: 'not_found' }], // reconcile-before-submit must miss the OLD declined attempt
  });
  const result2 = await chargeOrder(BASE_INPUT, { provider: provider2, orderRepo: repo });

  assert.equal(result2.outcome, 'approved');
  assert.notEqual(provider2.authorizeCalls[0].orderId, firstAttemptOrderId);
  assert.equal(provider2.findCalls[0], provider2.authorizeCalls[0].orderId);
});
