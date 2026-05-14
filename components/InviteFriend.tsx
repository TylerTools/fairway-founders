'use client';

import { useState } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

export default function InviteFriend() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — fall back to selection
      const el = document.getElementById('invite-link-input') as HTMLInputElement | null;
      el?.select();
    }
  }

  async function share() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Fairway Founders',
          text: 'Join me at Fairway Founders — Thursdays at 2:30 PM. Sign up here:',
          url: SITE_URL,
        });
        return;
      } catch {
        // user cancelled or share unsupported; fall through to copy
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
        Send them this link. An admin will approve their request.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          id="invite-link-input"
          readOnly
          value={SITE_URL}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-md border border-[color:#e8e2d2] bg-[color:#f5f1e8]/40 px-3 py-2 text-xs text-[color:var(--color-ink)] focus:outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase shrink-0"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={share}
          className="rounded-md border border-[color:var(--color-gold)] text-[color:var(--color-ink)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase shrink-0"
        >
          Share
        </button>
      </div>
    </div>
  );
}
