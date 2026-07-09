'use client';

import { useState, useTransition } from 'react';
import {
  swapPlayers,
  movePlayer,
  addEmptyGroup,
  deleteGroup,
} from '@/app/actions/groups';
import { lastName } from '@/lib/schedule';

export interface AdminFoursomePayload {
  id: string;
  hole: number;
  tier: 'A' | 'B' | 'C';
  group_index: number;
  carts: {
    cart_number: number;
    members: { id: string; name: string; professional_role: string | null }[];
  }[];
}

export default function AdminFoursomes({
  eventId,
  foursomes,
}: {
  eventId: string;
  foursomes: AdminFoursomePayload[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = selectedId
    ? foursomes
        .flatMap((f) =>
          f.carts.flatMap((c) =>
            c.members.map((m) => ({ ...m, foursomeId: f.id })),
          ),
        )
        .find((m) => m.id === selectedId)
    : null;
  const selectedName = selected?.name ?? null;

  function onTap(id: string) {
    setError(null);
    if (!selectedId) {
      setSelectedId(id);
      return;
    }
    if (selectedId === id) {
      setSelectedId(null);
      return;
    }
    const a = selectedId;
    const b = id;
    setSelectedId(null);
    startTransition(async () => {
      const res = await swapPlayers(eventId, a, b);
      if (!res.ok) setError(res.error ?? 'Swap failed.');
    });
  }

  function onMoveHere(destFoursomeId: string) {
    if (!selectedId) return;
    const userId = selectedId;
    setSelectedId(null);
    setError(null);
    startTransition(async () => {
      const res = await movePlayer(eventId, userId, destFoursomeId);
      if (!res.ok) setError(res.error ?? 'Move failed.');
    });
  }

  function onAddGroup() {
    setError(null);
    startTransition(async () => {
      const res = await addEmptyGroup(eventId);
      if (!res.ok) setError(res.error ?? 'Could not add a group.');
    });
  }

  function onDeleteGroup(foursomeId: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteGroup(eventId, foursomeId);
      if (!res.ok) setError(res.error ?? 'Could not delete group.');
    });
  }

  return (
    <div>
      {selectedName && (
        <div className="rounded-xl border border-[color:var(--color-gold)] bg-[#fff8e8] p-3 mb-3 flex items-center justify-between gap-3">
          <div className="text-xs">
            Swap mode · tap another player to swap with{' '}
            <strong>{selectedName}</strong>, or tap{' '}
            <em className="italic">Move here</em> on another group.
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-[10px] tracking-[0.08em] uppercase font-semibold border border-[color:#a87c4f] text-[color:#a87c4f] rounded-md px-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-xs text-[color:#a13c3c] mb-2">{error}</p>}
      <p className="text-[11px] text-[color:var(--color-mute)] mb-2 text-center italic">
        Tap a player to start a swap, tap a second player to complete it.
      </p>
      <div className="space-y-2.5">
        {foursomes.map((f) => {
          const isEmpty = f.carts.length === 0;
          const isSourceOfSelected = selected?.foursomeId === f.id;
          const showMoveHere = !!selectedId && !isSourceOfSelected;
          return (
            <div
              key={f.id}
              className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card overflow-hidden"
            >
              <div className="bg-[color:var(--color-navy)] text-[color:var(--color-cream)] px-4 py-2.5 flex justify-between items-center">
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Group {f.group_index + 1}
                </p>
                <p className="text-[10px] font-bold tracking-[0.1em] text-[color:var(--color-gold)]">
                  HOLE {f.hole}
                  {f.tier !== 'A' ? ` · TIER ${f.tier}` : ''}
                </p>
              </div>
              {isEmpty ? (
                <div className="px-4 py-3 text-[11px] text-[color:var(--color-mute)] italic flex items-center justify-between gap-3">
                  <span>Empty group — waiting for players.</span>
                  <button
                    type="button"
                    onClick={() => onDeleteGroup(f.id)}
                    disabled={pending}
                    className="text-[10px] tracking-[0.08em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                f.carts.map((cart, ci) => (
                  <div key={cart.cart_number}>
                    <div
                      className={`px-4 py-1.5 bg-[color:var(--color-cream)] text-[10px] font-bold tracking-[0.15em] text-[color:#5a5a4a] flex justify-between ${
                        ci > 0 ? 'border-t border-[color:#e8e2d2]' : ''
                      }`}
                    >
                      <span>CART {cart.cart_number}</span>
                      {cart.members.length === 1 && (
                        <span className="italic font-normal tracking-normal normal-case text-[color:var(--color-mute)]">
                          solo
                        </span>
                      )}
                    </div>
                    {cart.members.map((m) => {
                      const isSel = selectedId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onTap(m.id)}
                          disabled={pending}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 border-t border-[color:#f0ebd8] text-left disabled:opacity-60 ${
                            isSel
                              ? 'bg-[#fff8e8] shadow-[inset_3px_0_0_var(--color-gold)]'
                              : 'hover:bg-[color:#f5f1e8]/40'
                          }`}
                        >
                          <span className="text-sm font-medium flex-1">
                            {m.name}
                            {isSel && (
                              <span className="text-[color:#a87c4f] font-semibold ml-1.5">
                                · selected
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-[color:var(--color-mute)] uppercase tracking-[0.08em]">
                            {lastName(m.name)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
              {showMoveHere && (
                <button
                  type="button"
                  onClick={() => onMoveHere(f.id)}
                  disabled={pending}
                  className="w-full border-t border-[color:#e8e2d2] bg-[color:var(--color-navy)] text-[color:var(--color-gold)] text-[10px] tracking-[0.12em] uppercase font-bold py-2 disabled:opacity-60 hover:bg-[color:#0f2a20]"
                >
                  Move {selectedName} here
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={onAddGroup}
          disabled={pending}
          className="w-full rounded-xl border border-dashed border-[color:var(--color-gold)] text-[color:var(--color-gold)] py-3 text-[11px] font-semibold tracking-[0.12em] uppercase hover:bg-[color:#fff8e8]/50 disabled:opacity-60"
        >
          + Add empty group
        </button>
      </div>
    </div>
  );
}
