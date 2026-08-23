import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NmiProvider } from './provider.ts';
import {
  SALE_APPROVED,
  SALE_DECLINED,
  SALE_ERROR,
  QUERY_FOUND_COMPLETE,
  QUERY_FOUND_FAILED,
  QUERY_NOT_FOUND,
} from './__fixtures__/nmi-responses.ts';

function providerWithFetch(text: string): NmiProvider {
  const fetchImpl = (async () => new Response(text, { status: 200 })) as unknown as typeof fetch;
  return new NmiProvider({ securityKey: 'test-key', fetchImpl });
}

const CHARGE_PARAMS = {
  amountCents: 5000,
  paymentToken: 'tok_abc',
  orderId: 'ord_test-attempt-1',
  orderDescription: 'Test charge',
  correlationId: 'pay_test',
};

test('authorizeAndCapture maps an approved sale', async () => {
  const outcome = await providerWithFetch(SALE_APPROVED).authorizeAndCapture(CHARGE_PARAMS);
  assert.equal(outcome.kind, 'result');
  if (outcome.kind === 'result') {
    assert.equal(outcome.result.outcome, 'approved');
    assert.equal(outcome.result.transactionId, '3987654321');
    assert.doesNotMatch(outcome.result.message, /SUCCESS/); // never the raw responsetext
  }
});

test('authorizeAndCapture maps a declined sale', async () => {
  const outcome = await providerWithFetch(SALE_DECLINED).authorizeAndCapture(CHARGE_PARAMS);
  assert.equal(outcome.kind, 'result');
  if (outcome.kind === 'result') {
    assert.equal(outcome.result.outcome, 'declined');
  }
});

test('authorizeAndCapture maps a gateway error and never leaks the raw reason text', async () => {
  const outcome = await providerWithFetch(SALE_ERROR).authorizeAndCapture(CHARGE_PARAMS);
  assert.equal(outcome.kind, 'result');
  if (outcome.kind === 'result') {
    assert.equal(outcome.result.outcome, 'error');
    assert.doesNotMatch(outcome.result.message, /Invalid Payment Token/i);
  }
});

test('findByOrderId maps a found, settled transaction to approved', async () => {
  const lookup = await providerWithFetch(QUERY_FOUND_COMPLETE).findByOrderId('ord_test-attempt-1');
  assert.equal(lookup.kind, 'found');
  if (lookup.kind === 'found') {
    assert.equal(lookup.result.outcome, 'approved');
    assert.equal(lookup.result.transactionId, '3987654321');
  }
});

test('findByOrderId maps a found, failed transaction to declined', async () => {
  const lookup = await providerWithFetch(QUERY_FOUND_FAILED).findByOrderId('ord_test-attempt-1');
  assert.equal(lookup.kind, 'found');
  if (lookup.kind === 'found') {
    assert.equal(lookup.result.outcome, 'declined');
  }
});

test('findByOrderId reports not_found when the gateway has no record', async () => {
  const lookup = await providerWithFetch(QUERY_NOT_FOUND).findByOrderId('ord_never-submitted');
  assert.equal(lookup.kind, 'not_found');
});

test('findByOrderId reports ambiguous when the query itself cannot be reached', async () => {
  const throwingFetch = (async () => {
    throw new Error('network down');
  }) as unknown as typeof fetch;
  const provider = new NmiProvider({ securityKey: 'k', fetchImpl: throwingFetch });
  const lookup = await provider.findByOrderId('ord_x');
  assert.equal(lookup.kind, 'ambiguous');
});
