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

export default function BottomNav({ role }: { role: AppRole | null }) {
  const pathname = usePathname();
  if (!role) return null;
  const visible = TABS.filter((t) => t.roles.includes(role));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-[color:var(--color-navy)] border-t border-[color:var(--color-gold)] pt-3 pb-5">
      <div className="mx-auto max-w-md flex justify-around">
        {visible.map((t) => {
          const isActive = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center text-[10px] font-semibold tracking-[0.1em] uppercase px-2 ${
                isActive
                  ? 'text-[color:var(--color-gold)]'
                  : 'text-[color:#a8a596]'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
