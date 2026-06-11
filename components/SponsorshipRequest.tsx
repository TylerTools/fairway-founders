'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  requestSponsorship,
  type MySponsorship,
  type SponsorshipKind,
} from '@/app/actions/sponsorships';

const KIND_LABEL: Record<SponsorshipKind, string> = {
  featured: 'Featured listing',
  round: 'Round sponsor',
};

export default function SponsorshipRequest({
  current,
}: {
  current: MySponsorship | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const showStatus =
    current && (current.status === 'requested' || current.status === 'active');

  function req(kind: SponsorshipKind) {
    setMsg(null);
    start(async () => {
      const res = await requestSponsorship(kind);
      setMsg(res.ok ? 'Request sent — an admin will review it.' : res.error ?? 'Failed.');
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Sponsorship
      </p>

      {showStatus ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
            {KIND_LABEL[current!.kind]}
          </span>
          <span className="text-xs text-[color:var(--color-mute)]">
            {current!.status === 'active'
              ? current!.ends_at
                ? `Active until ${new Date(current!.ends_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}`
                : 'Active'
              : 'Requested — pending admin review'}
          </span>
        </div>
      ) : (
        <>
          <p className="mt-1 text-xs text-[color:var(--color-mute)] leading-relaxed">
            Get pinned to the top of the directory with a featured badge, or sponsor a
            round for the league. An admin confirms it — no payment online.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => req('featured')}
              disabled={pending}
              className="rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] disabled:opacity-60"
            >
              Request featured
            </button>
            <button
              type="button"
              onClick={() => req('round')}
              disabled={pending}
              className="rounded-md px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase border border-[color:var(--color-gold)] text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8] disabled:opacity-60"
            >
              Sponsor a round
            </button>
          </div>
          {msg && <p className="mt-2 text-[11px] text-[color:var(--color-mute)]">{msg}</p>}
        </>
      )}
    </div>
  );
}
