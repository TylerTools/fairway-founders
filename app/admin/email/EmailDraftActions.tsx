'use client';

import { useState, useTransition } from 'react';
import { queueProShopEmail } from '@/app/actions/email';

export default function EmailDraftActions({
  to,
  subject,
  body,
  eventId,
}: {
  to: string | null;
  subject: string;
  body: string;
  eventId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();

  const mailtoUrl = `mailto:${encodeURIComponent(
    to ?? '',
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function copy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(
      `To: ${to ?? ''}\nSubject: ${subject}\n\n${body}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function queueSend() {
    if (!to) {
      setError('No pro-shop email set on the event.');
      return;
    }
    setError(null);
    startSend(async () => {
      const res = await queueProShopEmail({ to, subject, body, eventId });
      if (res.ok) {
        setQueued(true);
        setTimeout(() => setQueued(false), 3000);
      } else {
        setError(res.error ?? 'Failed to queue.');
      }
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="flex-1 rounded-lg border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] py-2.5 text-xs font-semibold tracking-[0.08em] uppercase"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <a
          href={mailtoUrl}
          className="flex-1 rounded-lg border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] py-2.5 text-xs font-semibold tracking-[0.08em] uppercase text-center"
        >
          ✉ Open in email
        </a>
      </div>
      <button
        type="button"
        onClick={queueSend}
        disabled={sending || !to}
        className="w-full rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2.5 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
      >
        {queued
          ? '✓ Queued for send'
          : sending
            ? 'Queuing…'
            : '→ Queue & send via Resend'}
      </button>
      {error && (
        <p className="text-xs text-[color:#a13c3c] text-center">{error}</p>
      )}
    </div>
  );
}
