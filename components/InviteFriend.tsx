'use client';

import { useMemo, useState } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

export default function InviteFriend({ inviterName }: { inviterName: string }) {
  const first = inviterName.split(' ')[0] || inviterName || 'A founder';

  const subject = `${first} invited you to Fairway Founders`;
  const body = useMemo(
    () =>
      [
        `${first} invited you to Fairway Founders — a private weekly network of founders and operators who tee off in a 9-hole scramble Thursdays at 2:30 PM.`,
        '',
        `Sign up here to request access: ${SITE_URL}`,
      ].join('\n'),
    [first],
  );

  const fullMessage = `${subject}\n\n${body}`;
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById('invite-message') as HTMLTextAreaElement | null;
      el?.select();
    }
  }

  async function share() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: subject, text: body, url: SITE_URL });
        return;
      } catch {
        // user cancelled or unsupported; fall through
      }
    }
    copy();
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4">
      <p className="text-[10px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-gold)]">
        Grow the network
      </p>
      <p className="mt-1 text-sm font-semibold">Invite a friend</p>
      <p className="text-[11px] text-[color:var(--color-mute)] mt-0.5">
        Send the message below. An admin will approve their request.
      </p>

      <div className="mt-3 space-y-2">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576] mb-1">
            Subject
          </p>
          <input
            readOnly
            value={subject}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-[color:#e8e2d2] bg-[color:#f5f1e8]/40 px-3 py-2 text-xs text-[color:var(--color-ink)] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#8a8576] mb-1">
            Message
          </p>
          <textarea
            id="invite-message"
            readOnly
            value={body}
            rows={5}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-md border border-[color:#e8e2d2] bg-[color:#f5f1e8]/40 px-3 py-2 text-xs text-[color:var(--color-ink)] focus:outline-none resize-none"
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <a
          href={mailto}
          className="text-center rounded-md border border-[color:var(--color-gold)] text-[color:var(--color-ink)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase hover:bg-[color:#f5f1e8]/40"
        >
          Email
        </a>
        <button
          type="button"
          onClick={share}
          className="rounded-md border border-[color:var(--color-gold)] text-[color:var(--color-ink)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase hover:bg-[color:#f5f1e8]/40"
        >
          Share
        </button>
      </div>
    </div>
  );
}
