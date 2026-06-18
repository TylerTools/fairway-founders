'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { closeRound } from '@/app/actions/round';

/**
 * Admin control to close out the round. A real event is finalized; a test event
 * is wiped (the action redirects back to /admin/test). Two-tap confirm so it's
 * not fired by accident mid-round.
 */
export default function CloseRoundButton({
  eventId,
  isTest,
}: {
  eventId: string;
  isTest: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setError(null);
    startTransition(async () => {
      const res = await closeRound(eventId);
      // Test events redirect away; real events return ok and we refresh to Final.
      if (res && !res.ok) setError(res.error ?? 'Could not close the round.');
      else router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg ff-btn ff-btn-secondary border border-[color:var(--color-gold)] bg-white text-[color:var(--color-navy)] px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase"
      >
        {isTest ? 'End test · wipe' : 'Close round'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[color:#5a5a4a]">
        {isTest ? 'Wipe this test game?' : 'Finalize — lock scores?'}
      </span>
      <button
        type="button"
        onClick={close}
        disabled={pending}
        className="rounded-lg ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-3 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
      >
        {pending ? '…' : isTest ? 'Wipe' : 'Close'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--color-mute)] underline"
      >
        Cancel
      </button>
      {error && <span className="text-[11px] text-[color:#a13c3c]">{error}</span>}
    </div>
  );
}
