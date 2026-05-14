'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ff-sidebar-collapsed';

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {}
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  return { collapsed, toggle };
}

export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-center w-7 h-7 rounded-md border border-[color:#e8e2d2] bg-white text-[color:var(--color-mute)] hover:text-[color:var(--color-ink)] hover:border-[color:var(--color-gold)]"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {collapsed ? (
          <path d="M9 18l6-6-6-6" />
        ) : (
          <path d="M15 18l-6-6 6-6" />
        )}
      </svg>
    </button>
  );
}
