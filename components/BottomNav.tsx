'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
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
  { href: '/sponsors', label: 'Sponsors', flag: 'always' },
  { href: '/admin', label: 'Admin', flag: 'admin' },
  { href: '/course', label: 'Course', flag: 'course' },
];

export default function BottomNav({
  signedIn,
  showAdmin,
  showCourse,
}: BottomNavProps) {
  const pathname = usePathname();
  if (!signedIn) return null;
  const visible = TABS.filter((t) => {
    if (t.flag === 'always') return true;
    if (t.flag === 'admin') return showAdmin;
    if (t.flag === 'course') return showCourse;
    return false;
  });

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-[color:var(--color-navy)] border-t border-[color:var(--color-gold)] pt-3 pb-5">
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
