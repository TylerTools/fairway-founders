'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { liveStatus } from '@/lib/schedule';
import { useSidebarCollapsed, SidebarToggle } from './EventSidebarShell';
import type { Database } from '@/lib/database.types';

type EventRow = Database['public']['Tables']['events']['Row'];

export default function EventSidebar({ events }: { events: EventRow[] }) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('event');
  // Routes that aren't event-driven shouldn't show an active row.
  const eventDrivenRoute =
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/course') ||
    pathname.startsWith('/leaderboard');

  function hrefFor(eventId: string): string {
    if (!eventDrivenRoute) return `/?event=${eventId}`;
    return `${pathname}?event=${eventId}`;
  }

  return (
    <aside
      className={`hidden sm:flex sticky top-[73px] self-start shrink-0 flex-col border-r border-[color:#e8e2d2] bg-[color:var(--color-cream)] transition-[width] duration-200 ${
        collapsed ? 'w-14' : 'w-64'
      }`}
      style={{ minHeight: 'calc(100vh - 73px)' }}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-[color:#e8e2d2]">
        {!collapsed && (
          <p className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[color:var(--color-mute)]">
            Rounds
          </p>
        )}
        <SidebarToggle collapsed={collapsed} onToggle={toggle} />
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {events.length === 0 && !collapsed && (
          <p className="px-3 py-4 text-xs text-[color:var(--color-mute)] italic">
            No events yet.
          </p>
        )}
        {events.map((e) => {
          const status = liveStatus(e);
          const isActive = eventDrivenRoute && (selectedId
            ? selectedId === e.id
            : false);
          const d = new Date(e.date);
          const day = d.toLocaleDateString('en-US', { weekday: 'short' });
          const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayNum = d.getDate().toString();
          const statusLabel =
            status === 'open'
              ? 'Open'
              : status === 'locked'
                ? 'Locked'
                : status === 'closed'
                  ? 'Set'
                  : 'Past';
          const statusColor =
            status === 'open'
              ? '#7c9885'
              : status === 'locked'
                ? '#8a8576'
                : status === 'closed'
                  ? '#c9a961'
                  : '#8a8576';

          if (collapsed) {
            return (
              <Link
                key={e.id}
                href={hrefFor(e.id)}
                title={`${day} ${date} · ${statusLabel}`}
                className={`flex flex-col items-center py-2 rounded-md ${
                  isActive
                    ? 'bg-[color:var(--color-navy)] text-[color:var(--color-cream)]'
                    : 'text-[color:var(--color-ink)] hover:bg-white'
                }`}
              >
                <span
                  className="text-base font-semibold leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {dayNum}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-1.5"
                  style={{ background: isActive ? '#c9a961' : statusColor }}
                />
              </Link>
            );
          }

          return (
            <Link
              key={e.id}
              href={hrefFor(e.id)}
              className={`block rounded-md px-3 py-2.5 ${
                isActive
                  ? 'bg-[color:var(--color-navy)] text-[color:var(--color-cream)]'
                  : 'text-[color:var(--color-ink)] hover:bg-white'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={`text-[9px] font-semibold tracking-[0.15em] uppercase ${
                    isActive ? 'text-[color:#a8a596]' : 'text-[color:var(--color-mute)]'
                  }`}
                >
                  {day}
                </p>
                <p
                  className={`text-[9px] font-bold tracking-[0.1em] uppercase`}
                  style={{ color: isActive ? '#c9a961' : statusColor }}
                >
                  {statusLabel}
                </p>
              </div>
              <p
                className="text-base font-semibold mt-0.5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {date}
              </p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
