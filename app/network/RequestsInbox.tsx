'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import { FourIcon, LinkIcon, BirdieIcon } from '@/components/InteractionIcons';
import {
  respondToInteraction,
  type PendingRequest,
  type InteractionKind,
} from '@/app/actions/interactions';

const KIND_META: Record<
  InteractionKind,
  { label: string; Icon: typeof FourIcon; verb: string }
> = {
  four: { label: 'Four', Icon: FourIcon, verb: 'threw you a Four' },
  link: { label: 'Link', Icon: LinkIcon, verb: 'wants to log a 1:1 Link' },
  birdie: { label: 'Birdie', Icon: BirdieIcon, verb: 'wants to log closed business' },
};

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function RequestsInbox({ initial }: { initial: PendingRequest[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function respond(id: string, accept: boolean) {
    setErr(null);
    setItems((arr) => arr.filter((x) => x.id !== id)); // optimistic
    start(async () => {
      const res = await respondToInteraction(id, accept);
      if (!res.ok) setErr(res.error ?? 'Something went wrong.');
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm italic text-[color:var(--color-mute)]">
        Nothing to confirm right now. When someone throws you a Four, logs a Link, or
        a Birdie, it shows up here for you to accept.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const meta = KIND_META[r.kind];
        const Icon = meta.Icon;
        return (
          <div
            key={r.id}
            className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 flex items-start gap-3"
          >
            <Avatar size={40} photoUrl={r.from.photo_url} rounded="xl" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Icon size={14} className="text-[color:var(--color-gold)]" />
                {r.from.name} {meta.verb}
                {r.kind === 'birdie' && r.value_cents != null && (
                  <span className="text-[color:var(--color-gold)]">· {money(r.value_cents)}</span>
                )}
              </p>
              {r.note && (
                <p className="mt-0.5 text-xs text-[color:#5a5a4a] leading-snug">{r.note}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => respond(r.id, true)}
                className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)]"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond(r.id, false)}
                className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[color:var(--color-mute)] hover:text-[color:#a13c3c]"
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
      {err && <p className="text-xs text-[color:#a13c3c]">{err}</p>}
    </div>
  );
}
