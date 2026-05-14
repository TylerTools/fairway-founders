'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type MyNotification,
} from '@/app/actions/notifications';

const KIND_LABEL: Record<MyNotification['kind'], string> = {
  broadcast: 'Message',
  access_request: 'Access request',
  feedback: 'Feedback',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MyNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement | null>(null);

  async function refresh() {
    setLoading(true);
    const snap = await getMyNotifications();
    setItems(snap.recent);
    setUnread(snap.unreadCount);
    setLoading(false);
  }

  // Initial fetch on mount (for the unread badge) + poll lightly.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, []);

  // Refresh when opened to get the latest.
  useEffect(() => {
    if (open) refresh();
  }, [open]);

  // Click-outside to close.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function handleClick(n: MyNotification) {
    if (!n.read_at) {
      startTransition(async () => {
        await markNotificationRead(n.id);
        setUnread((u) => Math.max(0, u - 1));
        setItems((arr) =>
          arr.map((x) =>
            x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
          ),
        );
      });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((arr) => arr.map((x) => ({ ...x, read_at: x.read_at ?? now })));
      setUnread(0);
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[color:#f5f1e8]"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[color:#a13c3c] text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[color:#e8e2d2] bg-white shadow-xl z-30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[color:#f0ebd8]">
            <p className="text-[11px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-ink)]">
              Notifications
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[10px] tracking-[0.08em] uppercase font-semibold text-[color:var(--color-gold)]"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[color:var(--color-mute)]">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[color:var(--color-mute)] italic">
                Nothing here yet.
              </p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-[color:#f0ebd8] last:border-b-0 hover:bg-[color:#f5f1e8]/40 ${
                        !n.read_at ? 'bg-[color:#fdf9ee]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read_at && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[color:var(--color-gold)] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] tracking-[0.15em] uppercase font-bold text-[color:var(--color-mute)]">
                            {KIND_LABEL[n.kind]} · {timeAgo(n.created_at)}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold leading-snug text-[color:var(--color-ink)]">
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="mt-0.5 text-xs text-[color:#5a5a4a] leading-snug line-clamp-2">
                              {n.body}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="text-[color:var(--color-ink)]"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
