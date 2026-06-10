'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function HeaderLogo({ size }: { size: 'large' | 'small' }) {
  const pathname = usePathname();
  // On the home page itself, keep the header clear — the front-facing hero
  // logo is the only brand mark on screen there.
  if (pathname === '/') return null;
  const cls =
    size === 'large' ? 'h-20 sm:h-24 w-auto' : 'h-14 sm:h-16 w-auto';
  return (
    <Image
      src="/logo.png"
      alt="Fairway Founders Network"
      width={640}
      height={640}
      priority
      className={cls}
    />
  );
}
