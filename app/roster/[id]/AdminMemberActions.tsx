'use client';

import { useTransition } from 'react';
import {
  setUserRole,
  banUser,
  unbanUser,
  deleteUser,
} from '@/app/actions/admin-users';
import type { Database } from '@/lib/database.types';

type AppRole = Database['public']['Enums']['app_role'];
type AccessStatus = Database['public']['Enums']['access_status'];

export default function AdminMemberActions({
  userId,
  currentRole,
  currentStatus,
  memberName,
}: {
  userId: string;
  currentRole: AppRole;
  currentStatus: AccessStatus;
  memberName: string;
}) {
  const [pending, startTransition] = useTransition();
  const isBanned = currentStatus === 'denied';

  function changeRole(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value as AppRole;
    if (role === currentRole) return;
    startTransition(() => setUserRole(userId, role));
  }

  function toggleBan() {
    if (isBanned) {
      startTransition(() => unbanUser(userId));
      return;
    }
    if (!confirm(`Ban ${memberName}? They'll lose access immediately.`)) return;
    startTransition(() => banUser(userId));
  }

  function remove() {
    const typed = prompt(
      `Type DELETE to permanently remove ${memberName}. This also wipes their RSVPs and round-history rows.`,
    );
    if (typed !== 'DELETE') return;
    startTransition(() => deleteUser(userId));
  }

  return (
    <section className="mt-4 rounded-xl border border-[color:#a13c3c]/40 bg-[color:#fdf6f6] p-5">
      <p className="text-[10px] tracking-[0.15em] uppercase text-[color:#a13c3c] mb-3 font-bold">
        Admin actions
      </p>

      <label className="block">
        <span className="text-[10px] tracking-[0.1em] uppercase text-[color:var(--color-mute)]">
          Role
        </span>
        <select
          defaultValue={currentRole}
          onChange={changeRole}
          disabled={pending}
          className="mt-1 w-full rounded-md border border-[color:#e8e2d2] bg-white px-3 py-2 text-sm disabled:opacity-60"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="course">Course (pro shop)</option>
        </select>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleBan}
          disabled={pending}
          className={`rounded-md py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60 ${
            isBanned
              ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
              : 'border border-[color:#a13c3c] text-[color:#a13c3c]'
          }`}
        >
          {isBanned ? 'Unban' : 'Ban from network'}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-md bg-[color:#a13c3c] text-white py-2 text-[11px] font-semibold tracking-[0.08em] uppercase disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      <p className="mt-2 text-[10px] text-[color:var(--color-mute)] italic">
        Ban keeps their history. Delete wipes RSVPs and round history.
      </p>
    </section>
  );
}
