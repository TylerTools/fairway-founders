'use client';

import { useState } from 'react';

export default function EmailDraftActions({
  to,
  subject,
  body,
}: {
  to: string | null;
  subject: string;
  body: string;
  eventId: string;
}) {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={copy}
        className="flex-1 rounded-lg border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] py-2.5 text-xs font-semibold tracking-[0.08em] uppercase"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <a
        href={mailtoUrl}
        className="flex-1 rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2.5 text-xs font-semibold tracking-[0.08em] uppercase text-center"
      >
        ✉ Open in email
      </a>
    </div>
  );
}
