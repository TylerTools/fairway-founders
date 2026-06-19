import { supabase } from './supabase';
import { isResendConfigured, sendEmail } from './resend';
import type { Database } from './database.types';

type EmailRow = Database['public']['Tables']['email_log']['Row'];
type EmailKind = Database['public']['Enums']['email_kind'];

const BATCH = 25;

interface DrainResult {
  attempted: number;
  sent: number;
  failed: number;
  skipped: boolean;
  reason?: string;
}

/**
 * Pull up to BATCH queued rows, try to send each via Resend, mark them sent
 * or failed. Designed to be invoked from a Vercel cron route.
 *
 * When Resend isn't configured, no-ops — rows stay queued until you add the
 * RESEND_API_KEY env var.
 */
export async function drainEmailQueue(): Promise<DrainResult> {
  if (!isResendConfigured()) {
    return { attempted: 0, sent: 0, failed: 0, skipped: true, reason: 'no API key' };
  }

  const queued = await supabase
    .from('email_log')
    .select('id, to_email, subject, body')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(BATCH);

  if (queued.error) {
    return { attempted: 0, sent: 0, failed: 0, skipped: true, reason: queued.error.message };
  }
  const rows = queued.data ?? [];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    // Atomically claim the row before sending so overlapping/retried workers
    // can't double-send. sent_at doubles as the claim token: only one worker
    // can flip a still-queued, unclaimed row.
    const nowIso = new Date().toISOString();
    const claim = await supabase
      .from('email_log')
      .update({ sent_at: nowIso })
      .eq('id', row.id)
      .eq('status', 'queued')
      .is('sent_at', null)
      .select('id');
    if (claim.error || !claim.data || claim.data.length === 0) continue;

    const res = await sendEmail({
      to: row.to_email,
      subject: row.subject,
      body: row.body,
    });
    if (res.ok) {
      const upd = await supabase
        .from('email_log')
        .update({
          status: 'sent',
          resend_id: res.id ?? null,
          error: null,
        })
        .eq('id', row.id);
      if (upd.error) console.error('drainEmailQueue: failed to mark sent', row.id, upd.error.message);
      sent++;
    } else {
      const upd = await supabase
        .from('email_log')
        .update({
          status: 'failed',
          error: res.error ?? 'unknown',
          sent_at: null,
        })
        .eq('id', row.id);
      if (upd.error) console.error('drainEmailQueue: failed to mark failed', row.id, upd.error.message);
      failed++;
    }
  }

  return { attempted: rows.length, sent, failed, skipped: false };
}

// ────────────────────────────────────────────────────────────────
// Transactional queueing helpers
// ────────────────────────────────────────────────────────────────

interface QueueOpts {
  kind: EmailKind;
  toEmail: string;
  toUserId?: string | null;
  subject: string;
  body: string;
  eventId?: string | null;
  sentBy?: string | null;
}

export async function queueEmail(opts: QueueOpts): Promise<void> {
  // Best-effort: callers await this but don't expect it to throw. Log insert
  // errors so a silently-dropped email is at least observable.
  const res = await supabase.from('email_log').insert({
    kind: opts.kind,
    status: 'queued',
    audience: 'one',
    to_email: opts.toEmail,
    to_user_id: opts.toUserId ?? null,
    subject: opts.subject,
    body: opts.body,
    event_id: opts.eventId ?? null,
    sent_by: opts.sentBy ?? null,
  });
  if (res.error) console.error('queueEmail: insert failed', opts.toEmail, res.error.message);
}

export type { EmailRow };
