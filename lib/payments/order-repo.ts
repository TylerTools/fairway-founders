import 'server-only';
import { supabase } from '../supabase.ts';
import type { Database, Json } from '../database.types.ts';
import type {
  ApplyGatewayResultParams,
  GetOrCreatePendingOrderParams,
  OrderRecord,
  OrderRepo,
} from './types.ts';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

function toOrderRecord(row: OrderRow): OrderRecord {
  const status: OrderRecord['status'] =
    row.status === 'pending' || row.status === 'paid' || row.status === 'failed'
      ? row.status
      : 'other'; // authorized/refunded/partially_refunded/comped never happen here (AC-011)
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    status,
    amountCents: row.amount_cents,
    attemptCount: row.attempt_count,
    transactionId: row.nmi_transaction_id,
  };
}

function newIdempotencyKey(): string {
  return `ord_${crypto.randomUUID()}`;
}

async function recordAuditEvent(params: {
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string;
  actorUserId?: string | null;
  metadata?: Record<string, Json>;
}): Promise<void> {
  await supabase.from('order_audit_events').insert({
    order_id: params.orderId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    actor_type: 'system',
    actor_user_id: params.actorUserId ?? null,
    reason: params.reason,
    metadata: params.metadata ?? {},
  });
}

/**
 * Supabase-backed `OrderRepo`. Every write here is service-role (RLS is
 * default-deny; this module IS the trust boundary, same pattern as
 * lib/auth.ts's require* guards) and every state transition is mirrored
 * into `order_audit_events` — no card data ever enters either table.
 *
 * Known limitation: the pending-order lookup + insert below is a plain
 * select-then-insert, not a single atomic upsert, so two concurrent charge
 * attempts for the same (user, item) could in principle both insert a
 * pending order. Acceptable for now (a double-click retry, not a security
 * issue — worst case is a second $0-progress pending row); a unique partial
 * index + upsert is the natural follow-up if it shows up in practice.
 */
export class SupabaseOrderRepo implements OrderRepo {
  async getOrCreatePendingOrder(params: GetOrCreatePendingOrderParams): Promise<OrderRecord> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', params.userId)
      .eq('order_type', params.item.kind)
      .eq('status', 'pending');

    query =
      params.item.kind === 'sponsorship'
        ? query.eq('sponsorship_id', params.item.sponsorshipId)
        : query.eq('league_id', params.leagueId).is('rsvp_id', null);

    const existing = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (existing.data) {
      if (existing.data.amount_cents !== params.amountCents) {
        // Price moved under a still-open order (e.g. admin re-priced a
        // sponsorship) — refuse to silently charge a different amount than
        // what this order was created for.
        throw new Error('Price changed since this order was created. Please retry.');
      }
      return toOrderRecord(existing.data);
    }

    const insert: Database['public']['Tables']['orders']['Insert'] = {
      user_id: params.userId,
      league_id: params.leagueId,
      order_type: params.item.kind,
      sponsorship_id: params.item.kind === 'sponsorship' ? params.item.sponsorshipId : null,
      amount_cents: params.amountCents,
      idempotency_key: newIdempotencyKey(),
      status: 'pending',
    };
    const created = await supabase.from('orders').insert(insert).select('*').single();
    if (created.error || !created.data) {
      throw new Error(created.error?.message ?? 'Failed to create order.');
    }
    await recordAuditEvent({
      orderId: created.data.id,
      fromStatus: null,
      toStatus: 'pending',
      reason: 'order_created',
      actorUserId: params.userId,
    });
    return toOrderRecord(created.data);
  }

  async applyGatewayResult(params: ApplyGatewayResultParams): Promise<OrderRecord> {
    const isTerminal = params.outcome !== 'pending_reconciliation';
    const toStatus: OrderStatus =
      params.outcome === 'approved' ? 'paid' : isTerminal ? 'failed' : 'pending';

    const update: Database['public']['Tables']['orders']['Update'] = {
      status: toStatus,
      // Only a terminal outcome (approved/declined/error) counts as a
      // concluded attempt — 'pending_reconciliation' leaves attempt_count
      // untouched so a retry resumes this same attempt/idempotency key.
      attempt_count: isTerminal ? params.order.attemptCount + 1 : params.order.attemptCount,
      nmi_transaction_id: params.transactionId ?? undefined,
      last_failure_code: params.outcome === 'approved' ? null : (params.responseCode ?? undefined),
      last_failure_message:
        params.outcome === 'approved' ? null : (params.safeFailureMessage ?? undefined),
      updated_at: new Date().toISOString(),
    };

    const updated = await supabase
      .from('orders')
      .update(update)
      .eq('id', params.order.id)
      .select('*')
      .single();
    if (updated.error || !updated.data) {
      throw new Error(updated.error?.message ?? 'Failed to update order.');
    }

    await recordAuditEvent({
      orderId: params.order.id,
      fromStatus: params.order.status === 'other' ? null : params.order.status,
      toStatus,
      reason: params.outcome,
      metadata: {
        correlationId: params.correlationId,
        responseCode: params.responseCode ?? null,
      },
    });

    return toOrderRecord(updated.data);
  }
}
