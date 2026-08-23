/**
 * Structured, redacted logging for the payment module. Every log line is
 * one JSON object so it's grep/query-able by `correlationId` or `orderId`
 * across request -> order -> NMI call -> log entries (AC-010).
 *
 * Defense in depth: even though callers should never pass card data in
 * here, any field whose KEY looks sensitive is redacted recursively before
 * it's ever stringified — a mistake upstream can't leak through this.
 */

const SENSITIVE_KEY_PATTERN =
  /card|pan\b|cvv|cvc|track|password|security_key|securitykey|payment_?token/i;

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : redactValue(v);
    }
    return out;
  }
  return value;
}

export interface PaymentLogFields {
  correlationId: string;
  orderId?: string;
  [key: string]: unknown;
}

export function logPaymentEvent(event: string, fields: PaymentLogFields): void {
  const safe = redactValue(fields) as Record<string, unknown>;
  // eslint-disable-next-line no-console -- structured payment audit trail
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...safe }));
}
