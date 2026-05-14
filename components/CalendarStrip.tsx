'use client';

import { useRouter, usePathname } from 'next/navigation';
import { liveStatus } from '@/lib/schedule';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

export default function CalendarStrip({
  events,
  selectedId,
}: {
  events: EventRow[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (!events.length) return null;

  function select(id: string) {
    const url = new URL(pathname, window.location.origin);
    url.searchParams.set('event', id);
    router.push(`${pathname}?event=${id}`);
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 mb-4"
      style={{ scrollbarWidth: 'none' }}
    >
      {events.map((e) => {
        const status = liveStatus(e);
        const isSelected = e.id === selectedId;
        const d = new Date(e.date);
        const day = d.toLocaleDateString('en-US', { weekday: 'short' });
        const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const opensAt = new Date(e.opens_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const statusLabel =
          status === 'open'
            ? 'OPEN'
            : status === 'locked'
              ? `OPENS ${opensAt}`
              : status === 'closed'
                ? 'GROUPS SET'
                : 'PAST';
        const statusColor =
          status === 'open'
            ? 'text-[color:#7c9885]'
            : status === 'locked'
              ? 'text-[color:var(--color-mute)]'
              : status === 'closed'
                ? 'text-[color:var(--color-gold)]'
                : 'text-[color:var(--color-mute)]';

        return (
          <button
            key={e.id}
            type="button"
            onClick={() => select(e.id)}
            className={`shrink-0 min-w-[96px] text-left rounded-xl px-3 py-2.5 border ${
              isSelected
                ? 'bg-[color:var(--color-navy)] border-[color:var(--color-navy)] text-[color:var(--color-cream)]'
                : 'bg-white border-[color:#e8e2d2] text-[color:var(--color-ink)]'
            }`}
          >
            <p
              className={`text-[9px] font-semibold tracking-[0.15em] ${
                isSelected ? 'text-[color:#a8a596]' : 'text-[color:var(--color-mute)]'
              }`}
            >
              {day.toUpperCase()}
            </p>
            <p
              className="text-base font-semibold my-0.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {date}
            </p>
            <p
              className={`text-[8px] font-bold tracking-[0.1em] ${
                isSelected ? 'text-[color:var(--color-gold)]' : statusColor
              }`}
            >
              {statusLabel}
            </p>
          </button>
        );
      })}
    </div>
  );
}
