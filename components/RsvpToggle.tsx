'use client';

import { useTransition } from 'react';
import { toggleRsvp } from '@/app/actions/rsvp';
import { fmtMoney } from '@/lib/schedule';

export default function RsvpToggle({
  eventId,
  rsvped,
  feeCents,
  disabled,
}: {
  eventId: string;
  rsvped: boolean;
  feeCents: number;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      await toggleRsvp(eventId);
    });
  }

  const label = rsvped
    ? `✓ You're in · ${fmtMoney(feeCents)}`
    : `Tap to RSVP · ${fmtMoney(feeCents)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className={`w-full rounded-lg px-4 py-3.5 text-sm font-semibold tracking-[0.08em] uppercase transition-opacity ${
        rsvped
          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-cream)]'
          : 'bg-[color:var(--color-gold)] text-[color:var(--color-navy)]'
      } ${pending ? 'opacity-60 cursor-wait' : 'hover:opacity-90'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? '…' : label}
    </button>
  );
}
