'use client';

import { useEffect, useState } from 'react';
import { formatCountdown } from '@/lib/schedule';

export default function Countdown({ to }: { to: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return <>{formatCountdown(target - now)}</>;
}
