'use client';

import { useState, useTransition } from 'react';
import { runGroupGeneration, clearGroups } from '@/app/actions/groups';

export default function GenerateButton({
  eventId,
  rsvpCount,
  hasFoursomes,
}: {
  eventId: string;
  rsvpCount: number;
  hasFoursomes: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function generate() {
    setMsg(null);
    startTransition(async () => {
      const res = await runGroupGeneration(eventId);
      setMsg(res.ok ? (res.message ?? 'Done.') : `Error: ${res.error}`);
    });
  }

  function clear() {
    if (!confirm('Clear all foursomes for this event?')) return;
    startTransition(async () => {
      await clearGroups(eventId);
      setMsg('Cleared.');
    });
  }

  const disabled = pending || rsvpCount < 2;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={generate}
        disabled={disabled}
        className="w-full rounded-lg bg-[color:var(--color-navy)] text-[color:var(--color-gold)] py-3.5 text-sm font-semibold tracking-[0.08em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? '…' : `⚡ Generate Groups (${rsvpCount} in)`}
      </button>
      {hasFoursomes && (
        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="w-full rounded-lg border border-[color:#a13c3c] text-[color:#a13c3c] py-2 text-[11px] font-semibold tracking-[0.08em] uppercase hover:bg-[color:#a13c3c]/5"
        >
          Clear existing groups
        </button>
      )}
      {msg && <p className="text-xs text-center text-[color:#5a5a4a]">{msg}</p>}
    </div>
  );
}
