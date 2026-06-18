'use client';

import { useState, useTransition } from 'react';
import { setCartPartnerRequest } from '@/app/actions/rsvp';

/**
 * Lets an RSVP'd member request to share a cart with another member for this
 * event. Best-effort — the algorithm favors mutual requests strongly and
 * one-way requests gently, but never guarantees a pairing. Flat select per
 * BRAND (inputs stay flat).
 */
export default function CartPartnerPicker({
  eventId,
  current,
  candidates,
}: {
  eventId: string;
  current: string | null;
  candidates: { id: string; name: string }[];
}) {
  const [value, setValue] = useState<string>(current ?? '');
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await setCartPartnerRequest(eventId, next || null);
      if (!res.ok) setValue(prev); // revert on failure
    });
  }

  if (candidates.length === 0) {
    return (
      <p className="text-[11px] text-[color:#a8a596]">
        Cart-partner requests open as others RSVP.
      </p>
    );
  }

  return (
    <div className="text-left">
      <label
        htmlFor="cart-partner"
        className="block text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:#a8a596] mb-1.5"
      >
        Ride with someone? · best-effort
      </label>
      <select
        id="cart-partner"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[color:#e8e2d2] bg-white text-[color:var(--color-ink)] text-sm px-3 py-2 focus:border-[color:var(--color-gold)] focus:outline-none disabled:opacity-60"
      >
        <option value="">No preference</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] text-[color:#a8a596]">
        Best when you both pick each other. Not guaranteed.
      </p>
    </div>
  );
}
