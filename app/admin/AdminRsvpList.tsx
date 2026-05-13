'use client';

import { useTransition } from 'react';
import { adminToggleRsvp } from '@/app/actions/rsvp';

interface Member {
  id: string;
  name: string;
  professional_role: string | null;
}

export default function AdminRsvpList({
  eventId,
  members,
  rsvpedIds,
}: {
  eventId: string;
  members: Member[];
  rsvpedIds: string[];
}) {
  const [pending, startTransition] = useTransition();
  const set = new Set(rsvpedIds);

  function toggle(userId: string) {
    startTransition(async () => {
      await adminToggleRsvp(eventId, userId);
    });
  }

  return (
    <ul className="divide-y divide-[color:#f0ebd8]">
      {members.map((m) => {
        const checked = set.has(m.id);
        return (
          <li key={m.id} className="flex items-center gap-3 px-3 py-2.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(m.id)}
              disabled={pending}
              className="w-4 h-4 accent-[color:var(--color-navy)] cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{m.name}</p>
              <p className="text-[11px] text-[color:var(--color-mute)]">
                {m.professional_role}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
