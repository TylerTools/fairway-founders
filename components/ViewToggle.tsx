'use client';

import { useTransition } from 'react';
import { setViewMode } from '@/app/actions/view-mode';
import type { ViewMode } from '@/lib/view-mode';

export default function ViewToggle({ current }: { current: ViewMode }) {
  const [pending, startTransition] = useTransition();

  function flip(target: ViewMode) {
    if (target === current) return;

    startTransition(async () => {
      try {
        await setViewMode(target);
      } catch (e) {
        console.error('setViewMode failed', e);
      }
      // Hard browser navigation guarantees:
      //  - cookie is read fresh on the next request
      //  - layout, bottom nav, route guards all re-render with new view
      //  - no chance of Next.js client-side router caching the old state
      // Flipping to member → land on /dashboard (the signed-in home).
      // Flipping back to admin → land on /admin.
      if (typeof window !== 'undefined') {
        window.location.assign(target === 'member' ? '/dashboard' : '/admin');
      }
    });
  }

  return (
    <div className="inline-flex rounded-full border border-[color:var(--color-gold)]/60 bg-white p-0.5">
      <Btn
        active={current === 'admin'}
        onClick={() => flip('admin')}
        disabled={pending}
      >
        Admin
      </Btn>
      <Btn
        active={current === 'member'}
        onClick={() => flip('member')}
        disabled={pending}
      >
        Member
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors ${
        active
          ? 'bg-[color:var(--color-navy)] text-[color:var(--color-gold)]'
          : 'text-[color:#5a5a4a]'
      } disabled:opacity-60`}
    >
      {children}
    </button>
  );
}
