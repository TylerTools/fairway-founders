'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://fairwayfounders.org';

const VARIANT: Record<string, string> = {
  secondary:
    'ff-btn ff-btn-secondary bg-white text-[color:var(--color-navy)] border border-[color:var(--color-gold)]',
  pine: 'ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)]',
  gold: 'ff-btn ff-btn-gold bg-[color:var(--color-gold)] text-[color:var(--color-navy)]',
};

/**
 * Standard-styled "Invite a friend" button. Clicking opens a small menu to
 * Text or Email a personal invite (or copy the link). When the member has a
 * referral code + league slug the link is their tracked invite URL
 * (/join/[slug]?ref=CODE) — sign-ups through it are credited + auto-approved.
 *
 * Copy is intentionally generic (no fixed day/time) — events and groups vary.
 */
export default function InviteFriend({
  inviterName,
  referralCode,
  leagueSlug,
  leagueName,
  variant = 'secondary',
}: {
  inviterName: string;
  referralCode?: string | null;
  leagueSlug?: string | null;
  leagueName?: string | null;
  variant?: 'secondary' | 'pine' | 'gold';
}) {
  const first = inviterName.split(' ')[0] || inviterName || 'A founder';
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { subject, message, url, sms, mailto } = useMemo(() => {
    const url =
      referralCode && leagueSlug
        ? `${SITE_URL}/join/${leagueSlug}?ref=${referralCode}`
        : SITE_URL;
    const club = leagueName ?? 'Fairway Founders';
    const subject = `${first} invited you to ${club}`;
    const message = [
      `${first} invited you to join ${club} — a private network of founders and operators who get together for golf and good company.`,
      '',
      `Sign up here: ${url}`,
    ].join('\n');
    const sms = `sms:&body=${encodeURIComponent(message)}`;
    const mailto = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`;
    return { subject, message, url, sms, mailto };
  }, [first, referralCode, leagueSlug, leagueName]);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — no-op
    }
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`rounded-lg px-4 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase ${VARIANT[variant]}`}
      >
        {copied ? 'Link copied' : 'Invite a friend'}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-[color:#e8e2d2] bg-white shadow-lg"
        >
          <a
            href={sms}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs font-semibold tracking-[0.06em] uppercase text-[color:var(--color-navy)] hover:bg-[color:#f5f1e8]/60"
          >
            Text
          </a>
          <a
            href={mailto}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-xs font-semibold tracking-[0.06em] uppercase text-[color:var(--color-navy)] border-t border-[color:#f0ebd8] hover:bg-[color:#f5f1e8]/60"
          >
            Email
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="block w-full text-left px-4 py-2.5 text-xs font-semibold tracking-[0.06em] uppercase text-[color:var(--color-navy)] border-t border-[color:#f0ebd8] hover:bg-[color:#f5f1e8]/60"
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
