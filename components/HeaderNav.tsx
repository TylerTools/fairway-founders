'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Database } from '@/lib/database.types';

type AppRole = Database['public']['Enums']['app_role'];

interface Tab {
  href: string;
  label: string;
  roles: AppRole[];
}

const TABS: Tab[] = [
  { href: '/dashboard', label: 'Tee Time', roles: ['member', 'admin', 'course'] },
  { href: '/leaderboard', label: 'Scorecard', roles: ['member', 'admin', 'course'] },
  { href: '/roster', label: 'Roster', roles: ['member', 'admin', 'course'] },
  { href: '/admin', label: 'Admin', roles: ['admin'] },
  { href: '/course', label: 'Course', roles: ['admin', 'course'] },
];

/** Desktop tab strip, lives in the header above lg breakpoint. */
export default function HeaderNav({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  if (!role) return null;
  const visible = TABS.filter((t) => t.roles.includes(role));

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {visible.map((t) => {
        const isActive = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors ${
              isActive
                ? 'text-[color:var(--color-navy)]'
                : 'text-[color:var(--color-mute)] hover:text-[color:var(--color-ink)]'
            }`}
          >
            {t.label}
            {isActive && (
              <span className="absolute left-3 right-3 -bottom-[14px] h-[2px] bg-[color:var(--color-gold)] rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
