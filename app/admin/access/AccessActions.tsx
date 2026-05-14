'use client';

import { useTransition } from 'react';
import { approveAccess, denyAccess, reopenAccess } from '@/app/actions/access';
import type { Database } from '@/lib/database.types';

type AccessStatus = Database['public']['Enums']['access_status'];

export default function AccessActions({
  userId,
  status,
}: {
  userId: string;
  status: AccessStatus;
}) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(() => approveAccess(userId));
  }
  function deny() {
    if (!confirm('Decline this access request?')) return;
    startTransition(() => denyAccess(userId));
  }
  function reopen() {
    startTransition(() => reopenAccess(userId));
  }

  if (status === 'pending') {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="flex-1 rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={deny}
          disabled={pending}
          className="rounded-md border border-[color:#a13c3c] text-[color:#a13c3c] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Decline
        </button>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <button
        type="button"
        onClick={reopen}
        disabled={pending}
        className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)] disabled:opacity-60"
      >
        Re-open request
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={deny}
      disabled={pending}
      className="text-[11px] tracking-[0.08em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
    >
      Revoke access
    </button>
  );
}
