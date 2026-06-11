'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestLeagueJoin } from '@/app/actions/access';

/**
 * Surface for signed-in users hitting /join/[slug]. Three states:
 *  - already pending → 'request is with the league admin' microcopy
 *  - already declined → 'previously declined' with a Request again button
 *  - no membership at all → primary 'Request to join' button
 */
export default function JoinExistingLeague({
  leagueId,
  leagueName,
  existingStatus,
}: {
  leagueId: string;
  leagueName: string;
  existingStatus: 'pending' | 'declined' | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(existingStatus === 'pending');

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await requestLeagueJoin(leagueId);
      if (!res.ok) {
        setError(res.error ?? 'Could not request membership.');
        return;
      }
      setRequested(true);
      router.refresh();
    });
  }

  if (requested) {
    return (
      <>
        <p
          className="font-bold uppercase"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--ff-taupe)',
          }}
        >
          Request received
        </p>
        <h2
          className="mt-2.5 mb-3 leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: 'var(--ff-pine)',
          }}
        >
          You&rsquo;re on the list
        </h2>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--ff-ink-soft)',
          }}
        >
          Your request to join {leagueName} is with the league admin. You&rsquo;ll
          get full access here as soon as it&rsquo;s approved.
        </p>
        <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white border border-[color:var(--color-gold)]/40 px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-[color:var(--color-gold)] animate-pulse" />
          <span className="text-[11px] tracking-[0.15em] uppercase font-semibold text-[color:#5a5a4a]">
            Awaiting approval
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <p
        className="font-bold uppercase"
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: 'var(--ff-taupe)',
        }}
      >
        Join {leagueName}
      </p>
      <h2
        className="mt-2.5 mb-3 leading-tight"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          color: 'var(--ff-pine)',
        }}
      >
        {existingStatus === 'declined' ? 'Request again?' : 'Add me to this league'}
      </h2>
      <p
        className="mb-6"
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--ff-ink-soft)',
        }}
      >
        {existingStatus === 'declined'
          ? `Your previous request to ${leagueName} wasn't accepted. You can ask again — the admin will see this as a fresh request.`
          : `You're signed in but not yet a member of ${leagueName}. Request access and a league admin will review.`}
      </p>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-lg ff-btn ff-btn-gold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] px-5 py-3 text-[12px] font-semibold tracking-[0.1em] uppercase disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Request to join'}
      </button>
      {error && (
        <p className="mt-3 text-xs text-[color:#a13c3c]">{error}</p>
      )}
    </>
  );
}
