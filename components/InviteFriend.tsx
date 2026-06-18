'use client';

import { useMemo, useRef, useState } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

/**
 * Share a personal invite. When the member has a referral code + a league
 * slug, the link is their tracked invite URL (/join/[slug]?ref=CODE) — friends
 * who sign up through it are attributed to the inviter and auto-approved. Falls
 * back to the bare site URL if a code isn't available yet.
 *
 * Tries the native share sheet first (one tap to Messages on mobile — the
 * "text a friend" path); on desktop it copies the link to the clipboard.
 */
export default function InviteFriend({
  inviterName,
  referralCode,
  leagueSlug,
}: {
  inviterName: string;
  referralCode?: string | null;
  leagueSlug?: string | null;
}) {
  const first = inviterName.split(' ')[0] || inviterName || 'A founder';
  const [copied, setCopied] = useState(false);

  const { subject, body, url } = useMemo(() => {
    const url =
      referralCode && leagueSlug
        ? `${SITE_URL}/join/${leagueSlug}?ref=${referralCode}`
        : SITE_URL;
    const subject = `${first} invited you to Fairway Founders`;
    const body = [
      `${first} invited you to Fairway Founders — a weekly network of founders and operators who tee off in a 9-hole scramble Thursdays at 2:30 PM.`,
      '',
      `Sign up here: ${url}`,
    ].join('\n');
    return { subject, body, url };
  }, [first, referralCode, leagueSlug]);

  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const mailto = `mailto:?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  async function onClick() {
    // Native share sheet — on mobile this includes Messages (the text path).
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: subject, text: body, url });
        return;
      } catch {
        // cancelled or unsupported — fall through
      }
    }
    // Desktop: copy the link so they can paste it into a text/email.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // clipboard blocked — fall through to mailto
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
        {copied ? 'Link copied' : '+ Invite a friend'}
      </button>
      {/* Hidden anchor used as the mailto fallback when Web Share and the
          clipboard are both unavailable. */}
      <a ref={linkRef} href={mailto} className="hidden" aria-hidden tabIndex={-1}>
        invite
      </a>
    </>
  );
}
