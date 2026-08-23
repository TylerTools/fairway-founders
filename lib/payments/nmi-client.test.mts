import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  centsToDecimalString,
  nmiSale,
  nmiQueryByOrderId,
} from './nmi-client.ts';
import {
  SALE_APPROVED,
  QUERY_FOUND_COMPLETE,
  QUERY_NOT_FOUND,
} from './__fixtures__/nmi-responses.ts';

function fakeFetch(text: string): typeof fetch {
  return (async () => new Response(text, { status: 200 })) as unknown as typeof fetch;
}

function hangingFetch(): typeof fetch {
  return (async (_url: unknown, init?: RequestInit) => {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      });
    });
  }) as unknown as typeof fetch;
}

function throwingFetch(message: string): typeof fetch {
  return (async () => {
    throw new Error(message);
  }) as unknown as typeof fetch;
}

test('centsToDecimalString formats whole and fractional cents', () => {
  assert.equal(centsToDecimalString(1234), '12.34');
  assert.equal(centsToDecimalString(5), '0.05');
  assert.equal(centsToDecimalString(0), '0.00');
  assert.equal(centsToDecimalString(-150), '-1.50');
});

test('nmiSale parses a form-encoded approved response', async () => {
  const outcome = await nmiSale(
    { amountCents: 5000, paymentToken: 'tok_abc', orderId: 'ord_1', orderDescription: 'Test' },
    { securityKey: 'test-key', fetchImpl: fakeFetch(SALE_APPROVED) },
  );
  assert.equal(outcome.kind, 'ok');
  if (outcome.kind === 'ok') {
    assert.equal(outcome.fields.response, '1');
    assert.equal(outcome.fields.transactionid, '3987654321');
  }
});

test('nmiSale surfaces a timeout distinctly from a network error', async () => {
  const timedOut = await nmiSale(
    { amountCents: 100, paymentToken: 't', orderId: 'o', orderDescription: 'd' },
    { securityKey: 'k', timeoutMs: 10, fetchImpl: hangingFetch() },
  );
  assert.equal(timedOut.kind, 'timeout');

  const networkError = await nmiSale(
    { amountCents: 100, paymentToken: 't', orderId: 'o', orderDescription: 'd' },
    { securityKey: 'k', fetchImpl: throwingFetch('DNS lookup failed') },
  );
  assert.equal(networkError.kind, 'network_error');
  if (networkError.kind === 'network_error') {
    assert.match(networkError.message, /DNS lookup failed/);
  }
});

test('nmiQueryByOrderId parses a found transaction', async () => {
  const outcome = await nmiQueryByOrderId('ord_test-attempt-1', {
    securityKey: 'test-key',
    fetchImpl: fakeFetch(QUERY_FOUND_COMPLETE),
  });
  assert.equal(outcome.kind, 'ok');
  if (outcome.kind === 'ok') {
    assert.ok(outcome.result);
    assert.equal(outcome.result?.transactionId, '3987654321');
    assert.equal(outcome.result?.condition, 'complete');
  }
});

test('nmiQueryByOrderId returns null result for an empty/not-found response', async () => {
  const outcome = await nmiQueryByOrderId('ord_never-submitted', {
    securityKey: 'test-key',
    fetchImpl: fakeFetch(QUERY_NOT_FOUND),
  });
  assert.equal(outcome.kind, 'ok');
  if (outcome.kind === 'ok') {
    assert.equal(outcome.result, null);
  }
});

test('nmiQueryByOrderId never throws on garbage XML', async () => {
  const outcome = await nmiQueryByOrderId('ord_x', {
    securityKey: 'k',
    fetchImpl: fakeFetch('<not-xml-at-all'),
  });
  assert.equal(outcome.kind, 'ok');
});
