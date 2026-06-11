'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/Avatar';
import {
  decideSponsorship,
  type PendingSponsorship,
} from '@/app/actions/sponsorships';
import {
  ALL_PLACEMENTS,
  PLACEMENT_LABEL,
  type SponsorPlacement,
} from '@/lib/sponsorship-placements';

const KIND_LABEL = { featured: 'Featured', round: 'Round sponsor' } as const;

interface ApproveDraft {
  windowDays: string;
  placements: Set<SponsorPlacement>;
}

const FRESH_DRAFT = (): ApproveDraft => ({
  windowDays: '30',
  // Default to roster_pin only — matches the historical /roster pin behavior.
  // Admin opts in to additional surfaces.
  placements: new Set<SponsorPlacement>(['roster_pin']),
});

export default function AdminSponsorship({
  initial,
}: {
  initial: PendingSponsorship[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ApproveDraft>(FRESH_DRAFT());
  const [, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function openApprove(id: string) {
    setErr(null);
    setDraft(FRESH_DRAFT());
    setOpenId(id);
  }

  function togglePlacement(p: SponsorPlacement) {
    setDraft((d) => {
      const next = new Set(d.placements);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return { ...d, placements: next };
    });
  }

  function confirmApprove(id: string) {
    setErr(null);
    const window = Math.max(1, parseInt(draft.windowDays, 10) || 30);
    const placements = [...draft.placements];
    setItems((arr) => arr.filter((x) => x.id !== id));
    setOpenId(null);
    start(async () => {
      const res = await decideSponsorship(id, true, window, undefined, placements);
      if (!res.ok) setErr(res.error ?? 'Something went wrong.');
      router.refresh();
    });
  }

  function decline(id: string) {
    setErr(null);
    setItems((arr) => arr.filter((x) => x.id !== id));
    setOpenId(null);
    start(async () => {
      const res = await decideSponsorship(id, false);
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
      {items.map((s) => {
        const isOpen = openId === s.id;
        return (
          <div
            key={s.id}
            className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4"
          >
            <div className="flex items-start gap-3">
              <Avatar size={40} photoUrl={s.user.photo_url} rounded="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                  {s.user.name}
                  <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-navy)] text-[color:var(--color-gold)] rounded-full px-2 py-0.5">
                    {KIND_LABEL[s.kind]}
                  </span>
                </p>
                {s.user.company && (
                  <p className="text-xs text-[color:var(--color-mute)]">
                    {s.user.company}
                  </p>
                )}
                {s.note && (
                  <p className="mt-0.5 text-xs text-[color:#5a5a4a] leading-snug">
                    {s.note}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => (isOpen ? setOpenId(null) : openApprove(s.id))}
                  className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)]"
                >
                  {isOpen ? 'Cancel' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => decline(s.id)}
                  className="rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase text-[color:var(--color-mute)] hover:text-[color:#a13c3c]"
                >
                  Decline
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-4 pt-4 border-t border-[color:#f0ebd8] space-y-4">
                <div>
                  <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                    Featured window
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[color:#5a5a4a]">
                    <input
                      value={draft.windowDays}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, windowDays: e.target.value }))
                      }
                      inputMode="numeric"
                      className="w-20 rounded-md px-2 py-1 text-sm bg-white border border-[color:#e8e2d2] focus:border-[color:var(--color-gold)] focus:outline-none"
                    />
                    <span>days from approval</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
                    Promote to placements
                  </p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALL_PLACEMENTS.map((p) => {
                      const checked = draft.placements.has(p);
                      return (
                        <label
                          key={p}
                          className={`flex items-start gap-2.5 rounded-md border px-3 py-2 cursor-pointer ${
                            checked
                              ? 'border-[color:var(--color-gold)] bg-[color:#f5f1e8]/40'
                              : 'border-[color:#e8e2d2] bg-white hover:border-[color:var(--color-gold)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePlacement(p)}
                            className="mt-0.5 w-4 h-4 accent-[color:var(--color-navy)]"
                          />
                          <span className="text-[12px] text-[color:var(--color-ink)] font-semibold leading-tight">
                            {PLACEMENT_LABEL[p]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] tracking-[0.05em] text-[color:var(--color-mute)] italic">
                    Roster pin matches today&rsquo;s behavior. Tick others to
                    push this sponsor onto the dashboard, homepage, and / or
                    sponsors page.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(null)}
                    className="text-[11px] tracking-[0.06em] uppercase font-semibold text-[color:var(--color-mute)] px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmApprove(s.id)}
                    disabled={draft.placements.size === 0}
                    className="rounded-md px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase ff-btn ff-btn-gold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] disabled:opacity-50"
                  >
                    Approve & promote
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {err && <p className="text-xs text-[color:#a13c3c]">{err}</p>}
    </div>
  );
}
