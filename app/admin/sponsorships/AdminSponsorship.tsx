'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import {
  decideSponsorship,
  type PendingSponsorship,
} from '@/app/actions/sponsorships';

const KIND_LABEL = { featured: 'Featured', round: 'Round sponsor' } as const;

export default function AdminSponsorship({
  initial,
}: {
  initial: PendingSponsorship[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [days, setDays] = useState('30');
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function decide(id: string, approve: boolean) {
    setErr(null);
    setItems((arr) => arr.filter((x) => x.id !== id)); // optimistic
    start(async () => {
      const window = approve ? Math.max(1, parseInt(days, 10) || 30) : undefined;
      const res = await decideSponsorship(id, approve, window);
      if (!res.ok) setErr(res.error ?? 'Something went wrong.');
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm italic text-[color:var(--color-mute)]">
        No pending sponsorship requests.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-[color:var(--color-mute)]">
        <span>Featured window:</span>
        <input
          value={days}
          onChange={(e) => setDays(e.target.value)}
          inputMode="numeric"
          className="w-16 rounded-md px-2 py-1 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
        />
        <span>days</span>
      </div>

      {items.map((s) => (
        <div
          key={s.id}
          className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 flex items-start gap-3"
        >
          <Avatar size={40} photoUrl={s.user.photo_url} rounded="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold flex items-center gap-2">
              {s.user.name}
              <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                {KIND_LABEL[s.kind]}
              </span>
            </p>
            {s.user.company && (
              <p className="text-xs text-[color:var(--color-mute)]">{s.user.company}</p>
            )}
            {s.note && (
              <p className="mt-0.5 text-xs text-[color:#5a5a4a] leading-snug">{s.note}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => decide(s.id, true)}
              className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)]"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => decide(s.id, false)}
              className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[color:var(--color-mute)] hover:text-[color:#a13c3c]"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {err && <p className="text-xs text-[color:#a13c3c]">{err}</p>}
    </div>
  );
}
