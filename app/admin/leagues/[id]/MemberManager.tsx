'use client';

import { useState, useTransition } from 'react';
import {
  addLeagueMember,
  removeLeagueMember,
  setLeagueMemberRole,
} from '@/app/actions/leagues';

interface Membership {
  id: string;
  role: 'member' | 'admin';
  joined_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    professional_role: string | null;
    company: string | null;
  };
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  pending?: boolean;
}

export default function MemberManager({
  leagueId,
  memberships,
  candidates,
  myUserId,
}: {
  leagueId: string;
  memberships: Membership[];
  candidates: Candidate[];
  myUserId: string;
}) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pickUserId, setPickUserId] = useState('');
  const [pickRole, setPickRole] = useState<'member' | 'admin'>('member');

  function flip(userId: string, current: 'member' | 'admin') {
    const next = current === 'admin' ? 'member' : 'admin';
    setError(null);
    startTransition(async () => {
      try {
        await setLeagueMemberRole(leagueId, userId, next);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function onRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this league?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await removeLeagueMember(leagueId, userId);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function onAdd() {
    if (!pickUserId) return;
    setError(null);
    startTransition(async () => {
      try {
        await addLeagueMember(leagueId, pickUserId, pickRole);
        setPickUserId('');
        setPickRole('member');
        setAdding(false);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-[color:#a13c3c]">{error}</p>}

      {memberships.length === 0 ? (
        <p className="text-sm text-[color:var(--color-mute)] italic">
          No members yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {memberships.map((m) => (
            <li
              key={m.id}
              className="rounded-lg border border-[color:#e8e2d2] bg-white ff-card px-3 py-2.5 flex justify-between items-center gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{m.user.name}</p>
                  {m.role === 'admin' && (
                    <span className="text-[9px] tracking-[0.12em] uppercase font-bold bg-[color:var(--color-gold)] text-[color:var(--color-navy)] rounded-full px-2 py-0.5">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[color:var(--color-mute)]">
                  {m.user.email}
                  {m.user.professional_role && ` · ${m.user.professional_role}`}
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => flip(m.user.id, m.role)}
                  disabled={busy}
                  className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-gold)] disabled:opacity-60"
                >
                  {m.role === 'admin' ? 'Demote' : 'Make admin'}
                </button>
                {m.user.id !== myUserId && (
                  <button
                    type="button"
                    onClick={() => onRemove(m.user.id, m.user.name)}
                    disabled={busy}
                    className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:#a13c3c] disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="rounded-xl border border-[color:var(--color-gold)] bg-white p-4 space-y-3">
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
              Member
            </span>
            <select
              value={pickUserId}
              onChange={(e) => setPickUserId(e.target.value)}
              className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
            >
              <option value="">— Pick someone —</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email}){c.pending ? ' — pending' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.15em] uppercase text-[color:var(--color-mute)] font-semibold">
              Role
            </span>
            <select
              value={pickRole}
              onChange={(e) => setPickRole(e.target.value as 'member' | 'admin')}
              className="mt-1 w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
            >
              <option value="member">Member</option>
              <option value="admin">League admin</option>
            </select>
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onAdd}
              disabled={busy || !pickUserId}
              className="rounded-md bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-xs font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs tracking-[0.08em] uppercase text-[color:var(--color-mute)] px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        candidates.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full border border-[color:var(--color-gold)] bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-[color:var(--color-ink)] hover:bg-[color:#f5f1e8]/40"
          >
            + Add member
          </button>
        )
      )}
    </div>
  );
}
