'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function PublicHeaderLogo() {
  const pathname = usePathname();
  // On the marketing home page when signed-out, keep the header clear so the
  // front-facing hero logo is the only brand mark on screen.
  if (pathname === '/') return null;
  return (
    <Image
      src="/logo.png"
      alt="Fairway Founders Network"
      width={640}
      height={640}
      priority
      className="h-14 sm:h-16 w-auto"
    />
  );
}
