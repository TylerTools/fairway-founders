'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * The floating "back to your game" golf ball. Rendered by PlayNowBall only when
 * the signed-in user has a live round in progress. Hides itself on the scorecard
 * (/leaderboard) — you're already there — and tapping it returns you to it.
 */
export default function BackToGameBall({ href }: { href: string }) {
  const pathname = usePathname();
  if (pathname === '/leaderboard') return null;

  return (
    <Link
      href={href}
      aria-label="Back to your game"
      className="group fixed bottom-28 lg:bottom-6 left-4 lg:left-6 z-30 block"
    >
      <Image
        src="/Start Playing.png"
        alt="Back to your game"
        width={224}
        height={224}
        priority
        className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-2xl transition-transform group-hover:scale-105 group-active:scale-95"
      />
    </Link>
  );
}
