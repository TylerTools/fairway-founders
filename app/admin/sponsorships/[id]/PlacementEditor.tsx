'use client';

import { useState, useTransition } from 'react';
import { setSponsorshipPlacements } from '@/app/actions/sponsorships';
import {
  ALL_PLACEMENTS,
  PLACEMENT_LABEL,
  PLACEMENT_BLURB,
  type SponsorPlacement,
} from '@/lib/sponsorship-placements';

/**
 * Per-sponsor placement editor. Optimistic checkbox toggles call
 * setSponsorshipPlacements with the full new array; on failure we
 * roll back and surface the error inline.
 */
export default function PlacementEditor({
  id,
  initial,
  status,
}: {
  id: string;
  initial: SponsorPlacement[];
  status: string;
}) {
  const [placements, setPlacements] = useState<Set<SponsorPlacement>>(
    () => new Set(initial),
  );
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const isActive = status === 'active';

  function toggle(p: SponsorPlacement) {
    if (!isActive) return;
    const next = new Set(placements);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    const prev = placements;
    setPlacements(next);
    setErr(null);
    startTransition(async () => {
      const res = await setSponsorshipPlacements(id, [...next]);
      if (!res.ok) {
        setPlacements(prev);
        setErr(res.error ?? 'Could not update.');
      }
    });
  }

  return (
    <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-5">
      <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
        Placements
      </p>
      {!isActive && (
        <p className="mt-2 text-xs text-[color:var(--color-mute)] italic">
          Placements can only be edited while the sponsorship is active.
        </p>
      )}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_PLACEMENTS.map((p) => {
          const checked = placements.has(p);
          return (
            <label
              key={p}
              className={`flex items-start gap-3 rounded-md border px-3 py-2.5 ${
                isActive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
              } ${
                checked
                  ? 'border-[color:var(--color-gold)] bg-[color:#f5f1e8]/40'
                  : 'border-[color:#e8e2d2] bg-white hover:border-[color:var(--color-gold)]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p)}
                disabled={!isActive || pending}
                className="mt-0.5 w-4 h-4 accent-[color:var(--color-navy)]"
              />
              <span className="min-w-0">
                <span className="block text-[12px] font-semibold text-[color:var(--color-ink)] leading-tight">
                  {PLACEMENT_LABEL[p]}
                </span>
                <span className="block mt-0.5 text-[11px] text-[color:#5a5a4a] leading-snug">
                  {PLACEMENT_BLURB[p]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {err && <p className="mt-2 text-xs text-[color:#a13c3c]">{err}</p>}
      {pending && (
        <p className="mt-2 text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
          Saving…
        </p>
      )}
    </div>
  );
}
