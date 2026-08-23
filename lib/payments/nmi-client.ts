/**
 * Raw HTTP layer for NMI's Direct Post gateway. No Next/Supabase imports —
 * just fetch + parsing, with the transport swappable via `fetchImpl` so
 * unit tests never touch the network.
 *
 * Two endpoints only:
 *  - transact.php — submit a sale (auth + capture in one step).
 *  - query.php    — reconciliation: "does a transaction for this orderid
 *    already exist?" Used before submitting (cheap safety net) and after a
 *    timeout/network error (the actual double-charge guard).
 */

export interface NmiClientConfig {
  /** Private NMI security key. Server-only — the caller is responsible for
   *  sourcing this from a non-NEXT_PUBLIC_ env var; this module never reads
   *  process.env itself so it stays trivially testable. */
  securityKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface NmiSaleParams {
  amountCents: number;
  paymentToken: string;
  orderId: string;
  orderDescription: string;
}

const DEFAULT_BASE_URL = 'https://secure.nmi.com/api';
const DEFAULT_TIMEOUT_MS = 15_000;

type PostOutcome =
  | { kind: 'ok'; text: string }
  | { kind: 'timeout' }
  | { kind: 'network_error'; message: string };

function resolvedConfig(config: NmiClientConfig) {
  return {
    baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    fetchImpl: config.fetchImpl ?? fetch,
  };
}

/** cents -> NMI's plain decimal amount string ("1234" -> "12.34"). Integer
 *  math throughout — no float division of money. */
export function centsToDecimalString(cents: number): string {
  const rounded = Math.round(cents);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

function parseFormEncoded(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of body.trim().split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawValue = eq === -1 ? '' : pair.slice(eq + 1);
    try {
      out[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue.replace(/\+/g, '%20'));
    } catch {
      // Malformed encoding in one pair shouldn't blow up the whole parse.
      out[rawKey] = rawValue;
    }
  }
  return out;
}

async function postForm(
  url: string,
  params: Record<string, string>,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<PostOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      signal: controller.signal,
    });
    const text = await res.text();
    return { kind: 'ok', text };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { kind: 'timeout' };
    }
    return {
      kind: 'network_error',
      message: err instanceof Error ? err.message : 'Unknown network error',
    };
  } finally {
    clearTimeout(timer);
  }
}

export type NmiSaleOutcome =
  | { kind: 'ok'; fields: Record<string, string> }
  | { kind: 'timeout' }
  | { kind: 'network_error'; message: string };

/** Submit a `type=sale` transaction — the only transaction type this module
 *  ever sends (AC-011: no auth-only, refund, void, or recurring calls). */
export async function nmiSale(
  params: NmiSaleParams,
  config: NmiClientConfig,
): Promise<NmiSaleOutcome> {
  const { baseUrl, timeoutMs, fetchImpl } = resolvedConfig(config);
  const outcome = await postForm(
    `${baseUrl}/transact.php`,
    {
      security_key: config.securityKey,
      type: 'sale',
      amount: centsToDecimalString(params.amountCents),
      payment_token: params.paymentToken,
      orderid: params.orderId,
      order_description: params.orderDescription,
    },
    timeoutMs,
    fetchImpl,
  );
  if (outcome.kind !== 'ok') return outcome;
  return { kind: 'ok', fields: parseFormEncoded(outcome.text) };
}

export interface NmiQueryResult {
  transactionId: string | null;
  /** NMI's own vocabulary for a sale's settlement state, e.g. "complete",
   *  "pendingsettlement", "failed". */
  condition: string | null;
  responseCode: string | null;
  orderId: string | null;
}

export type NmiQueryOutcome =
  | { kind: 'ok'; result: NmiQueryResult | null }
  | { kind: 'timeout' }
  | { kind: 'network_error'; message: string };

// query.php responds with XML. NMI's transaction report is a flat structure
// for our purposes, so a couple of targeted tag extractions are enough —
// no XML parser dependency for four fields.
function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i'));
  return match ? match[1].trim() : null;
}

export async function nmiQueryByOrderId(
  orderId: string,
  config: NmiClientConfig,
): Promise<NmiQueryOutcome> {
  const { baseUrl, timeoutMs, fetchImpl } = resolvedConfig(config);
  const outcome = await postForm(
    `${baseUrl}/query.php`,
    { security_key: config.securityKey, order_id: orderId },
    timeoutMs,
    fetchImpl,
  );
  if (outcome.kind !== 'ok') return outcome;

  const xml = outcome.text;
  if (!xml || !/<transaction>/i.test(xml)) {
    return { kind: 'ok', result: null };
  }
  return {
    kind: 'ok',
    result: {
      transactionId: extractTag(xml, 'transaction_id'),
      condition: extractTag(xml, 'condition'),
      responseCode: extractTag(xml, 'response_code'),
      orderId: extractTag(xml, 'order_id'),
    },
  };
}
