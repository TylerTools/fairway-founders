'use client';

import { useMemo, useRef } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

export default function InviteFriend({ inviterName }: { inviterName: string }) {
  const first = inviterName.split(' ')[0] || inviterName || 'A founder';

  const { subject, body, mailto } = useMemo(() => {
    const subject = `${first} invited you to Fairway Founders`;
    const body = [
      `${first} invited you to Fairway Founders — a weekly network of founders and operators who tee off in a 9-hole scramble Thursdays at 2:30 PM.`,
      '',
      `Sign up here to request access: ${SITE_URL}`,
    ].join('\n');
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { subject, body, mailto };
  }, [first]);

  const linkRef = useRef<HTMLAnchorElement | null>(null);

  async function onClick() {
    // Prefer the native share sheet on mobile (one tap to pick a contact).
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: subject, text: body, url: SITE_URL });
        return;
      } catch {
        // User cancelled or share unsupported — fall through to mailto.
      }
    }
    linkRef.current?.click();
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold)] bg-white text-[color:var(--color-ink)] px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase hover:bg-[color:#f5f1e8]/40"
      >
        + Invite a friend
      </button>
      {/* Hidden anchor used as the mailto fallback when Web Share isn't
          available (most desktop browsers). */}
      <a ref={linkRef} href={mailto} className="hidden" aria-hidden tabIndex={-1}>
        invite
      </a>
    </>
  );
}
