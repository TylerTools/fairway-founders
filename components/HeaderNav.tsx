'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderNavProps {
  signedIn: boolean;
  showAdmin: boolean;
  showCourse: boolean;
}

type TabFlag = 'always' | 'admin' | 'course';

const TABS: { href: string; label: string; flag: TabFlag }[] = [
  { href: '/dashboard', label: 'Tee Time', flag: 'always' },
  { href: '/leaderboard', label: 'Scorecard', flag: 'always' },
  { href: '/roster', label: 'Members', flag: 'always' },
  { href: '/network', label: 'Network', flag: 'always' },
  { href: '/admin', label: 'Admin', flag: 'admin' },
];

/** Desktop tab strip, lives in the header above lg breakpoint. */
export default function HeaderNav({
  signedIn,
  showAdmin,
  showCourse,
}: HeaderNavProps) {
  const pathname = usePathname();
  if (!signedIn) return null;
  const visible = TABS.filter((t) => {
    if (t.flag === 'always') return true;
    if (t.flag === 'admin') return showAdmin;
    if (t.flag === 'course') return showCourse;
    return false;
  });

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
