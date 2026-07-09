'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { attachOrphanToLeague, denyOrphanUser } from '@/app/actions/access';

/** Approve-into-this-league / deny actions for a user who signed up
 *  without going through /join/[slug] and has no membership rows.
 *  Rendered from the "Waiting for a league" section on /admin/access. */
export default function OrphanAccessActions({
  userId,
  leagueId,
  leagueLabel,
  canDeny,
}: {
  userId: string;
  leagueId: string;
  leagueLabel: string;
  canDeny: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await attachOrphanToLeague(userId, leagueId);
      if (!res.ok) setError(res.error ?? 'Could not approve.');
      router.refresh();
    });
  }

  function deny() {
    if (!confirm('Deny this member globally? They will see the denied screen next time they sign in.')) return;
    setError(null);
    startTransition(async () => {
      const res = await denyOrphanUser(userId);
      if (!res.ok) setError(res.error ?? 'Could not deny.');
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
          Approve into {leagueLabel}
        </button>
        {canDeny && (
          <button
            type="button"
            onClick={deny}
            disabled={pending}
            className="rounded-md border border-[color:#a13c3c] text-[color:#a13c3c] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
          >
            Deny
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-[color:#a13c3c]">{error}</p>}
    </div>
  );
}
