'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveMembership, declineMembership } from '@/app/actions/access';

/** Approve / decline a pending league_memberships row.
 *  Action surface is only rendered for status='pending' rows; active +
 *  declined rows are displayed read-only in the queue. */
export default function AccessActions({
  membershipId,
}: {
  membershipId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await approveMembership(membershipId);
      if (!res.ok) setError(res.error ?? 'Could not approve.');
      router.refresh();
    });
  }
  function decline() {
    if (!confirm('Decline this access request?')) return;
    setError(null);
    startTransition(async () => {
      const res = await declineMembership(membershipId);
      if (!res.ok) setError(res.error ?? 'Could not decline.');
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="flex-1 rounded-md ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={decline}
          disabled={pending}
          className="rounded-md border border-[color:#a13c3c] text-[color:#a13c3c] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Decline
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-[color:#a13c3c]">{error}</p>}
    </div>
  );
}
