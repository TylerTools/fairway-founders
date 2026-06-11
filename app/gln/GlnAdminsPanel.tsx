'use client';

import { useState, useTransition } from 'react';
import Avatar from '@/components/Avatar';
import { setUserRole } from '@/app/actions/admin-users';

interface GlnAdmin {
  id: string;
  name: string;
  email: string;
  last_active_at: string | null;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

function fmtLastActive(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function GlnAdminsPanel({
  admins,
  candidates,
  myUserId,
}: {
  admins: GlnAdmin[];
  candidates: Candidate[];
  myUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pickId, setPickId] = useState('');

  function promote() {
    if (!pickId) return;
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(pickId, 'super_admin');
        setPickId('');
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  function demote(userId: string, name: string) {
    if (
      !confirm(
        `Remove GLN admin from ${name}? They'll keep their league admin roles (if any).`,
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(userId, 'member');
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-[color:#a13c3c]">{error}</p>}

      {admins.length === 0 ? (
        <p className="text-sm italic text-[color:var(--color-mute)]">
          No GLN admins yet — promote someone below.
        </p>
      ) : (
        <ul className="space-y-2">
          {admins.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-3 flex items-center gap-3"
            >
              <Avatar size={36} rounded="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.name}</p>
                <p className="text-[11px] text-[color:var(--color-mute)] truncate">
                  {a.email} · last active {fmtLastActive(a.last_active_at)}
                </p>
              </div>
              {a.id !== myUserId && (
                <button
                  type="button"
                  onClick={() => demote(a.id, a.name)}
                  disabled={pending}
                  className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[color:var(--color-mute)] hover:text-[color:#a13c3c] disabled:opacity-50"
                >
                  Demote
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 && (
        <div className="rounded-xl border border-[color:#e8e2d2] bg-white ff-card p-4 space-y-3">
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            Promote a member to GLN admin
          </p>
          <select
            value={pickId}
            onChange={(e) => setPickId(e.target.value)}
            className="w-full border border-[color:#e8e2d2] rounded-md px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[color:var(--color-gold)]"
          >
            <option value="">— Pick a member —</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={promote}
            disabled={!pickId || pending}
            className="rounded-md ff-btn ff-btn-pine bg-[color:var(--color-navy)] text-[color:var(--color-gold)] px-4 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-50"
          >
            Promote to GLN admin
          </button>
          <p className="text-[10px] text-[color:var(--color-mute)] italic">
            GLN admins can manage every league, create new leagues, and promote
            others. League-admin roles (per-league) are separate and unchanged
            by this action.
          </p>
        </div>
      )}
    </div>
  );
}
